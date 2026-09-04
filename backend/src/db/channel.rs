use crate::domain::channel::{Channel, ChannelType};
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    id: String,
    server_id: String,
    name: String,
    r#type: String,
    grid_slot_count: Option<i64>,
    created_by_account_id: Option<String>,
    e2ee_enabled: i64,
    has_channel_key: i64,
}

fn map_row(row: Row) -> Result<Channel, sqlx::Error> {
    let created_by = row
        .created_by_account_id
        .as_deref()
        .and_then(|s| Uuid::parse_str(s).ok())
        .unwrap_or(Uuid::nil());
    Ok(Channel {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        server_id: Uuid::parse_str(&row.server_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        name: row.name,
        kind: ChannelType::parse(&row.r#type)
            .ok_or_else(|| sqlx::Error::Decode("invalid channel type".into()))?,
        grid_slot_count: row.grid_slot_count,
        created_by_account_id: created_by,
        e2ee_enabled: row.e2ee_enabled != 0,
        has_channel_key: row.has_channel_key != 0,
    })
}

const SELECT_COLS: &str = "c.id, c.server_id, c.name, c.type, c.grid_slot_count,
         c.created_by_account_id, c.e2ee_enabled,
         CASE WHEN ck.channel_id IS NOT NULL THEN 1 ELSE 0 END AS has_channel_key";

pub async fn create(pool: &SqlitePool, channel: &Channel) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO channel (id, server_id, name, type, grid_slot_count, created_at, created_by_account_id, e2ee_enabled)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(channel.id.to_string())
    .bind(channel.server_id.to_string())
    .bind(&channel.name)
    .bind(channel.kind.as_str())
    .bind(channel.grid_slot_count)
    .bind(Utc::now().to_rfc3339())
    .bind(channel.created_by_account_id.to_string())
    .bind(if channel.e2ee_enabled { 1 } else { 0 })
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Channel>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(&format!(
        "SELECT {SELECT_COLS}
         FROM channel c
         LEFT JOIN channel_key ck ON ck.channel_id = c.id
         WHERE c.id = ?"
    ))
    .bind(id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(map_row).transpose()
}

pub async fn list_by_server(
    pool: &SqlitePool,
    server_id: Uuid,
) -> Result<Vec<Channel>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Row>(&format!(
        "SELECT {SELECT_COLS}
         FROM channel c
         LEFT JOIN channel_key ck ON ck.channel_id = c.id
         WHERE c.server_id = ? ORDER BY c.created_at"
    ))
    .bind(server_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter().map(map_row).collect()
}

pub async fn count_by_server(pool: &SqlitePool, server_id: Uuid) -> Result<i64, sqlx::Error> {
    let (n,): (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM channel WHERE server_id = ?")
            .bind(server_id.to_string())
            .fetch_one(pool)
            .await?;
    Ok(n)
}

pub async fn count_by_server_and_type(
    pool: &SqlitePool,
    server_id: Uuid,
    kind: ChannelType,
) -> Result<i64, sqlx::Error> {
    let (n,): (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM channel WHERE server_id = ? AND type = ?")
            .bind(server_id.to_string())
            .bind(kind.as_str())
            .fetch_one(pool)
            .await?;
    Ok(n)
}

pub async fn delete(pool: &SqlitePool, id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM channel WHERE id = ?")
        .bind(id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn set_e2ee_enabled(
    pool: &SqlitePool,
    channel_id: Uuid,
    enabled: bool,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE channel SET e2ee_enabled = ? WHERE id = ?")
        .bind(if enabled { 1 } else { 0 })
        .bind(channel_id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn set_grid_slot_count(
    pool: &SqlitePool,
    channel_id: Uuid,
    count: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE channel SET grid_slot_count = ? WHERE id = ?")
        .bind(count)
        .bind(channel_id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn set_active_scene(
    pool: &SqlitePool,
    channel_id: Uuid,
    scene_id: Uuid,
    slot_count: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE channel SET active_scene_id = ?, grid_slot_count = ? WHERE id = ?")
        .bind(scene_id.to_string())
        .bind(slot_count)
        .bind(channel_id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn active_scene_id(pool: &SqlitePool, channel_id: Uuid) -> Result<Option<Uuid>, sqlx::Error> {
    crate::db::grid::active_scene_id(pool, channel_id).await
}
