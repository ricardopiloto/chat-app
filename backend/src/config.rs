use std::env;
use std::path::PathBuf;

/// LiveKit API key shipped for LAN / 30-minute setup. Refused when production profile is on.
pub const EXAMPLE_LIVEKIT_API_KEY: &str = "instkey";
/// LiveKit API secret shipped for LAN / 30-minute setup. Refused when production profile is on.
pub const EXAMPLE_LIVEKIT_API_SECRET: &str = "instsecretinstsecretinstsecret12";

pub const DEFAULT_BIND: &str = "127.0.0.1:8080";

#[derive(Clone, Debug)]
pub struct Config {
    pub database_url: String,
    pub bind: String,
    pub livekit_url: String,
    pub livekit_api_key: String,
    pub livekit_api_secret: String,
    /// When set, Gravar attempts Room Composite file egress under this path prefix.
    pub egress_file_prefix: Option<String>,
    pub session_ttl_secs: i64,
    pub cookie_secure: bool,
    pub default_invite_ttl_secs: i64,
    /// Opaque ciphertext attachment blobs (client-encrypted).
    pub attachments_dir: PathBuf,
    /// Plaintext user/server avatar images.
    pub avatars_dir: PathBuf,
    /// `MESA_PRODUCTION=1|true` or `MESA_ENV=production`.
    pub production: bool,
    /// When true, login/register skip the in-process IP limiter (TestApp default).
    pub rate_limit_disabled: bool,
}

fn env_flag(name: &str) -> bool {
    env::var(name)
        .map(|v| v == "1" || v.eq_ignore_ascii_case("true"))
        .unwrap_or(false)
}

pub fn production_from_env() -> bool {
    env_flag("MESA_PRODUCTION")
        || env::var("MESA_ENV")
            .map(|v| v.eq_ignore_ascii_case("production"))
            .unwrap_or(false)
}

impl Config {
    pub fn from_env() -> Self {
        Self {
            database_url: env::var("DATABASE_URL")
                .unwrap_or_else(|_| "sqlite://chat.db?mode=rwc".into()),
            bind: env::var("BIND").unwrap_or_else(|_| DEFAULT_BIND.into()),
            livekit_url: env::var("LIVEKIT_WS_URL")
                .unwrap_or_else(|_| "ws://127.0.0.1:7880".into()),
            livekit_api_key: env::var("LIVEKIT_API_KEY")
                .unwrap_or_else(|_| EXAMPLE_LIVEKIT_API_KEY.into()),
            livekit_api_secret: env::var("LIVEKIT_API_SECRET")
                .unwrap_or_else(|_| EXAMPLE_LIVEKIT_API_SECRET.into()),
            egress_file_prefix: env::var("LIVEKIT_EGRESS_FILE_PREFIX")
                .ok()
                .filter(|s| !s.is_empty()),
            session_ttl_secs: env::var("SESSION_TTL_SECS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(604_800),
            cookie_secure: env_flag("COOKIE_SECURE"),
            default_invite_ttl_secs: env::var("DEFAULT_INVITE_TTL_SECS")
                .ok()
                .and_then(|s| s.parse().ok())
                .unwrap_or(604_800),
            attachments_dir: env::var("ATTACHMENTS_DIR")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("./data/attachments")),
            avatars_dir: env::var("AVATARS_DIR")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("./data/avatars")),
            production: production_from_env(),
            rate_limit_disabled: env_flag("MESA_RATE_LIMIT_DISABLED"),
        }
    }

    pub fn uses_example_livekit_keys(&self) -> bool {
        self.livekit_api_key == EXAMPLE_LIVEKIT_API_KEY
            || self.livekit_api_secret == EXAMPLE_LIVEKIT_API_SECRET
    }

    /// Fail closed before bind when the production profile is active.
    pub fn validate(&self) -> Result<(), String> {
        if !self.production {
            return Ok(());
        }
        if self.uses_example_livekit_keys() {
            return Err(
                "MESA_PRODUCTION: recuse LIVEKIT_API_KEY=instkey e LIVEKIT_API_SECRET de exemplo; use chaves únicas"
                    .into(),
            );
        }
        if !self.cookie_secure {
            return Err("MESA_PRODUCTION exige COOKIE_SECURE=true".into());
        }
        Ok(())
    }
}
