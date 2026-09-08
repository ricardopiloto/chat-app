use crate::db;
use crate::domain::channel::{Channel, ChannelType, ChannelVisibility};
use crate::domain::channel_acl::{AclSubjectType, ChannelAclEntry, PermLevel};
use crate::domain::channel_name;
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
    visibility: Option<ChannelVisibility>,
    custody_ack: Option<bool>,
    channel_key_sealed: Option<&str>,
) -> Result<Channel, ApiError> {
    let name = channel_name::validate_channel_name(&name).map_err(ApiError::bad_request)?;
    let grid_slot_count = match kind {
        ChannelType::VoiceVideo => {
            let n = grid_slot_count.unwrap_or(4);
            if !(2..=8).contains(&n) {
                return Err(ApiError::bad_request("grid_slot_count must be 2–8"));
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

    let visibility = visibility.unwrap_or(ChannelVisibility::Public);
    let mut channel = Channel {
        id: Uuid::new_v4(),
        server_id,
        name,
        kind,
        grid_slot_count,
        created_by_account_id: created_by,
        e2ee_enabled: true,
        has_channel_key: false,
        visibility,
        visible_to_new_members: visibility == ChannelVisibility::Public,
        my_permission: None,
    };
    db::channel::create(pool, &channel).await?;
    if visibility == ChannelVisibility::Private {
        db::channel_acl::upsert(
            pool,
            &ChannelAclEntry {
                id: Uuid::new_v4(),
                channel_id: channel.id,
                subject_type: AclSubjectType::Account,
                subject_id: created_by,
                level: match kind {
                    ChannelType::Text => PermLevel::Write,
                    ChannelType::VoiceVideo => PermLevel::Speak,
                },
                effect: crate::domain::channel_acl::AclEffect::Allow,
            },
        )
        .await?;
    }
    if let Some(blob) = sealed_bytes {
        db::channel_key::insert(pool, channel.id, created_by, &blob).await?;
        channel.has_channel_key = true;
    }
    if let Some(n) = grid_slot_count {
        db::scene::create_default(pool, channel.id, n).await?;
    }
    Ok(channel)
}
