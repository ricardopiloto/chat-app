use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, Clone)]
pub struct RecordingSession {
    pub id: Uuid,
    pub channel_id: Uuid,
    pub started_by: Uuid,
    pub egress_id: Option<String>,
    pub status: String,
    pub error: Option<String>,
    pub started_at: String,
    pub stopped_at: Option<String>,
}

pub async fn insert_starting(
    pool: &SqlitePool,
    channel_id: Uuid,
    started_by: Uuid,
) -> Result<Uuid, sqlx::Error> {
    let id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO recording_session (id, channel_id, started_by, status, started_at)
         VALUES (?, ?, ?, 'starting', ?)",
    )
    .bind(id.to_string())
    .bind(channel_id.to_string())
    .bind(started_by.to_string())
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;
    Ok(id)
}

pub async fn mark_active(
    pool: &SqlitePool,
    id: Uuid,
    egress_id: Option<&str>,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE recording_session SET status = 'active', egress_id = ? WHERE id = ?")
        .bind(egress_id)
        .bind(id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn mark_failed(pool: &SqlitePool, id: Uuid, error: &str) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE recording_session SET status = 'failed', error = ?, stopped_at = ? WHERE id = ?",
    )
    .bind(error)
    .bind(Utc::now().to_rfc3339())
    .bind(id.to_string())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn mark_stopped(pool: &SqlitePool, id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE recording_session SET status = 'stopped', stopped_at = ? WHERE id = ?",
    )
    .bind(Utc::now().to_rfc3339())
    .bind(id.to_string())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn active_for_channel(
    pool: &SqlitePool,
    channel_id: Uuid,
) -> Result<Option<RecordingSession>, sqlx::Error> {
    #[derive(sqlx::FromRow)]
    struct Row {
        id: String,
        channel_id: String,
        started_by: String,
        egress_id: Option<String>,
        status: String,
        error: Option<String>,
        started_at: String,
        stopped_at: Option<String>,
    }
    let row = sqlx::query_as::<_, Row>(
        "SELECT id, channel_id, started_by, egress_id, status, error, started_at, stopped_at
         FROM recording_session
         WHERE channel_id = ? AND status = 'active'
         ORDER BY started_at DESC LIMIT 1",
    )
    .bind(channel_id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(|r| {
        Ok(RecordingSession {
            id: Uuid::parse_str(&r.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
            channel_id: Uuid::parse_str(&r.channel_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
            started_by: Uuid::parse_str(&r.started_by).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
            egress_id: r.egress_id,
            status: r.status,
            error: r.error,
            started_at: r.started_at,
            stopped_at: r.stopped_at,
        })
    })
    .transpose()
}
