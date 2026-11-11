use crate::domain::camera_background::CameraBackground;
use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    id: String,
    account_id: String,
    filename: String,
    content_type: String,
    size_bytes: i64,
    created_at: String,
}

fn map_row(row: Row) -> Result<CameraBackground, sqlx::Error> {
    Ok(CameraBackground {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        account_id: Uuid::parse_str(&row.account_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        filename: row.filename,
        content_type: row.content_type,
        size_bytes: row.size_bytes,
        created_at: DateTime::parse_from_rfc3339(&row.created_at).map_err(|e| sqlx::Error::Decode(Box::new(e)))?.with_timezone(&Utc),
    })
}

const COLUMNS: &str = "id, account_id, filename, content_type, size_bytes, created_at";

pub async fn list_by_account(pool: &SqlitePool, account_id: Uuid) -> Result<Vec<CameraBackground>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Row>(&format!("SELECT {COLUMNS} FROM account_camera_background WHERE account_id = ? ORDER BY created_at ASC, id ASC"))
        .bind(account_id.to_string()).fetch_all(pool).await?;
    rows.into_iter().map(map_row).collect()
}

pub async fn find_by_id_and_account(pool: &SqlitePool, id: Uuid, account_id: Uuid) -> Result<Option<CameraBackground>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(&format!("SELECT {COLUMNS} FROM account_camera_background WHERE id = ? AND account_id = ?"))
        .bind(id.to_string()).bind(account_id.to_string()).fetch_optional(pool).await?;
    row.map(map_row).transpose()
}

pub async fn insert(pool: &SqlitePool, id: Uuid, account_id: Uuid, filename: &str, content_type: &str, size_bytes: i64) -> Result<CameraBackground, sqlx::Error> {
    sqlx::query("INSERT INTO account_camera_background (id, account_id, filename, content_type, size_bytes, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(id.to_string()).bind(account_id.to_string()).bind(filename).bind(content_type).bind(size_bytes)
        .bind(Utc::now().to_rfc3339()).execute(pool).await?;
    find_by_id_and_account(pool, id, account_id).await?.ok_or(sqlx::Error::RowNotFound)
}

pub async fn delete(pool: &SqlitePool, id: Uuid, account_id: Uuid) -> Result<bool, sqlx::Error> {
    let result = sqlx::query("DELETE FROM account_camera_background WHERE id = ? AND account_id = ?")
        .bind(id.to_string()).bind(account_id.to_string()).execute(pool).await?;
    Ok(result.rows_affected() > 0)
}
