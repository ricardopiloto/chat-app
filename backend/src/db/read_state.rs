use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn upsert_last_read(
    pool: &SqlitePool,
    account_id: Uuid,
    channel_id: Uuid,
    last_read_at: DateTime<Utc>,
) -> Result<(), sqlx::Error> {
    let now = Utc::now().to_rfc3339();
    let ts = last_read_at.to_rfc3339();
    // Do not regress the cursor.
    sqlx::query(
        "INSERT INTO channel_read_state (account_id, channel_id, last_read_at, updated_at)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(account_id, channel_id) DO UPDATE SET
           last_read_at = CASE
             WHEN excluded.last_read_at > channel_read_state.last_read_at
             THEN excluded.last_read_at
             ELSE channel_read_state.last_read_at
           END,
           updated_at = excluded.updated_at",
    )
    .bind(account_id.to_string())
    .bind(channel_id.to_string())
    .bind(&ts)
    .bind(&now)
    .execute(pool)
    .await?;
    Ok(())
}

/// True if the channel has any message newer than the account's last_read_at
/// (missing row ⇒ treat as epoch → any message counts as unread).
pub async fn channel_has_unread(
    pool: &SqlitePool,
    account_id: Uuid,
    channel_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let row: (i64,) = sqlx::query_as(
        "SELECT EXISTS (
           SELECT 1 FROM message m
           WHERE m.channel_id = ?
             AND m.created_at > COALESCE(
               (SELECT last_read_at FROM channel_read_state
                WHERE account_id = ? AND channel_id = ?),
               '1970-01-01T00:00:00Z'
             )
         )",
    )
    .bind(channel_id.to_string())
    .bind(account_id.to_string())
    .bind(channel_id.to_string())
    .fetch_one(pool)
    .await?;
    Ok(row.0 != 0)
}
