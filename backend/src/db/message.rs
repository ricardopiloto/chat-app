use crate::domain::message::Message;
use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    id: String,
    channel_id: String,
    sender_account_id: String,
    content_ciphertext: Vec<u8>,
    created_at: String,
}

fn map_row(row: Row) -> Result<Message, sqlx::Error> {
    use base64::Engine;
    Ok(Message {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        channel_id: Uuid::parse_str(&row.channel_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        sender_account_id: Uuid::parse_str(&row.sender_account_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        content_ciphertext: base64::engine::general_purpose::STANDARD.encode(&row.content_ciphertext),
        created_at: DateTime::parse_from_rfc3339(&row.created_at)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?
            .with_timezone(&Utc),
        attachment_ids: Vec::new(),
    })
}

pub async fn create(
    pool: &SqlitePool,
    id: Uuid,
    channel_id: Uuid,
    sender_account_id: Uuid,
    ciphertext: &[u8],
    created_at: DateTime<Utc>,
) -> Result<Message, sqlx::Error> {
    sqlx::query(
        "INSERT INTO message (id, channel_id, sender_account_id, content_ciphertext, created_at)
         VALUES (?, ?, ?, ?, ?)",
    )
    .bind(id.to_string())
    .bind(channel_id.to_string())
    .bind(sender_account_id.to_string())
    .bind(ciphertext)
    .bind(created_at.to_rfc3339())
    .execute(pool)
    .await?;
    find_by_id(pool, id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Message>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT id, channel_id, sender_account_id, content_ciphertext, created_at
         FROM message WHERE id = ?",
    )
    .bind(id.to_string())
    .fetch_optional(pool)
    .await?;
    let mut message = match row.map(map_row).transpose()? {
        Some(m) => m,
        None => return Ok(None),
    };
    message.attachment_ids = crate::db::attachment::list_ids_for_message(pool, message.id).await?;
    Ok(Some(message))
}

pub async fn list_since(
    pool: &SqlitePool,
    channel_id: Uuid,
    since: Option<DateTime<Utc>>,
    before: Option<DateTime<Utc>>,
    limit: i64,
) -> Result<Vec<Message>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, channel_id, sender_account_id, content_ciphertext, created_at
         FROM message
         WHERE channel_id = ?
           AND (? IS NULL OR created_at >= ?)
           AND (? IS NULL OR created_at < ?)
         ORDER BY created_at ASC
         LIMIT ?",
    )
    .bind(channel_id.to_string())
    .bind(since.map(|t| t.to_rfc3339()))
    .bind(since.map(|t| t.to_rfc3339()))
    .bind(before.map(|t| t.to_rfc3339()))
    .bind(before.map(|t| t.to_rfc3339()))
    .bind(limit)
    .fetch_all(pool)
    .await?;
    let mut messages: Vec<Message> = rows.into_iter().map(map_row).collect::<Result<_, _>>()?;
    for message in &mut messages {
        message.attachment_ids = crate::db::attachment::list_ids_for_message(pool, message.id).await?;
    }
    Ok(messages)
}

pub async fn any_contains_bytes(pool: &SqlitePool, needle: &[u8]) -> Result<bool, sqlx::Error> {
    let (n,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM message WHERE instr(content_ciphertext, ?) > 0",
    )
    .bind(needle)
    .fetch_one(pool)
    .await?;
    Ok(n > 0)
}
