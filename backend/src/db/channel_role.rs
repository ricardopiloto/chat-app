use crate::domain::channel_role::{ChannelRole, ChannelRoleRow, ROLE_CO_DIRECTOR};
use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    channel_id: String,
    account_id: String,
    role: String,
    granted_by_account_id: String,
    created_at: String,
}

fn map_row(row: Row) -> Result<ChannelRoleRow, sqlx::Error> {
    Ok(ChannelRoleRow {
        channel_id: Uuid::parse_str(&row.channel_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        account_id: Uuid::parse_str(&row.account_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        role: row.role,
        granted_by_account_id: Uuid::parse_str(&row.granted_by_account_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        created_at: DateTime::parse_from_rfc3339(&row.created_at)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?
            .with_timezone(&Utc),
    })
}

pub async fn list_co_directors(
    pool: &SqlitePool,
    channel_id: Uuid,
) -> Result<Vec<ChannelRole>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Row>(
        "SELECT channel_id, account_id, role, granted_by_account_id, created_at
         FROM channel_role WHERE channel_id = ? AND role = ?",
    )
    .bind(channel_id.to_string())
    .bind(ROLE_CO_DIRECTOR)
    .fetch_all(pool)
    .await?;
    Ok(rows
        .into_iter()
        .map(map_row)
        .collect::<Result<Vec<_>, _>>()?
        .into_iter()
        .map(|r| ChannelRole {
            channel_id: r.channel_id,
            account_id: r.account_id,
            role: r.role,
        })
        .collect())
}

pub async fn is_co_director(
    pool: &SqlitePool,
    channel_id: Uuid,
    account_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let (n,): (i64,) = sqlx::query_as(
        "SELECT COUNT(*) FROM channel_role WHERE channel_id = ? AND account_id = ? AND role = ?",
    )
    .bind(channel_id.to_string())
    .bind(account_id.to_string())
    .bind(ROLE_CO_DIRECTOR)
    .fetch_one(pool)
    .await?;
    Ok(n > 0)
}

pub async fn replace_co_directors(
    pool: &SqlitePool,
    channel_id: Uuid,
    account_ids: &[Uuid],
    granted_by: Uuid,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM channel_role WHERE channel_id = ? AND role = ?")
        .bind(channel_id.to_string())
        .bind(ROLE_CO_DIRECTOR)
        .execute(pool)
        .await?;
    let now = Utc::now().to_rfc3339();
    for id in account_ids {
        sqlx::query(
            "INSERT INTO channel_role (channel_id, account_id, role, granted_by_account_id, created_at)
             VALUES (?, ?, ?, ?, ?)",
        )
        .bind(channel_id.to_string())
        .bind(id.to_string())
        .bind(ROLE_CO_DIRECTOR)
        .bind(granted_by.to_string())
        .bind(&now)
        .execute(pool)
        .await?;
    }
    Ok(())
}
