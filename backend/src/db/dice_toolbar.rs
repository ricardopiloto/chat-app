use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn find_visible_sides(
    pool: &SqlitePool,
    account_id: Uuid,
) -> Result<Option<String>, sqlx::Error> {
    let row: Option<(String,)> =
        sqlx::query_as("SELECT visible_sides FROM account_dice_toolbar WHERE account_id = ?")
            .bind(account_id.to_string())
            .fetch_optional(pool)
            .await?;
    Ok(row.map(|(sides,)| sides))
}

pub async fn upsert_visible_sides(
    pool: &SqlitePool,
    account_id: Uuid,
    visible_sides_json: &str,
) -> Result<(), sqlx::Error> {
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        "INSERT INTO account_dice_toolbar (account_id, visible_sides, updated_at)
         VALUES (?, ?, ?)
         ON CONFLICT(account_id) DO UPDATE SET
           visible_sides = excluded.visible_sides,
           updated_at = excluded.updated_at",
    )
    .bind(account_id.to_string())
    .bind(visible_sides_json)
    .bind(&now)
    .execute(pool)
    .await?;
    Ok(())
}
