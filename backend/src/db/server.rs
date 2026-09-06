use crate::domain::server::Server;
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    id: String,
    name: String,
    owner_account_id: String,
    image_filename: Option<String>,
    image_content_type: Option<String>,
}

fn map_row(row: Row) -> Result<Server, sqlx::Error> {
    Ok(Server {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        name: row.name,
        owner_account_id: Uuid::parse_str(&row.owner_account_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        has_image: row.image_filename.is_some(),
        image_filename: row.image_filename,
        image_content_type: row.image_content_type,
    })
}

pub async fn create(pool: &SqlitePool, server: &Server) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO server (id, name, owner_account_id, created_at) VALUES (?, ?, ?, ?)",
    )
    .bind(server.id.to_string())
    .bind(&server.name)
    .bind(server.owner_account_id.to_string())
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Server>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT id, name, owner_account_id, image_filename, image_content_type FROM server WHERE id = ?",
    )
    .bind(id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(map_row).transpose()
}

pub async fn list_for_account(
    pool: &SqlitePool,
    account_id: Uuid,
) -> Result<Vec<Server>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Row>(
        "SELECT s.id, s.name, s.owner_account_id, s.image_filename, s.image_content_type
         FROM server s
         INNER JOIN membership m ON m.server_id = s.id
         WHERE m.account_id = ?
         ORDER BY s.created_at",
    )
    .bind(account_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter().map(map_row).collect()
}

pub async fn delete(pool: &SqlitePool, id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM server WHERE id = ?")
        .bind(id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn set_image(
    pool: &SqlitePool,
    server_id: Uuid,
    filename: Option<&str>,
    content_type: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE server SET image_filename = ?, image_content_type = ? WHERE id = ?")
        .bind(filename)
        .bind(content_type)
        .bind(server_id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}
