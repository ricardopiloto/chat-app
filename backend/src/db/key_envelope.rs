use crate::domain::key_envelope::KeyEnvelope;
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    server_id: String,
    account_id: String,
    sealed_key: Vec<u8>,
    sealed_by_account_id: String,
}

fn map_row(row: Row) -> Result<KeyEnvelope, sqlx::Error> {
    Ok(KeyEnvelope {
        server_id: Uuid::parse_str(&row.server_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        account_id: Uuid::parse_str(&row.account_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        sealed_key: row.sealed_key,
        sealed_by_account_id: Uuid::parse_str(&row.sealed_by_account_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
    })
}

pub async fn upsert(pool: &SqlitePool, envelope: &KeyEnvelope) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO key_envelope (server_id, account_id, sealed_key, sealed_by_account_id, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(server_id, account_id) DO UPDATE SET
           sealed_key = excluded.sealed_key,
           sealed_by_account_id = excluded.sealed_by_account_id,
           created_at = excluded.created_at",
    )
    .bind(envelope.server_id.to_string())
    .bind(envelope.account_id.to_string())
    .bind(&envelope.sealed_key)
    .bind(envelope.sealed_by_account_id.to_string())
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn get_for_account(
    pool: &SqlitePool,
    server_id: Uuid,
    account_id: Uuid,
) -> Result<Option<KeyEnvelope>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT server_id, account_id, sealed_key, sealed_by_account_id
         FROM key_envelope WHERE server_id = ? AND account_id = ?",
    )
    .bind(server_id.to_string())
    .bind(account_id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(map_row).transpose()
}

pub async fn any_contains_bytes(pool: &SqlitePool, needle: &[u8]) -> Result<bool, sqlx::Error> {
    let (n,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM key_envelope WHERE instr(sealed_key, ?) > 0",
    )
    .bind(needle)
    .fetch_one(pool)
    .await?;
    Ok(n > 0)
}
