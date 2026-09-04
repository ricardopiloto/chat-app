use crate::domain::invite::InviteRecord;
use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    id: String,
    code: String,
    server_id: String,
    created_by_account_id: String,
    expires_at: Option<String>,
    include_history: i64,
    revoked_at: Option<String>,
}

fn parse_dt(value: &str) -> Result<DateTime<Utc>, sqlx::Error> {
    DateTime::parse_from_rfc3339(value)
        .map(|d| d.with_timezone(&Utc))
        .map_err(|e| sqlx::Error::Decode(Box::new(e)))
}

fn map_row(row: Row) -> Result<InviteRecord, sqlx::Error> {
    Ok(InviteRecord {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        code: row.code,
        server_id: Uuid::parse_str(&row.server_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        created_by_account_id: Uuid::parse_str(&row.created_by_account_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        expires_at: row.expires_at.as_deref().map(parse_dt).transpose()?,
        include_history: row.include_history != 0,
        revoked_at: row.revoked_at.as_deref().map(parse_dt).transpose()?,
    })
}

pub async fn create(pool: &SqlitePool, invite: &InviteRecord) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO invite (id, code, server_id, created_by_account_id, expires_at, include_history, revoked_at, created_at)
         VALUES (?, ?, ?, ?, ?, ?, NULL, ?)",
    )
    .bind(invite.id.to_string())
    .bind(&invite.code)
    .bind(invite.server_id.to_string())
    .bind(invite.created_by_account_id.to_string())
    .bind(invite.expires_at.map(|t| t.to_rfc3339()))
    .bind(i64::from(invite.include_history))
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn find_by_code(
    pool: &SqlitePool,
    code: &str,
) -> Result<Option<InviteRecord>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT id, code, server_id, created_by_account_id, expires_at, include_history, revoked_at
         FROM invite WHERE code = ?",
    )
    .bind(code)
    .fetch_optional(pool)
    .await?;
    row.map(map_row).transpose()
}

pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<InviteRecord>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT id, code, server_id, created_by_account_id, expires_at, include_history, revoked_at
         FROM invite WHERE id = ?",
    )
    .bind(id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(map_row).transpose()
}

pub async fn list_by_server(
    pool: &SqlitePool,
    server_id: Uuid,
) -> Result<Vec<InviteRecord>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, code, server_id, created_by_account_id, expires_at, include_history, revoked_at
         FROM invite WHERE server_id = ? ORDER BY created_at DESC",
    )
    .bind(server_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter().map(map_row).collect()
}

pub async fn revoke(pool: &SqlitePool, code: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE invite SET revoked_at = ? WHERE code = ?")
        .bind(Utc::now().to_rfc3339())
        .bind(code)
        .execute(pool)
        .await?;
    Ok(())
}
