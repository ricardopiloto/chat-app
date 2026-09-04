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
}

fn map_row(row: Row) -> Result<Channel, sqlx::Error> {
    Ok(Channel {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        server_id: Uuid::parse_str(&row.server_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        name: row.name,
        kind: ChannelType::parse(&row.r#type)
            .ok_or_else(|| sqlx::Error::Decode("invalid channel type".into()))?,
        grid_slot_count: row.grid_slot_count,
    })
}

pub async fn create(pool: &SqlitePool, channel: &Channel) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO channel (id, server_id, name, type, grid_slot_count, created_at)
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(channel.id.to_string())
    .bind(channel.server_id.to_string())
    .bind(&channel.name)
    .bind(channel.kind.as_str())
    .bind(channel.grid_slot_count)
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Channel>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT id, server_id, name, type, grid_slot_count FROM channel WHERE id = ?",
    )
    .bind(id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(map_row).transpose()
}

pub async fn list_by_server(
    pool: &SqlitePool,
    server_id: Uuid,
) -> Result<Vec<Channel>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, server_id, name, type, grid_slot_count FROM channel
         WHERE server_id = ? ORDER BY created_at",
    )
    .bind(server_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter().map(map_row).collect()
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
