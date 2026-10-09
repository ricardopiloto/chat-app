use axum::extract::ConnectInfo;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use std::collections::{HashMap, VecDeque};
use std::net::{IpAddr, SocketAddr};
use std::sync::Mutex;
use std::time::{Duration, Instant};

const AUTH_LIMIT: usize = 10;
const AUTH_WINDOW: Duration = Duration::from_secs(60);
// Handle availability is queried while typing, so it gets a roomier bucket of its own.
const HANDLE_CHECK_LIMIT: usize = 60;
const RECOVERY_LIMIT: usize = 5;
const RECOVERY_WINDOW: Duration = Duration::from_secs(60 * 60);
const MAX_BUCKETS: usize = 4096;
const MAX_RECOVERY_HANDLE_BYTES: usize = 256;

#[derive(Debug, Default)]
struct RecoveryBucket {
    failures: VecDeque<Instant>,
    in_flight: usize,
}

/// In-process sliding window keyed by client IP (TCP peer; X-Forwarded-For ignored).
#[derive(Debug)]
pub struct RateLimiter {
    inner: Mutex<HashMap<String, VecDeque<Instant>>>,
    recovery: Mutex<HashMap<String, RecoveryBucket>>,
}

/// Reserves one of five per-handle attempts until the request reports success or failure.
/// Dropping without success counts as a failure (including cancelled requests).
pub struct RecoveryAttempt<'a> {
    limiter: &'a RateLimiter,
    handle: String,
    succeeded: bool,
}

impl RecoveryAttempt<'_> {
    pub fn success(&mut self) {
        self.succeeded = true;
    }
}

impl Drop for RecoveryAttempt<'_> {
    fn drop(&mut self) {
        let mut buckets = self
            .limiter
            .recovery
            .lock()
            .expect("recovery limiter mutex");
        if let Some(bucket) = buckets.get_mut(&self.handle) {
            bucket.in_flight = bucket.in_flight.saturating_sub(1);
            if !self.succeeded {
                bucket.failures.push_back(Instant::now());
            }
            if bucket.in_flight == 0 && bucket.failures.is_empty() {
                buckets.remove(&self.handle);
            }
        }
    }
}

impl RateLimiter {
    pub fn new() -> Self {
        Self {
            inner: Mutex::new(HashMap::new()),
            recovery: Mutex::new(HashMap::new()),
        }
    }

    /// Returns true if the request is allowed.
    pub fn check(&self, key: &str, limit: usize, window: Duration) -> bool {
        let now = Instant::now();
        let mut map = self.inner.lock().expect("rate limiter mutex");
        map.retain(|_, attempts| {
            while attempts
                .front()
                .is_some_and(|t| now.saturating_duration_since(*t) > window)
            {
                attempts.pop_front();
            }
            !attempts.is_empty()
        });
        if !map.contains_key(key) && map.len() >= MAX_BUCKETS {
            return false;
        }
        let q = map.entry(key.to_string()).or_default();
        while q
            .front()
            .is_some_and(|t| now.saturating_duration_since(*t) > window)
        {
            q.pop_front();
        }
        if q.len() >= limit {
            return false;
        }
        q.push_back(now);
        true
    }

    pub fn allow_auth(&self, ip: Option<IpAddr>) -> bool {
        let key = ip
            .map(|a| a.to_string())
            .unwrap_or_else(|| "unknown".into());
        self.check(&key, AUTH_LIMIT, AUTH_WINDOW)
    }

    pub fn allow_handle_check(&self, ip: Option<IpAddr>) -> bool {
        let who = ip
            .map(|a| a.to_string())
            .unwrap_or_else(|| "unknown".into());
        self.check(
            &format!("handle-check:{who}"),
            HANDLE_CHECK_LIMIT,
            AUTH_WINDOW,
        )
    }

    pub fn start_recovery_attempt(&self, handle: &str) -> Option<RecoveryAttempt<'_>> {
        let normalized = handle.trim().to_lowercase();
        if normalized.is_empty() || normalized.len() > MAX_RECOVERY_HANDLE_BYTES {
            return None;
        }
        let now = Instant::now();
        let mut buckets = self.recovery.lock().expect("recovery limiter mutex");
        buckets.retain(|_, bucket| {
            while bucket
                .failures
                .front()
                .is_some_and(|t| now.saturating_duration_since(*t) > RECOVERY_WINDOW)
            {
                bucket.failures.pop_front();
            }
            !bucket.failures.is_empty() || bucket.in_flight > 0
        });
        if !buckets.contains_key(&normalized) && buckets.len() >= MAX_BUCKETS {
            return None;
        }
        let bucket = buckets.entry(normalized.clone()).or_default();
        if bucket.failures.len() + bucket.in_flight >= RECOVERY_LIMIT {
            return None;
        }
        bucket.in_flight += 1;
        Some(RecoveryAttempt {
            limiter: self,
            handle: normalized,
            succeeded: false,
        })
    }
}

impl Default for RateLimiter {
    fn default() -> Self {
        Self::new()
    }
}

/// Optional TCP peer IP. Missing in `TestApp` oneshot (no ConnectInfo).
pub struct ClientIp(pub Option<IpAddr>);

impl<S: Send + Sync> FromRequestParts<S> for ClientIp {
    type Rejection = std::convert::Infallible;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        Ok(ClientIp(
            parts
                .extensions
                .get::<ConnectInfo<SocketAddr>>()
                .map(|c| c.0.ip()),
        ))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tenth_allowed_eleventh_denied() {
        let lim = RateLimiter::new();
        for _ in 0..10 {
            assert!(lim.check("k", 10, Duration::from_secs(60)));
        }
        assert!(!lim.check("k", 10, Duration::from_secs(60)));
    }

    #[test]
    fn recovery_failures_are_per_normalized_handle_not_ip_and_bounded() {
        let lim = RateLimiter::new();
        for _ in 0..5 {
            drop(lim.start_recovery_attempt(" Alice ").unwrap());
        }
        assert!(lim.start_recovery_attempt("ALICE").is_none());
        assert!(lim.start_recovery_attempt("bob").is_some());
        assert!(lim
            .start_recovery_attempt(&"x".repeat(MAX_RECOVERY_HANDLE_BYTES + 1))
            .is_none());
        for i in 0..MAX_BUCKETS {
            drop(lim.start_recovery_attempt(&format!("random{i}")));
        }
        assert!(lim.start_recovery_attempt("one-more").is_none());
        assert!(lim.recovery.lock().unwrap().len() <= MAX_BUCKETS);
    }

    #[test]
    fn successful_recovery_does_not_use_failure_quota() {
        let lim = RateLimiter::new();
        for _ in 0..10 {
            let mut attempt = lim.start_recovery_attempt("alice").unwrap();
            attempt.success();
        }
    }
}
