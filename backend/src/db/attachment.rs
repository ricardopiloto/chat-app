use crate::domain::attachment::MessageAttachment;
use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    id: String,
    channel_id: String,
    message_id: Option<String>,
    uploader_account_id: String,
    content_type: String,
    size_bytes: i64,
    created_at: String,
}

fn map_row(row: Row) -> Result<MessageAttachment, sqlx::Error> {
    Ok(MessageAttachment {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        channel_id: Uuid::parse_str(&row.channel_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        message_id: row
            .message_id
            .as_deref()
            .map(Uuid::parse_str)
            .transpose()
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        uploader_account_id: Uuid::parse_str(&row.uploader_account_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        content_type: row.content_type,
        size_bytes: row.size_bytes,
        created_at: DateTime::parse_from_rfc3339(&row.created_at)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?
            .with_timezone(&Utc),
    })
}

pub async fn insert_pending(
    pool: &SqlitePool,
    id: Uuid,
    channel_id: Uuid,
    uploader_account_id: Uuid,
    content_type: &str,
    size_bytes: i64,
    created_at: DateTime<Utc>,
) -> Result<MessageAttachment, sqlx::Error> {
    sqlx::query(
        "INSERT INTO message_attachment
         (id, channel_id, message_id, uploader_account_id, content_type, size_bytes, created_at)
         VALUES (?, ?, NULL, ?, ?, ?, ?)",
    )
    .bind(id.to_string())
    .bind(channel_id.to_string())
    .bind(uploader_account_id.to_string())
    .bind(content_type)
    .bind(size_bytes)
    .bind(created_at.to_rfc3339())
    .execute(pool)
    .await?;
    find_by_id(pool, id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)
}

pub async fn find_by_id(
    pool: &SqlitePool,
    id: Uuid,
) -> Result<Option<MessageAttachment>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT id, channel_id, message_id, uploader_account_id, content_type, size_bytes, created_at
         FROM message_attachment WHERE id = ?",
    )
    .bind(id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(map_row).transpose()
}

pub async fn list_ids_for_message(
    pool: &SqlitePool,
    message_id: Uuid,
) -> Result<Vec<Uuid>, sqlx::Error> {
    let rows: Vec<(String,)> = sqlx::query_as(
        "SELECT id FROM message_attachment
         WHERE message_id = ?
         ORDER BY created_at ASC, id ASC",
    )
    .bind(message_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter()
        .map(|(id,)| {
            Uuid::parse_str(&id).map_err(|e| sqlx::Error::Decode(Box::new(e)))
        })
        .collect()
}

pub async fn bind_to_message(
    pool: &SqlitePool,
    attachment_id: Uuid,
    message_id: Uuid,
    channel_id: Uuid,
    uploader_account_id: Uuid,
) -> Result<(), sqlx::Error> {
    let result = sqlx::query(
        "UPDATE message_attachment
         SET message_id = ?
         WHERE id = ?
           AND channel_id = ?
           AND uploader_account_id = ?
           AND message_id IS NULL",
    )
    .bind(message_id.to_string())
    .bind(attachment_id.to_string())
    .bind(channel_id.to_string())
    .bind(uploader_account_id.to_string())
    .execute(pool)
    .await?;
    if result.rows_affected() == 0 {
        return Err(sqlx::Error::RowNotFound);
    }
    Ok(())
}

/// Remove ciphertext files for attachments bound to a message (DB rows cascade separately).
pub async fn delete_files_for_message(
    pool: &SqlitePool,
    attachments_dir: &std::path::Path,
    message_id: Uuid,
) -> Result<(), sqlx::Error> {
    let ids = list_ids_for_message(pool, message_id).await?;
    for id in ids {
        let path = attachments_dir.join(id.to_string());
        match tokio::fs::remove_file(&path).await {
            Ok(()) => {}
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {}
            Err(e) => {
                tracing::warn!(%id, error = %e, "failed to remove attachment file");
            }
        }
    }
    Ok(())
}
