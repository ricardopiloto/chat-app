use crate::domain::account::AccountRecord;
use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    id: String,
    handle: String,
    password_hash: String,
    identity_pubkey: Vec<u8>,
    identity_vault: Option<Vec<u8>>,
    is_initial_operator: i64,
    created_at: String,
}

fn map_row(row: Row) -> Result<AccountRecord, sqlx::Error> {
    Ok(AccountRecord {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        handle: row.handle,
        password_hash: row.password_hash,
        identity_pubkey: row.identity_pubkey,
        identity_vault: row.identity_vault,
        is_initial_operator: row.is_initial_operator != 0,
        created_at: DateTime::parse_from_rfc3339(&row.created_at)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?
            .with_timezone(&Utc),
    })
}

const COLS: &str =
    "id, handle, password_hash, identity_pubkey, identity_vault, is_initial_operator, created_at";

pub async fn count(pool: &SqlitePool) -> Result<i64, sqlx::Error> {
    let (n,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM account")
        .fetch_one(pool)
        .await?;
    Ok(n)
}

pub async fn find_by_handle(
    pool: &SqlitePool,
    handle: &str,
) -> Result<Option<AccountRecord>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(&format!(
        "SELECT {COLS} FROM account WHERE handle = ? COLLATE NOCASE"
    ))
    .bind(handle)
    .fetch_optional(pool)
    .await?;
    row.map(map_row).transpose()
}

pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<AccountRecord>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(&format!("SELECT {COLS} FROM account WHERE id = ?"))
        .bind(id.to_string())
        .fetch_optional(pool)
        .await?;
    row.map(map_row).transpose()
}

pub async fn create(pool: &SqlitePool, record: &AccountRecord) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO account (id, handle, password_hash, identity_pubkey, identity_vault, is_initial_operator, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(record.id.to_string())
    .bind(&record.handle)
    .bind(&record.password_hash)
    .bind(&record.identity_pubkey)
    .bind(&record.identity_vault)
    .bind(i64::from(record.is_initial_operator))
    .bind(record.created_at.to_rfc3339())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn set_identity_vault(
    pool: &SqlitePool,
    account_id: Uuid,
    vault: &[u8],
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE account SET identity_vault = ? WHERE id = ?")
        .bind(vault)
        .bind(account_id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn replace_identity(
    pool: &SqlitePool,
    account_id: Uuid,
    identity_pubkey: &[u8],
    vault: &[u8],
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE account SET identity_pubkey = ?, identity_vault = ? WHERE id = ?")
        .bind(identity_pubkey)
        .bind(vault)
        .bind(account_id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}
