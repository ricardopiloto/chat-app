use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn insert(
    pool: &SqlitePool,
    channel_id: Uuid,
    custodian_account_id: Uuid,
    sealed_blob: &[u8],
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO channel_key (channel_id, custodian_account_id, sealed_blob, created_at)
         VALUES (?, ?, ?, ?)",
    )
    .bind(channel_id.to_string())
    .bind(custodian_account_id.to_string())
    .bind(sealed_blob)
    .bind(Utc::now().to_rfc3339())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn exists(pool: &SqlitePool, channel_id: Uuid) -> Result<bool, sqlx::Error> {
    let row: Option<(String,)> =
        sqlx::query_as("SELECT channel_id FROM channel_key WHERE channel_id = ?")
            .bind(channel_id.to_string())
            .fetch_optional(pool)
            .await?;
    Ok(row.is_some())
}

#[derive(Debug, Clone)]
pub struct ChannelKeyRow {
    pub channel_id: Uuid,
    pub custodian_account_id: Uuid,
    pub sealed_blob: Vec<u8>,
}

#[derive(sqlx::FromRow)]
struct Row {
    channel_id: String,
    custodian_account_id: String,
    sealed_blob: Vec<u8>,
}

pub async fn get(pool: &SqlitePool, channel_id: Uuid) -> Result<Option<ChannelKeyRow>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT channel_id, custodian_account_id, sealed_blob FROM channel_key WHERE channel_id = ?",
    )
    .bind(channel_id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(|r| {
        Ok(ChannelKeyRow {
            channel_id: Uuid::parse_str(&r.channel_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
            custodian_account_id: Uuid::parse_str(&r.custodian_account_id)
                .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
            sealed_blob: r.sealed_blob,
        })
    })
    .transpose()
}
