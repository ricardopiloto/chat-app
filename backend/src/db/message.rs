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
    reply_to_message_id: Option<String>,
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
        reply_to_message_id: row
            .reply_to_message_id
            .map(|id| Uuid::parse_str(&id).map_err(|e| sqlx::Error::Decode(Box::new(e))))
            .transpose()?,
        mentioned_account_ids: Vec::new(),
        reply_to_sender_account_id: None,
    })
}

async fn enrich(pool: &SqlitePool, message: &mut Message) -> Result<(), sqlx::Error> {
    message.attachment_ids = crate::db::attachment::list_ids_for_message(pool, message.id).await?;
    message.mentioned_account_ids = list_mentions(pool, message.id).await?;
    if let Some(parent_id) = message.reply_to_message_id {
        if let Some(parent) = find_by_id_raw(pool, parent_id).await? {
            message.reply_to_sender_account_id = Some(parent.sender_account_id);
        }
    }
    Ok(())
}

async fn find_by_id_raw(pool: &SqlitePool, id: Uuid) -> Result<Option<Message>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT id, channel_id, sender_account_id, content_ciphertext, created_at, reply_to_message_id
         FROM message WHERE id = ?",
    )
    .bind(id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(map_row).transpose()
}

pub async fn create(
    pool: &SqlitePool,
    id: Uuid,
    channel_id: Uuid,
    sender_account_id: Uuid,
    ciphertext: &[u8],
    created_at: DateTime<Utc>,
    reply_to_message_id: Option<Uuid>,
) -> Result<Message, sqlx::Error> {
    sqlx::query(
        "INSERT INTO message (id, channel_id, sender_account_id, content_ciphertext, created_at, reply_to_message_id)
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(id.to_string())
    .bind(channel_id.to_string())
    .bind(sender_account_id.to_string())
    .bind(ciphertext)
    .bind(created_at.to_rfc3339())
    .bind(reply_to_message_id.map(|id| id.to_string()))
    .execute(pool)
    .await?;
    find_by_id(pool, id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Message>, sqlx::Error> {
    let mut message = match find_by_id_raw(pool, id).await? {
        Some(m) => m,
        None => return Ok(None),
    };
    enrich(pool, &mut message).await?;
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
        "SELECT id, channel_id, sender_account_id, content_ciphertext, created_at, reply_to_message_id
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
        enrich(pool, message).await?;
    }
    Ok(messages)
}

pub async fn insert_mentions(
    pool: &SqlitePool,
    message_id: Uuid,
    account_ids: &[Uuid],
) -> Result<(), sqlx::Error> {
    for account_id in account_ids {
        sqlx::query(
            "INSERT OR IGNORE INTO message_mention (message_id, account_id) VALUES (?, ?)",
        )
        .bind(message_id.to_string())
        .bind(account_id.to_string())
        .execute(pool)
        .await?;
    }
    Ok(())
}

pub async fn list_mentions(pool: &SqlitePool, message_id: Uuid) -> Result<Vec<Uuid>, sqlx::Error> {
    let rows: Vec<(String,)> = sqlx::query_as(
        "SELECT account_id FROM message_mention WHERE message_id = ?",
    )
    .bind(message_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter()
        .map(|(id,)| Uuid::parse_str(&id).map_err(|e| sqlx::Error::Decode(Box::new(e))))
        .collect()
}

pub async fn delete_by_id(
    pool: &SqlitePool,
    message_id: Uuid,
    channel_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM message WHERE id = ? AND channel_id = ?")
        .bind(message_id.to_string())
        .bind(channel_id.to_string())
        .execute(pool)
        .await?;
    Ok(result.rows_affected() > 0)
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
