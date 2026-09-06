use axum::extract::ConnectInfo;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use std::collections::{HashMap, VecDeque};
use std::net::{IpAddr, SocketAddr};
use std::sync::Mutex;
use std::time::{Duration, Instant};

const AUTH_LIMIT: usize = 10;
const AUTH_WINDOW: Duration = Duration::from_secs(60);

/// In-process sliding window keyed by client IP (TCP peer; X-Forwarded-For ignored).
#[derive(Debug)]
pub struct RateLimiter {
    inner: Mutex<HashMap<String, VecDeque<Instant>>>,
}

impl RateLimiter {
    pub fn new() -> Self {
        Self {
            inner: Mutex::new(HashMap::new()),
        }
    }

    /// Returns true if the request is allowed.
    pub fn check(&self, key: &str, limit: usize, window: Duration) -> bool {
        let now = Instant::now();
        let mut map = self.inner.lock().expect("rate limiter mutex");
        let q = map.entry(key.to_string()).or_default();
        while q.front().is_some_and(|t| now.saturating_duration_since(*t) > window) {
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
}
