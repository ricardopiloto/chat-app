use crate::db;
use crate::domain::channel::Channel;
use crate::domain::membership::Membership;
use crate::error::ApiError;
use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn require_member(
    pool: &SqlitePool,
    account_id: Uuid,
    server_id: Uuid,
) -> Result<(), ApiError> {
    if db::membership::exists(pool, account_id, server_id).await? {
        Ok(())
    } else {
        Err(ApiError::forbidden("not a member of this server"))
    }
}

pub async fn require_channel_member(
    pool: &SqlitePool,
    account_id: Uuid,
    channel_id: Uuid,
) -> Result<(Channel, Membership), ApiError> {
    let channel = db::channel::find_by_id(pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    require_member(pool, account_id, channel.server_id).await?;
    let membership = db::membership::find(pool, account_id, channel.server_id)
        .await?
        .ok_or_else(|| ApiError::forbidden("not a member of this server"))?;
    Ok((channel, membership))
}

/// `None` = full history. `Some(t)` = messages at or after `t` (invite without include_history).
pub async fn history_visible_since(
    pool: &SqlitePool,
    membership: &Membership,
) -> Result<Option<DateTime<Utc>>, ApiError> {
    let Some(invite_id) = membership.joined_via_invite_id else {
        return Ok(None);
    };
    let Some(invite) = db::invite::find_by_id(pool, invite_id).await? else {
        return Ok(Some(membership.joined_at));
    };
    if invite.include_history {
        Ok(None)
    } else {
        Ok(Some(membership.joined_at))
    }
}
