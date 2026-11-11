use crate::api::auth::session::AuthUser;
use crate::api::authz::require_channel_view;
use crate::db;
use crate::domain::channel::ChannelType;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, State};
use axum::Json;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// Curated product subset of the dice-box-threejs colour and texture names.
const PRESETS: &[&str] = &["white", "black", "rainbow"];
const TEXTURES: &[&str] = &["", "wood", "marble", "metal"];
const MATERIALS: &[&str] = &["none", "metal", "wood", "glass", "plastic"];

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(tag = "mode", rename_all = "snake_case", deny_unknown_fields)]
pub enum DiceColor {
    Preset { preset: String },
    Custom { foreground: String, background: String },
}

#[derive(Clone, Debug, Deserialize, Serialize, PartialEq)]
#[serde(deny_unknown_fields)]
pub struct DiceAppearance {
    pub color: DiceColor,
    pub material: String,
    pub texture: String,
    pub sound: bool,
}

impl Default for DiceAppearance {
    fn default() -> Self {
        Self { color: DiceColor::Preset { preset: "white".into() }, material: "glass".into(), texture: String::new(), sound: false }
    }
}

impl DiceAppearance {
    pub fn validate(&self) -> Result<(), ApiError> {
        let valid_color = match &self.color {
            DiceColor::Preset { preset } => PRESETS.contains(&preset.as_str()),
            DiceColor::Custom { foreground, background } => valid_hex(foreground) && valid_hex(background),
        };
        if !valid_color || !MATERIALS.contains(&self.material.as_str()) || !TEXTURES.contains(&self.texture.as_str()) {
            return Err(ApiError::bad_request("invalid dice appearance"));
        }
        Ok(())
    }
}

fn valid_hex(value: &str) -> bool {
    value.len() == 7 && value.starts_with('#') && value[1..].bytes().all(|byte| byte.is_ascii_hexdigit())
}

pub async fn load(pool: &sqlx::SqlitePool, account_id: Uuid, channel_id: Uuid) -> Result<DiceAppearance, ApiError> {
    let Some(raw) = db::dice_appearance::find(pool, account_id, channel_id).await? else { return Ok(DiceAppearance::default()); };
    let appearance: DiceAppearance = serde_json::from_str(&raw).map_err(|_| ApiError::internal("invalid stored dice appearance"))?;
    appearance.validate()?;
    Ok(appearance)
}

async fn require_dice_channel(state: &AppState, account_id: Uuid, channel_id: Uuid) -> Result<(), ApiError> {
    let (channel, _, _) = require_channel_view(&state.pool, account_id, channel_id).await?;
    if !matches!(channel.kind, ChannelType::Text | ChannelType::Dice) {
        return Err(ApiError::bad_request("dice appearance requires a text or dice channel"));
    }
    Ok(())
}

pub async fn get(State(state): State<AppState>, AuthUser(account): AuthUser, Path(channel_id): Path<Uuid>) -> Result<Json<DiceAppearance>, ApiError> {
    require_dice_channel(&state, account.id, channel_id).await?;
    Ok(Json(load(&state.pool, account.id, channel_id).await?))
}

pub async fn put(State(state): State<AppState>, AuthUser(account): AuthUser, Path(channel_id): Path<Uuid>, Json(appearance): Json<DiceAppearance>) -> Result<Json<DiceAppearance>, ApiError> {
    require_dice_channel(&state, account.id, channel_id).await?;
    appearance.validate()?;
    let raw = serde_json::to_string(&appearance).map_err(|_| ApiError::internal("failed to serialize dice appearance"))?;
    db::dice_appearance::upsert(&state.pool, account.id, channel_id, &raw).await?;
    Ok(Json(appearance))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn validates_defaults_and_rejects_invalid_values() {
        assert!(DiceAppearance::default().validate().is_ok());
        let mut value = DiceAppearance::default();
        value.material = "rubber".into();
        assert!(value.validate().is_err());
        value.material = "glass".into();
        value.color = DiceColor::Custom { foreground: "#Aa00ff".into(), background: "#123456".into() };
        assert!(value.validate().is_ok());
        value.color = DiceColor::Custom { foreground: "#12345".into(), background: "#123456".into() };
        assert!(value.validate().is_err());
    }
}
