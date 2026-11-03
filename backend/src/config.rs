use std::env;
use std::path::PathBuf;

#[derive(Clone, Default)]
pub struct Secret(String);

impl Secret {
    pub fn new(value: impl Into<String>) -> Self {
        Self(value.into())
    }
    pub fn expose(&self) -> &str {
        &self.0
    }
    pub fn is_empty(&self) -> bool {
        self.0.is_empty()
    }
}

impl std::fmt::Debug for Secret {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str("***")
    }
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum RegistoModo {
    Fechado,
    Aberto,
}

impl RegistoModo {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Fechado => "fechado",
            Self::Aberto => "aberto",
        }
    }
}

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
    pub registo_modo: String,
    pub email_api_key: Secret,
    pub email_from: Option<String>,
    pub public_base_url: Option<String>,
    pub email_log_file: Option<PathBuf>,
    pub trusted_proxy: bool,
    pub turnstile_secret: Secret,
    pub turnstile_site_key: Option<String>,
    pub registo_dominios_bloqueados: Option<PathBuf>,
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
                .unwrap_or(300),
            attachments_dir: env::var("ATTACHMENTS_DIR")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("./data/attachments")),
            avatars_dir: env::var("AVATARS_DIR")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("./data/avatars")),
            production: production_from_env(),
            rate_limit_disabled: env_flag("MESA_RATE_LIMIT_DISABLED"),
            registo_modo: env::var("REGISTO_MODO").unwrap_or_else(|_| "fechado".into()),
            email_api_key: Secret::new(env::var("EMAIL_API_KEY").unwrap_or_default()),
            email_from: env::var("EMAIL_FROM").ok().filter(|s| !s.trim().is_empty()),
            public_base_url: env::var("PUBLIC_BASE_URL")
                .ok()
                .filter(|s| !s.trim().is_empty()),
            email_log_file: env::var("EMAIL_LOG_FILE")
                .ok()
                .filter(|s| !s.is_empty())
                .map(PathBuf::from),
            trusted_proxy: env_flag("TRUSTED_PROXY"),
            turnstile_secret: Secret::new(env::var("TURNSTILE_SECRET").unwrap_or_default()),
            turnstile_site_key: env::var("TURNSTILE_SITE_KEY")
                .ok()
                .filter(|s| !s.trim().is_empty()),
            registo_dominios_bloqueados: env::var("REGISTO_DOMINIOS_BLOQUEADOS")
                .ok()
                .filter(|s| !s.is_empty())
                .map(PathBuf::from),
        }
    }

    pub fn mode(&self) -> Result<RegistoModo, String> {
        match self.registo_modo.as_str() {
            "fechado" => Ok(RegistoModo::Fechado),
            "aberto" => Ok(RegistoModo::Aberto),
            _ => Err("REGISTO_MODO deve ser fechado ou aberto".into()),
        }
    }

    pub fn uses_example_livekit_keys(&self) -> bool {
        self.livekit_api_key == EXAMPLE_LIVEKIT_API_KEY
            || self.livekit_api_secret == EXAMPLE_LIVEKIT_API_SECRET
    }

    /// Fail closed before bind when the production profile is active.
    pub fn validate(&self) -> Result<(), String> {
        let mode = self.mode()?;
        if self.production && mode == RegistoModo::Aberto {
            if self.email_api_key.is_empty() {
                return Err("REGISTO_MODO=aberto exige EMAIL_API_KEY em produção".into());
            }
            if self.email_from.is_none() {
                return Err("REGISTO_MODO=aberto exige EMAIL_FROM em produção".into());
            }
            let url = self.public_base_url.as_deref().unwrap_or("");
            let parsed = reqwest::Url::parse(url).ok();
            let valid = parsed.as_ref().is_some_and(|value| {
                value.scheme() == "https"
                    && value.host_str().is_some_and(|host| {
                        !host.eq_ignore_ascii_case("localhost")
                            && !host.ends_with(".localhost")
                            && !host
                                .parse::<std::net::IpAddr>()
                                .is_ok_and(|ip| ip.is_loopback())
                    })
                    && value.query().is_none()
                    && value.fragment().is_none()
            });
            if !valid {
                return Err(
                    "REGISTO_MODO=aberto exige PUBLIC_BASE_URL HTTPS pública em produção".into(),
                );
            }
            if !self.trusted_proxy {
                return Err("REGISTO_MODO=aberto exige TRUSTED_PROXY=true em produção".into());
            }
        }
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
