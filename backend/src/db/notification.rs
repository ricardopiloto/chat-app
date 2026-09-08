use crate::domain::notification::{NotificationKind, UserNotification};
use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    id: String,
    account_id: String,
    kind: String,
    channel_id: String,
    message_id: Option<String>,
    actor_account_id: String,
    created_at: String,
    read_at: Option<String>,
}

fn map_row(row: Row) -> Result<UserNotification, sqlx::Error> {
    Ok(UserNotification {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        account_id: Uuid::parse_str(&row.account_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        kind: NotificationKind::parse(&row.kind)
            .ok_or_else(|| sqlx::Error::Decode("invalid notification kind".into()))?,
        channel_id: Uuid::parse_str(&row.channel_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        message_id: row
            .message_id
            .map(|id| Uuid::parse_str(&id).map_err(|e| sqlx::Error::Decode(Box::new(e))))
            .transpose()?,
        actor_account_id: Uuid::parse_str(&row.actor_account_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        created_at: DateTime::parse_from_rfc3339(&row.created_at)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?
            .with_timezone(&Utc),
        read_at: row
            .read_at
            .map(|t| {
                DateTime::parse_from_rfc3339(&t)
                    .map(|d| d.with_timezone(&Utc))
                    .map_err(|e| sqlx::Error::Decode(Box::new(e)))
            })
            .transpose()?,
    })
}

pub async fn insert(pool: &SqlitePool, n: &UserNotification) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO user_notification
         (id, account_id, kind, channel_id, message_id, actor_account_id, created_at, read_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(n.id.to_string())
    .bind(n.account_id.to_string())
    .bind(n.kind.as_str())
    .bind(n.channel_id.to_string())
    .bind(n.message_id.map(|id| id.to_string()))
    .bind(n.actor_account_id.to_string())
    .bind(n.created_at.to_rfc3339())
    .bind(n.read_at.map(|t| t.to_rfc3339()))
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn list_for_account(
    pool: &SqlitePool,
    account_id: Uuid,
    unread_only: bool,
    limit: i64,
) -> Result<Vec<UserNotification>, sqlx::Error> {
    let rows = if unread_only {
        sqlx::query_as::<_, Row>(
            "SELECT id, account_id, kind, channel_id, message_id, actor_account_id, created_at, read_at
             FROM user_notification
             WHERE account_id = ? AND read_at IS NULL
             ORDER BY created_at DESC
             LIMIT ?",
        )
        .bind(account_id.to_string())
        .bind(limit)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, Row>(
            "SELECT id, account_id, kind, channel_id, message_id, actor_account_id, created_at, read_at
             FROM user_notification
             WHERE account_id = ?
             ORDER BY created_at DESC
             LIMIT ?",
        )
        .bind(account_id.to_string())
        .bind(limit)
        .fetch_all(pool)
        .await?
    };
    rows.into_iter().map(map_row).collect()
}

pub async fn mark_read(
    pool: &SqlitePool,
    notification_id: Uuid,
    account_id: Uuid,
    at: DateTime<Utc>,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE user_notification SET read_at = ?
         WHERE id = ? AND account_id = ? AND read_at IS NULL",
    )
    .bind(at.to_rfc3339())
    .bind(notification_id.to_string())
    .bind(account_id.to_string())
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn mark_all_read_for_account(
    pool: &SqlitePool,
    account_id: Uuid,
    at: DateTime<Utc>,
) -> Result<u64, sqlx::Error> {
    let result = sqlx::query(
        "UPDATE user_notification SET read_at = ?
         WHERE account_id = ? AND read_at IS NULL",
    )
    .bind(at.to_rfc3339())
    .bind(account_id.to_string())
    .execute(pool)
    .await?;
    Ok(result.rows_affected())
}

pub async fn find_by_id(
    pool: &SqlitePool,
    notification_id: Uuid,
) -> Result<Option<UserNotification>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT id, account_id, kind, channel_id, message_id, actor_account_id, created_at, read_at
         FROM user_notification WHERE id = ?",
    )
    .bind(notification_id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(map_row).transpose()
}
