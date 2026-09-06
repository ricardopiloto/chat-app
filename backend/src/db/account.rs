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
    avatar_filename: Option<String>,
    avatar_content_type: Option<String>,
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
        avatar_filename: row.avatar_filename,
        avatar_content_type: row.avatar_content_type,
    })
}

const COLS: &str =
    "id, handle, password_hash, identity_pubkey, identity_vault, is_initial_operator, created_at, avatar_filename, avatar_content_type";

pub async fn count<'e, E>(executor: E) -> Result<i64, sqlx::Error>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let (n,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM account")
        .fetch_one(executor)
        .await?;
    Ok(n)
}

pub async fn find_by_handle<'e, E>(
    executor: E,
    handle: &str,
) -> Result<Option<AccountRecord>, sqlx::Error>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let row = sqlx::query_as::<_, Row>(&format!(
        "SELECT {COLS} FROM account WHERE handle = ? COLLATE NOCASE"
    ))
    .bind(handle)
    .fetch_optional(executor)
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

pub async fn create<'e, E>(executor: E, record: &AccountRecord) -> Result<(), sqlx::Error>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
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
    .execute(executor)
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

pub async fn set_avatar(
    pool: &SqlitePool,
    account_id: Uuid,
    filename: Option<&str>,
    content_type: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE account SET avatar_filename = ?, avatar_content_type = ? WHERE id = ?")
        .bind(filename)
        .bind(content_type)
        .bind(account_id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}
