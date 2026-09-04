use crate::config::Config;
use livekit_api::access_token::{AccessToken, VideoGrants};
use std::time::Duration;

pub struct VoiceToken {
    pub token: String,
    pub url: String,
    pub room: String,
}

/// LiveKit API secret is used only in this module (FR-014).
pub fn mint(
    config: &Config,
    identity: &str,
    room: &str,
    name: &str,
) -> Result<VoiceToken, String> {
    let token = AccessToken::with_api_key(&config.livekit_api_key, &config.livekit_api_secret)
        .with_identity(identity)
        .with_name(name)
        .with_ttl(Duration::from_secs(600))
        .with_grants(VideoGrants {
            room_join: true,
            room: room.to_string(),
            ..Default::default()
        })
        .to_jwt()
        .map_err(|e| e.to_string())?;
    Ok(VoiceToken {
        token,
        url: config.livekit_url.clone(),
        room: room.to_string(),
    })
}

pub fn signaling_url(config: &Config, host_header: Option<&str>) -> String {
    let host = host_header.unwrap_or("");
    let hostname = host.split(':').next().unwrap_or("");
    if hostname.is_empty() || hostname == "127.0.0.1" || hostname == "localhost" {
        return config.livekit_url.clone();
    }
    let secure = config.livekit_url.starts_with("wss://");
    let scheme = if secure { "wss" } else { "ws" };
    format!("{scheme}://{hostname}:7880")
}
