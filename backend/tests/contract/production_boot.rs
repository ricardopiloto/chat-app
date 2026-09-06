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
