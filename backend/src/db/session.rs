use crate::domain::session::Session;
use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    id: String,
    account_id: String,
    token_hash: String,
    expires_at: String,
    revoked_at: Option<String>,
}

fn map_row(row: Row) -> Result<Session, sqlx::Error> {
    Ok(Session {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        account_id: Uuid::parse_str(&row.account_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        token_hash: row.token_hash,
        expires_at: DateTime::parse_from_rfc3339(&row.expires_at)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?
            .with_timezone(&Utc),
        revoked_at: row
            .revoked_at
            .map(|s| {
                DateTime::parse_from_rfc3339(&s)
                    .map(|d| d.with_timezone(&Utc))
                    .map_err(|e| sqlx::Error::Decode(Box::new(e)))
            })
            .transpose()?,
    })
}

pub async fn create(pool: &SqlitePool, session: &Session) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO session (id, account_id, token_hash, expires_at, revoked_at, created_at)
         VALUES (?, ?, ?, ?, NULL, ?)",
    )
    .bind(session.id.to_string())
    .bind(session.account_id.to_string())
    .bind(&session.token_hash)
    .bind(session.expires_at.to_rfc3339())
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn find_by_token_hash(
    pool: &SqlitePool,
    token_hash: &str,
) -> Result<Option<Session>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT id, account_id, token_hash, expires_at, revoked_at FROM session WHERE token_hash = ?",
    )
    .bind(token_hash)
    .fetch_optional(pool)
    .await?;
    row.map(map_row).transpose()
}

pub async fn revoke(pool: &SqlitePool, id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE session SET revoked_at = ? WHERE id = ?")
        .bind(Utc::now().to_rfc3339())
        .bind(id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}
