use crate::domain::reaction::ReactionSummary;
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn add_reaction(
    pool: &SqlitePool,
    message_id: Uuid,
    account_id: Uuid,
    emoji_code: &str,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "INSERT INTO message_reaction (message_id, account_id, emoji_code, created_at)
         VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING",
    )
    .bind(message_id.to_string())
    .bind(account_id.to_string())
    .bind(emoji_code)
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn remove_reaction(
    pool: &SqlitePool,
    message_id: Uuid,
    account_id: Uuid,
    emoji_code: &str,
) -> Result<bool, sqlx::Error> {
    let result = sqlx::query(
        "DELETE FROM message_reaction WHERE message_id = ? AND account_id = ? AND emoji_code = ?",
    )
    .bind(message_id.to_string())
    .bind(account_id.to_string())
    .bind(emoji_code)
    .execute(pool)
    .await?;
    Ok(result.rows_affected() > 0)
}

pub async fn reactions_for_message(
    pool: &SqlitePool,
    message_id: Uuid,
) -> Result<Vec<ReactionSummary>, sqlx::Error> {
    let rows: Vec<(String, String)> = sqlx::query_as(
        "SELECT emoji_code, account_id FROM message_reaction
         WHERE message_id = ? ORDER BY emoji_code, created_at, account_id",
    )
    .bind(message_id.to_string())
    .fetch_all(pool)
    .await?;
    let mut summaries: Vec<ReactionSummary> = Vec::new();
    for (emoji_code, account_id) in rows {
        let account_id = Uuid::parse_str(&account_id)
            .map_err(|error| sqlx::Error::Decode(Box::new(error)))?;
        if let Some(last) = summaries.last_mut() {
            if last.emoji_code == emoji_code {
                last.account_ids.push(account_id);
                last.count += 1;
                continue;
            }
        }
        summaries.push(ReactionSummary {
            emoji_code,
            count: 1,
            account_ids: vec![account_id],
        });
    }
    Ok(summaries)
}
