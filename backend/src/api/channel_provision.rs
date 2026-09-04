use crate::db;
use crate::domain::channel::{Channel, ChannelType};
use crate::error::ApiError;
use base64::Engine;
use sqlx::SqlitePool;
use uuid::Uuid;

/// Shared channel insert used by `POST …/channels` and server bootstrap.
pub async fn provision_channel(
    pool: &SqlitePool,
    server_id: Uuid,
    created_by: Uuid,
    name: String,
    kind: ChannelType,
    grid_slot_count: Option<i64>,
    custody_ack: Option<bool>,
    channel_key_sealed: Option<&str>,
) -> Result<Channel, ApiError> {
    let name = name.trim().to_string();
    if name.is_empty() {
        return Err(ApiError::bad_request("name required"));
    }
    let grid_slot_count = match kind {
        ChannelType::VoiceVideo => {
            let n = grid_slot_count.unwrap_or(4);
            if !(2..=4).contains(&n) {
                return Err(ApiError::bad_request("grid_slot_count must be 2–4"));
            }
            Some(n)
        }
        ChannelType::Text => None,
    };

    let sealed_bytes = if kind == ChannelType::VoiceVideo {
        if custody_ack != Some(true) {
            return Err(ApiError::bad_request(
                "custody_ack required for voice channels",
            ));
        }
        let sealed = channel_key_sealed
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .ok_or_else(|| ApiError::bad_request("channel_key_sealed required"))?;
        Some(
            base64::engine::general_purpose::STANDARD
                .decode(sealed)
                .map_err(|_| ApiError::bad_request("channel_key_sealed must be base64"))?,
        )
    } else {
        None
    };

    let mut channel = Channel {
        id: Uuid::new_v4(),
        server_id,
        name,
        kind,
        grid_slot_count,
        created_by_account_id: created_by,
        e2ee_enabled: true,
        has_channel_key: false,
    };
    db::channel::create(pool, &channel).await?;
    if let Some(blob) = sealed_bytes {
        db::channel_key::insert(pool, channel.id, created_by, &blob).await?;
        channel.has_channel_key = true;
    }
    if let Some(n) = grid_slot_count {
        db::scene::create_default(pool, channel.id, n).await?;
    }
    Ok(channel)
}
