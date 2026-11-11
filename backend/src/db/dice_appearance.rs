use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn find(pool: &SqlitePool, account_id: Uuid, channel_id: Uuid) -> Result<Option<String>, sqlx::Error> {
    let row: Option<(String,)> = sqlx::query_as("SELECT appearance FROM account_channel_dice_appearance WHERE account_id = ? AND channel_id = ?")
        .bind(account_id.to_string()).bind(channel_id.to_string()).fetch_optional(pool).await?;
    Ok(row.map(|(appearance,)| appearance))
}

pub async fn upsert(pool: &SqlitePool, account_id: Uuid, channel_id: Uuid, appearance: &str) -> Result<(), sqlx::Error> {
    sqlx::query("INSERT INTO account_channel_dice_appearance (account_id, channel_id, appearance, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(account_id, channel_id) DO UPDATE SET appearance = excluded.appearance, updated_at = excluded.updated_at")
        .bind(account_id.to_string()).bind(channel_id.to_string()).bind(appearance).bind(Utc::now().to_rfc3339()).execute(pool).await?;
    Ok(())
}
