use chat_backend::config::{
    Config, DEFAULT_BIND, EXAMPLE_LIVEKIT_API_KEY, EXAMPLE_LIVEKIT_API_SECRET,
};
use std::path::PathBuf;

fn sample() -> Config {
    Config {
        database_url: "sqlite://:memory:".into(),
        bind: DEFAULT_BIND.into(),
        livekit_url: "ws://127.0.0.1:7880".into(),
        livekit_api_key: "unique-key".into(),
        livekit_api_secret: "unique-secret-unique-secret-12ab".into(),
        egress_file_prefix: None,
        session_ttl_secs: 604_800,
        cookie_secure: true,
        default_invite_ttl_secs: 604_800,
        attachments_dir: PathBuf::from("./data/attachments"),
        avatars_dir: PathBuf::from("./data/avatars"),
        production: true,
        rate_limit_disabled: false,
        registo_modo: "fechado".into(),
        email_api_key: Default::default(),
        email_from: None,
        public_base_url: None,
        email_log_file: None,
        trusted_proxy: false,
        turnstile_secret: Default::default(),
        turnstile_site_key: None,
        registo_dominios_bloqueados: None,
    }
}

#[test]
fn production_rejects_example_keys() {
    let mut cfg = sample();
    cfg.livekit_api_key = EXAMPLE_LIVEKIT_API_KEY.into();
    assert!(cfg.validate().is_err());
    cfg.livekit_api_key = "unique-key".into();
    cfg.livekit_api_secret = EXAMPLE_LIVEKIT_API_SECRET.into();
    assert!(cfg.validate().is_err());
}

#[test]
fn production_requires_cookie_secure() {
    let mut cfg = sample();
    cfg.cookie_secure = false;
    assert!(cfg.validate().is_err());
}

#[test]
fn production_ok_with_unique_keys_and_secure_cookie() {
    assert!(sample().validate().is_ok());
}

#[test]
fn non_production_allows_example_keys() {
    let mut cfg = sample();
    cfg.production = false;
    cfg.cookie_secure = false;
    cfg.livekit_api_key = EXAMPLE_LIVEKIT_API_KEY.into();
    cfg.livekit_api_secret = EXAMPLE_LIVEKIT_API_SECRET.into();
    assert!(cfg.validate().is_ok());
}

#[test]
fn default_bind_is_loopback() {
    assert_eq!(DEFAULT_BIND, "127.0.0.1:8080");
}

#[test]
fn rejects_invalid_registration_mode_in_every_profile() {
    let mut cfg = sample();
    cfg.production = false;
    cfg.registo_modo = "unknown".into();
    assert!(cfg.validate().unwrap_err().contains("REGISTO_MODO"));
}

#[test]
fn open_production_requires_each_security_setting() {
    let mut cfg = sample();
    cfg.registo_modo = "aberto".into();
    assert!(cfg.validate().unwrap_err().contains("EMAIL_API_KEY"));
    cfg.email_api_key = chat_backend::config::Secret::new("private-api-key");
    assert!(cfg.validate().unwrap_err().contains("EMAIL_FROM"));
    cfg.email_from = Some("Mesa <noreply@example.com>".into());
    assert!(cfg.validate().unwrap_err().contains("PUBLIC_BASE_URL"));
    cfg.public_base_url = Some("http://example.com".into());
    assert!(cfg.validate().unwrap_err().contains("PUBLIC_BASE_URL"));
    cfg.public_base_url = Some("https://localhost".into());
    assert!(cfg.validate().unwrap_err().contains("PUBLIC_BASE_URL"));
    cfg.public_base_url = Some("https://127.0.0.2".into());
    assert!(cfg.validate().unwrap_err().contains("PUBLIC_BASE_URL"));
    cfg.public_base_url = Some("https://mesa.example.com".into());
    assert!(cfg.validate().unwrap_err().contains("TRUSTED_PROXY"));
    cfg.trusted_proxy = true;
    assert!(cfg.validate().is_ok());
    cfg.turnstile_secret = chat_backend::config::Secret::new("private-turnstile-key");
    let debug = format!("{cfg:?}");
    assert!(!debug.contains("private-api-key"));
    assert!(!debug.contains("private-turnstile-key"));
}
