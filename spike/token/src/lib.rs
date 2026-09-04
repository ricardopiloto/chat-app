use livekit_api::access_token::{AccessToken, VideoGrants};
use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Clone)]
pub struct AppState {
    pub api_key: String,
    pub api_secret: String,
    pub ws_url: String,
}

#[derive(Debug, Deserialize)]
pub struct TokenRequest {
    pub identity: String,
    pub room: String,
    pub name: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct TokenResponse {
    pub token: String,
    pub url: String,
}

#[derive(Debug, Serialize)]
pub struct ErrorBody {
    pub error: String,
}

pub fn mint_jwt(state: &AppState, req: &TokenRequest) -> Result<String, String> {
    let name = req
        .name
        .clone()
        .unwrap_or_else(|| req.identity.clone());
    AccessToken::with_api_key(&state.api_key, &state.api_secret)
        .with_identity(&req.identity)
        .with_name(&name)
        .with_ttl(Duration::from_secs(600))
        .with_grants(VideoGrants {
            room_join: true,
            room: req.room.clone(),
            ..Default::default()
        })
        .to_jwt()
        .map_err(|e| e.to_string())
}

pub fn validate_request(req: &TokenRequest) -> Result<(), &'static str> {
    if req.identity.is_empty() || req.room != "spike-room" {
        Err("identity required and room must be spike-room")
    } else {
        Ok(())
    }
}
