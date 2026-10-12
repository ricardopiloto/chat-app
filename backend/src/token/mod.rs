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
    can_publish: bool,
    hidden: bool,
) -> Result<VoiceToken, String> {
    let token = AccessToken::with_api_key(&config.livekit_api_key, &config.livekit_api_secret)
        .with_identity(identity)
        .with_name(name)
        .with_ttl(Duration::from_secs(600))
        .with_grants(VideoGrants {
            room_join: true,
            room: room.to_string(),
            can_publish,
            can_subscribe: true,
            hidden,
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::config::Config;
    use std::path::PathBuf;

    fn config() -> Config {
        Config {
            database_url: "sqlite://:memory:".into(),
            bind: "127.0.0.1:0".into(),
            livekit_url: "ws://127.0.0.1:7880".into(),
            livekit_api_key: "instkey".into(),
            livekit_api_secret: "instsecretinstsecretinstsecret12".into(),
            egress_file_prefix: None,
            session_ttl_secs: 600,
            cookie_secure: false,
            default_invite_ttl_secs: 600,
            attachments_dir: PathBuf::from("/tmp"),
            avatars_dir: PathBuf::from("/tmp"),
            production: false,
            rate_limit_disabled: true,
        }
    }

    fn video(token: &str) -> serde_json::Value {
        let payload = token.split('.').nth(1).unwrap();
        let mut padded = payload.replace('-', "+").replace('_', "/");
        while padded.len() % 4 != 0 {
            padded.push('=');
        }
        let decoded = base64::Engine::decode(&base64::engine::general_purpose::STANDARD, &padded).unwrap();
        serde_json::from_slice(&decoded).unwrap()
    }

    #[test]
    fn hidden_grant_is_set_only_when_asked() {
        let hidden = mint(&config(), "acct:popout", "room", "Ada", false, true).unwrap();
        let claims = video(&hidden.token);
        assert_eq!(claims["video"]["hidden"], true);
        assert_eq!(claims["video"]["canPublish"], false);
        assert_eq!(claims["sub"], "acct:popout");

        let visible = mint(&config(), "acct", "room", "Ada", true, false).unwrap();
        let claims = video(&visible.token);
        assert_eq!(claims["video"]["hidden"], false);
        assert_eq!(claims["sub"], "acct");
    }
}
