use crate::db::parse_time;
use crate::domain::channel_mute::ChannelMute;
use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    channel_id: String,
    account_id: String,
    muted_by_account_id: String,
    created_at: String,
    ends_at: String,
}

fn map_row(row: Row) -> Result<ChannelMute, sqlx::Error> {
    Ok(ChannelMute {
        channel_id: Uuid::parse_str(&row.channel_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        account_id: Uuid::parse_str(&row.account_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        muted_by_account_id: Uuid::parse_str(&row.muted_by_account_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        created_at: parse_time(&row.created_at)?,
        ends_at: parse_time(&row.ends_at)?,
    })
}

/// Upsert mute for (channel, account). Replaces duration/actor timestamps.
pub async fn upsert(
    pool: &SqlitePool,
    mute: &ChannelMute,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO channel_mute (channel_id, account_id, muted_by_account_id, created_at, ends_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(channel_id, account_id) DO UPDATE SET
           muted_by_account_id = excluded.muted_by_account_id,
           created_at = excluded.created_at,
           ends_at = excluded.ends_at",
    )
    .bind(mute.channel_id.to_string())
    .bind(mute.account_id.to_string())
    .bind(mute.muted_by_account_id.to_string())
    .bind(mute.created_at.to_rfc3339())
    .bind(mute.ends_at.to_rfc3339())
    .execute(pool)
    .await?;
    Ok(())
}

/// Active mute if row exists and `ends_at > now` (lazy expiry).
pub async fn get_active(
    pool: &SqlitePool,
    channel_id: Uuid,
    account_id: Uuid,
    now: DateTime<Utc>,
) -> Result<Option<ChannelMute>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT channel_id, account_id, muted_by_account_id, created_at, ends_at
         FROM channel_mute WHERE channel_id = ? AND account_id = ?",
    )
    .bind(channel_id.to_string())
    .bind(account_id.to_string())
    .fetch_optional(pool)
    .await?;
    let Some(row) = row else {
        return Ok(None);
    };
    let mute = map_row(row)?;
    if mute.is_active(now) {
        Ok(Some(mute))
    } else {
        Ok(None)
    }
}

pub async fn delete(
    pool: &SqlitePool,
    channel_id: Uuid,
    account_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM channel_mute WHERE channel_id = ? AND account_id = ?")
        .bind(channel_id.to_string())
        .bind(account_id.to_string())
        .execute(pool)
        .await?;
    Ok(result.rows_affected() != 0)
}

/// Active mutes for a channel (lazy filter by ends_at).
pub async fn list_active_for_channel(
    pool: &SqlitePool,
    channel_id: Uuid,
    now: DateTime<Utc>,
) -> Result<Vec<ChannelMute>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Row>(
        "SELECT channel_id, account_id, muted_by_account_id, created_at, ends_at
         FROM channel_mute WHERE channel_id = ?",
    )
    .bind(channel_id.to_string())
    .fetch_all(pool)
    .await?;
    let mut out = Vec::new();
    for row in rows {
        let mute = map_row(row)?;
        if mute.is_active(now) {
            out.push(mute);
        }
    }
    Ok(out)
}

/// Remove all mutes for an account on channels belonging to a server (kick cleanup).
pub async fn delete_for_account_on_server(
    pool: &SqlitePool,
    server_id: Uuid,
    account_id: Uuid,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "DELETE FROM channel_mute
         WHERE account_id = ?
           AND channel_id IN (SELECT id FROM channel WHERE server_id = ?)",
    )
    .bind(account_id.to_string())
    .bind(server_id.to_string())
    .execute(pool)
    .await?;
    Ok(result.rows_affected())
}
