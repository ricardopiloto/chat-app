use crate::domain::voice_occupancy::{
    ChannelOccupancy, OccupantView, VoiceOccupancyResponse, VoiceOccupant, OCCUPANT_STALE_SECS,
};
use chrono::{DateTime, Duration, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct OccupantRow {
    account_id: String,
    channel_id: String,
    server_id: String,
    mic_on: i64,
    cam_on: i64,
    joined_at: String,
    last_seen_at: String,
}

#[derive(sqlx::FromRow)]
struct OccupantViewRow {
    account_id: String,
    handle: String,
    mic_on: i64,
    cam_on: i64,
    has_avatar: i64,
}

fn map_occupant(row: OccupantRow) -> Result<VoiceOccupant, sqlx::Error> {
    Ok(VoiceOccupant {
        account_id: Uuid::parse_str(&row.account_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        channel_id: Uuid::parse_str(&row.channel_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        server_id: Uuid::parse_str(&row.server_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        mic_on: row.mic_on != 0,
        cam_on: row.cam_on != 0,
        joined_at: crate::db::parse_time(&row.joined_at)?,
        last_seen_at: crate::db::parse_time(&row.last_seen_at)?,
    })
}

fn map_view(row: OccupantViewRow) -> Result<OccupantView, sqlx::Error> {
    Ok(OccupantView {
        account_id: Uuid::parse_str(&row.account_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        handle: row.handle,
        mic_on: row.mic_on != 0,
        cam_on: row.cam_on != 0,
        has_avatar: row.has_avatar != 0,
    })
}

pub async fn find_by_account(
    pool: &SqlitePool,
    account_id: Uuid,
) -> Result<Option<VoiceOccupant>, sqlx::Error> {
    let row = sqlx::query_as::<_, OccupantRow>(
        "SELECT account_id, channel_id, server_id, mic_on, cam_on, joined_at, last_seen_at
         FROM voice_occupant WHERE account_id = ?",
    )
    .bind(account_id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(map_occupant).transpose()
}

pub async fn insert(
    pool: &SqlitePool,
    occupant: &VoiceOccupant,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO voice_occupant
         (account_id, channel_id, server_id, mic_on, cam_on, joined_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(occupant.account_id.to_string())
    .bind(occupant.channel_id.to_string())
    .bind(occupant.server_id.to_string())
    .bind(if occupant.mic_on { 1 } else { 0 })
    .bind(if occupant.cam_on { 1 } else { 0 })
    .bind(occupant.joined_at.to_rfc3339())
    .bind(occupant.last_seen_at.to_rfc3339())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn delete_by_account(
    pool: &SqlitePool,
    account_id: Uuid,
) -> Result<Option<VoiceOccupant>, sqlx::Error> {
    let existing = find_by_account(pool, account_id).await?;
    if existing.is_some() {
        sqlx::query("DELETE FROM voice_occupant WHERE account_id = ?")
            .bind(account_id.to_string())
            .execute(pool)
            .await?;
    }
    Ok(existing)
}

pub async fn count_in_channel(pool: &SqlitePool, channel_id: Uuid) -> Result<i64, sqlx::Error> {
    let (n,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM voice_occupant WHERE channel_id = ?")
        .bind(channel_id.to_string())
        .fetch_one(pool)
        .await?;
    Ok(n)
}

pub async fn touch_last_seen(
    pool: &SqlitePool,
    account_id: Uuid,
    channel_id: Uuid,
    now: DateTime<Utc>,
) -> Result<bool, sqlx::Error> {
    let res = sqlx::query(
        "UPDATE voice_occupant SET last_seen_at = ? WHERE account_id = ? AND channel_id = ?",
    )
    .bind(now.to_rfc3339())
    .bind(account_id.to_string())
    .bind(channel_id.to_string())
    .execute(pool)
    .await?;
    Ok(res.rows_affected() > 0)
}

pub async fn update_media(
    pool: &SqlitePool,
    account_id: Uuid,
    channel_id: Uuid,
    mic_on: Option<bool>,
    cam_on: Option<bool>,
    now: DateTime<Utc>,
) -> Result<bool, sqlx::Error> {
    let Some(existing) = find_by_account(pool, account_id).await? else {
        return Ok(false);
    };
    if existing.channel_id != channel_id {
        return Ok(false);
    }
    let mic = mic_on.unwrap_or(existing.mic_on);
    let cam = cam_on.unwrap_or(existing.cam_on);
    sqlx::query(
        "UPDATE voice_occupant SET mic_on = ?, cam_on = ?, last_seen_at = ?
         WHERE account_id = ? AND channel_id = ?",
    )
    .bind(if mic { 1 } else { 0 })
    .bind(if cam { 1 } else { 0 })
    .bind(now.to_rfc3339())
    .bind(account_id.to_string())
    .bind(channel_id.to_string())
    .execute(pool)
    .await?;
    Ok(true)
}

pub async fn session_started_at(
    pool: &SqlitePool,
    channel_id: Uuid,
) -> Result<Option<DateTime<Utc>>, sqlx::Error> {
    let row: Option<(Option<String>,)> =
        sqlx::query_as("SELECT voice_session_started_at FROM channel WHERE id = ?")
            .bind(channel_id.to_string())
            .fetch_optional(pool)
            .await?;
    match row {
        Some((Some(ts),)) => Ok(Some(crate::db::parse_time(&ts)?)),
        _ => Ok(None),
    }
}

pub async fn set_session_started_at(
    pool: &SqlitePool,
    channel_id: Uuid,
    started_at: Option<DateTime<Utc>>,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE channel SET voice_session_started_at = ? WHERE id = ?")
        .bind(started_at.map(|t| t.to_rfc3339()))
        .bind(channel_id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn list_views_for_channel(
    pool: &SqlitePool,
    channel_id: Uuid,
) -> Result<Vec<OccupantView>, sqlx::Error> {
    let rows = sqlx::query_as::<_, OccupantViewRow>(
        "SELECT o.account_id, a.handle, o.mic_on, o.cam_on,
                (a.avatar_filename IS NOT NULL) AS has_avatar
         FROM voice_occupant o
         JOIN account a ON a.id = o.account_id
         WHERE o.channel_id = ?
         ORDER BY o.joined_at",
    )
    .bind(channel_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter().map(map_view).collect()
}

pub async fn snapshot_for_channel(
    pool: &SqlitePool,
    channel_id: Uuid,
) -> Result<ChannelOccupancy, sqlx::Error> {
    Ok(ChannelOccupancy {
        channel_id,
        call_started_at: session_started_at(pool, channel_id).await?,
        occupants: list_views_for_channel(pool, channel_id).await?,
    })
}

pub async fn snapshot_for_server(
    pool: &SqlitePool,
    server_id: Uuid,
) -> Result<VoiceOccupancyResponse, sqlx::Error> {
    let channel_ids: Vec<(String,)> = sqlx::query_as(
        "SELECT DISTINCT channel_id FROM voice_occupant WHERE server_id = ?",
    )
    .bind(server_id.to_string())
    .fetch_all(pool)
    .await?;
    let mut channels = Vec::new();
    for (id,) in channel_ids {
        let channel_id = Uuid::parse_str(&id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?;
        channels.push(snapshot_for_channel(pool, channel_id).await?);
    }
    Ok(VoiceOccupancyResponse { channels })
}

pub async fn list_stale(
    pool: &SqlitePool,
    now: DateTime<Utc>,
) -> Result<Vec<VoiceOccupant>, sqlx::Error> {
    let cutoff = now - Duration::seconds(OCCUPANT_STALE_SECS);
    let rows = sqlx::query_as::<_, OccupantRow>(
        "SELECT account_id, channel_id, server_id, mic_on, cam_on, joined_at, last_seen_at
         FROM voice_occupant WHERE last_seen_at < ?",
    )
    .bind(cutoff.to_rfc3339())
    .fetch_all(pool)
    .await?;
    rows.into_iter().map(map_occupant).collect()
}

/// After occupant count hits 0, clear session; after 0→1, set now if null.
pub async fn sync_session_after_count_change(
    pool: &SqlitePool,
    channel_id: Uuid,
    now: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    let n = count_in_channel(pool, channel_id).await?;
    if n == 0 {
        set_session_started_at(pool, channel_id, None).await
    } else if session_started_at(pool, channel_id).await?.is_none() {
        set_session_started_at(pool, channel_id, Some(now)).await
    } else {
        Ok(())
    }
}
