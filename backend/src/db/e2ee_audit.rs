use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct E2eeAuditEntry {
    pub id: Uuid,
    pub channel_id: Uuid,
    pub actor_account_id: Uuid,
    pub action: String,
    pub intent: Option<String>,
    pub created_at: String,
}

#[derive(sqlx::FromRow)]
struct Row {
    id: String,
    channel_id: String,
    actor_account_id: String,
    action: String,
    intent: Option<String>,
    created_at: String,
}

fn map_row(row: Row) -> Result<E2eeAuditEntry, sqlx::Error> {
    Ok(E2eeAuditEntry {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        channel_id: Uuid::parse_str(&row.channel_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        actor_account_id: Uuid::parse_str(&row.actor_account_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        action: row.action,
        intent: row.intent,
        created_at: row.created_at,
    })
}

pub async fn insert(
    pool: &SqlitePool,
    channel_id: Uuid,
    actor_account_id: Uuid,
    action: &str,
    intent: Option<&str>,
) -> Result<E2eeAuditEntry, sqlx::Error> {
    let id = Uuid::new_v4();
    let created_at = Utc::now().to_rfc3339();
    sqlx::query(
        "INSERT INTO e2ee_audit_log (id, channel_id, actor_account_id, action, intent, created_at)
         VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(id.to_string())
    .bind(channel_id.to_string())
    .bind(actor_account_id.to_string())
    .bind(action)
    .bind(intent)
    .bind(&created_at)
    .execute(pool)
    .await?;
    Ok(E2eeAuditEntry {
        id,
        channel_id,
        actor_account_id,
        action: action.to_string(),
        intent: intent.map(str::to_string),
        created_at,
    })
}

pub async fn latest_disable(
    pool: &SqlitePool,
    channel_id: Uuid,
) -> Result<Option<E2eeAuditEntry>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT id, channel_id, actor_account_id, action, intent, created_at
         FROM e2ee_audit_log
         WHERE channel_id = ? AND action = 'disable'
         ORDER BY created_at DESC LIMIT 1",
    )
    .bind(channel_id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(map_row).transpose()
}
