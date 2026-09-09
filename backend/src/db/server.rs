use crate::domain::server::{Server, ServerWelcomeSettings};
use crate::domain::voice_occupancy::OCCUPANT_STALE_SECS;
use chrono::{Duration, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct PlainRow {
    id: String,
    name: String,
    owner_account_id: String,
    image_filename: Option<String>,
    image_content_type: Option<String>,
}

#[derive(sqlx::FromRow)]
struct ActivityRow {
    id: String,
    name: String,
    owner_account_id: String,
    image_filename: Option<String>,
    image_content_type: Option<String>,
    has_unread: i64,
    has_voice: i64,
}

fn map_plain(row: PlainRow) -> Result<Server, sqlx::Error> {
    Ok(Server {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        name: row.name,
        owner_account_id: Uuid::parse_str(&row.owner_account_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        has_image: row.image_filename.is_some(),
        has_unread: false,
        has_voice: false,
        image_filename: row.image_filename,
        image_content_type: row.image_content_type,
    })
}

fn map_activity(row: ActivityRow) -> Result<Server, sqlx::Error> {
    Ok(Server {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        name: row.name,
        owner_account_id: Uuid::parse_str(&row.owner_account_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        has_image: row.image_filename.is_some(),
        has_unread: row.has_unread != 0,
        has_voice: row.has_voice != 0,
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
    let row = sqlx::query_as::<_, PlainRow>(
        "SELECT id, name, owner_account_id, image_filename, image_content_type FROM server WHERE id = ?",
    )
    .bind(id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(map_plain).transpose()
}

pub async fn list_for_account(
    pool: &SqlitePool,
    account_id: Uuid,
) -> Result<Vec<Server>, sqlx::Error> {
    let cutoff = (Utc::now() - Duration::seconds(OCCUPANT_STALE_SECS)).to_rfc3339();
    let rows = sqlx::query_as::<_, ActivityRow>(
        "SELECT s.id, s.name, s.owner_account_id, s.image_filename, s.image_content_type,
            EXISTS (
              SELECT 1 FROM channel c
              INNER JOIN message m ON m.channel_id = c.id
              WHERE c.server_id = s.id AND c.type = 'text'
                AND m.created_at > COALESCE(
                  (SELECT crs.last_read_at FROM channel_read_state crs
                   WHERE crs.account_id = ? AND crs.channel_id = c.id),
                  '1970-01-01T00:00:00Z'
                )
            ) AS has_unread,
            EXISTS (
              SELECT 1 FROM voice_occupant vo
              WHERE vo.server_id = s.id AND vo.last_seen_at >= ?
            ) AS has_voice
         FROM server s
         INNER JOIN membership m ON m.server_id = s.id
         WHERE m.account_id = ?
         ORDER BY s.created_at",
    )
    .bind(account_id.to_string())
    .bind(&cutoff)
    .bind(account_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter().map(map_activity).collect()
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

pub async fn get_welcome_settings(
    pool: &SqlitePool,
    server_id: Uuid,
) -> Result<Option<ServerWelcomeSettings>, sqlx::Error> {
    let row: Option<(Option<String>, Option<String>)> = sqlx::query_as(
        "SELECT welcome_channel_id, welcome_message_template FROM server WHERE id = ?",
    )
    .bind(server_id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(|(channel_id, template)| {
        Ok(ServerWelcomeSettings {
            welcome_channel_id: channel_id
                .map(|id| Uuid::parse_str(&id).map_err(|e| sqlx::Error::Decode(Box::new(e))))
                .transpose()?,
            welcome_message_template: template,
        })
    })
    .transpose()
}

pub async fn set_welcome_settings(
    pool: &SqlitePool,
    server_id: Uuid,
    settings: &ServerWelcomeSettings,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE server SET welcome_channel_id = ?, welcome_message_template = ? WHERE id = ?",
    )
    .bind(settings.welcome_channel_id.map(|id| id.to_string()))
    .bind(&settings.welcome_message_template)
    .bind(server_id.to_string())
    .execute(pool)
    .await?;
    Ok(())
}
