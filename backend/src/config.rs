use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub bind: String,
    pub livekit_url: String,
    pub livekit_api_key: String,
    pub livekit_api_secret: String,
    pub session_ttl_secs: i64,
    pub cookie_secure: bool,
    pub default_invite_ttl_secs: i64,
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "sqlite://chat.db?mode=rwc".into()),
            bind: env::var("BIND").unwrap_or_else(|_| "0.0.0.0:8080".into()),
            livekit_url: env::var("LIVEKIT_WS_URL")
                .unwrap_or_else(|_| "ws://127.0.0.1:7880".into()),
            livekit_api_key: env::var("LIVEKIT_API_KEY").unwrap_or_else(|_| "instkey".into()),
            livekit_api_secret: env::var("LIVEKIT_API_SECRET")
                .unwrap_or_else(|_| "instsecretinstsecretinstsecret12".into()),
            session_ttl_secs: env::var("SESSION_TTL_SECS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(604_800),
            cookie_secure: env::var("COOKIE_SECURE")
                .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
                .unwrap_or(false),
            default_invite_ttl_secs: env::var("DEFAULT_INVITE_TTL_SECS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(604_800),
        }
    }
}
