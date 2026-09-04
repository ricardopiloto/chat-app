use crate::domain::membership::{KeyHandoffStatus, Membership};
use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    account_id: String,
    server_id: String,
    joined_at: String,
    joined_via_invite_id: Option<String>,
    key_handoff_status: String,
}

fn map_row(row: Row) -> Result<Membership, sqlx::Error> {
    Ok(Membership {
        account_id: Uuid::parse_str(&row.account_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        server_id: Uuid::parse_str(&row.server_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        joined_at: DateTime::parse_from_rfc3339(&row.joined_at)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?
            .with_timezone(&Utc),
        joined_via_invite_id: row
            .joined_via_invite_id
            .map(|s| Uuid::parse_str(&s).map_err(|e| sqlx::Error::Decode(Box::new(e))))
            .transpose()?,
        key_handoff_status: KeyHandoffStatus::parse(&row.key_handoff_status),
    })
}

pub async fn create(pool: &SqlitePool, membership: &Membership) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO membership (account_id, server_id, joined_at, joined_via_invite_id, key_handoff_status)
         VALUES (?, ?, ?, ?, ?)",
    )
    .bind(membership.account_id.to_string())
    .bind(membership.server_id.to_string())
    .bind(membership.joined_at.to_rfc3339())
    .bind(membership.joined_via_invite_id.map(|id| id.to_string()))
    .bind(membership.key_handoff_status.as_str())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn find(
    pool: &SqlitePool,
    account_id: Uuid,
    server_id: Uuid,
) -> Result<Option<Membership>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT account_id, server_id, joined_at, joined_via_invite_id, key_handoff_status
         FROM membership WHERE account_id = ? AND server_id = ?",
    )
    .bind(account_id.to_string())
    .bind(server_id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(map_row).transpose()
}

pub async fn exists(
    pool: &SqlitePool,
    account_id: Uuid,
    server_id: Uuid,
) -> Result<bool, sqlx::Error> {
    Ok(find(pool, account_id, server_id).await?.is_some())
}

pub async fn list_by_server(
    pool: &SqlitePool,
    server_id: Uuid,
) -> Result<Vec<Membership>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Row>(
        "SELECT account_id, server_id, joined_at, joined_via_invite_id, key_handoff_status
         FROM membership WHERE server_id = ?",
    )
    .bind(server_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter().map(map_row).collect()
}

pub async fn list_synced_account_ids(
    pool: &SqlitePool,
    server_id: Uuid,
) -> Result<Vec<Uuid>, sqlx::Error> {
    let rows: Vec<(String,)> = sqlx::query_as(
        "SELECT account_id FROM membership WHERE server_id = ? AND key_handoff_status = 'synced'",
    )
    .bind(server_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter()
        .map(|(id,)| Uuid::parse_str(&id).map_err(|e| sqlx::Error::Decode(Box::new(e))))
        .collect()
}

pub async fn list_pending(
    pool: &SqlitePool,
    server_id: Uuid,
) -> Result<Vec<Membership>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Row>(
        "SELECT account_id, server_id, joined_at, joined_via_invite_id, key_handoff_status
         FROM membership WHERE server_id = ? AND key_handoff_status = 'pending'",
    )
    .bind(server_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter().map(map_row).collect()
}

pub async fn set_handoff_synced(
    pool: &SqlitePool,
    account_id: Uuid,
    server_id: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE membership SET key_handoff_status = 'synced' WHERE account_id = ? AND server_id = ?",
    )
    .bind(account_id.to_string())
    .bind(server_id.to_string())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn list_server_ids_for_account(
    pool: &SqlitePool,
    account_id: Uuid,
) -> Result<Vec<Uuid>, sqlx::Error> {
    let rows: Vec<(String,)> =
        sqlx::query_as("SELECT server_id FROM membership WHERE account_id = ?")
            .bind(account_id.to_string())
            .fetch_all(pool)
            .await?;
    rows.into_iter()
        .map(|(id,)| Uuid::parse_str(&id).map_err(|e| sqlx::Error::Decode(Box::new(e))))
        .collect()
}
