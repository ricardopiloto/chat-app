use crate::domain::account::AccountRecord;
use crate::domain::channel_webhook::ChannelWebhook;
use chrono::{DateTime, Utc};
use rand::RngCore;
use sqlx::{Connection, SqlitePool};
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    id: String,
    channel_id: String,
    account_id: String,
    token_hash: String,
    created_by_account_id: String,
    created_at: String,
    revoked_at: Option<String>,
}

pub struct ChannelWebhookRow {
    pub id: Uuid,
    pub channel_id: Uuid,
    pub account_id: Uuid,
    pub token_hash: String,
    pub created_by_account_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub revoked_at: Option<DateTime<Utc>>,
}

fn parse_id(s: &str) -> Result<Uuid, sqlx::Error> {
    Uuid::parse_str(s).map_err(|e| sqlx::Error::Decode(Box::new(e)))
}
fn parse_time(s: &str) -> Result<DateTime<Utc>, sqlx::Error> {
    DateTime::parse_from_rfc3339(s)
        .map(|v| v.with_timezone(&Utc))
        .map_err(|e| sqlx::Error::Decode(Box::new(e)))
}
fn map_row(row: Row) -> Result<ChannelWebhookRow, sqlx::Error> {
    Ok(ChannelWebhookRow {
        id: parse_id(&row.id)?,
        channel_id: parse_id(&row.channel_id)?,
        account_id: parse_id(&row.account_id)?,
        token_hash: row.token_hash,
        created_by_account_id: parse_id(&row.created_by_account_id)?,
        created_at: parse_time(&row.created_at)?,
        revoked_at: row.revoked_at.as_deref().map(parse_time).transpose()?,
    })
}
const COLS: &str =
    "id, channel_id, account_id, token_hash, created_by_account_id, created_at, revoked_at";

pub async fn find_by_channel(
    pool: &SqlitePool,
    channel_id: Uuid,
) -> Result<Option<ChannelWebhookRow>, sqlx::Error> {
    sqlx::query_as::<_, Row>(&format!(
        "SELECT {COLS} FROM channel_webhook WHERE channel_id = ?"
    ))
    .bind(channel_id.to_string())
    .fetch_optional(pool)
    .await?
    .map(map_row)
    .transpose()
}
pub async fn find_by_id_active(
    pool: &SqlitePool,
    id: Uuid,
) -> Result<Option<ChannelWebhookRow>, sqlx::Error> {
    sqlx::query_as::<_, Row>(&format!(
        "SELECT {COLS} FROM channel_webhook WHERE id = ? AND revoked_at IS NULL"
    ))
    .bind(id.to_string())
    .fetch_optional(pool)
    .await?
    .map(map_row)
    .transpose()
}

pub enum CreateOutcome {
    Created(ChannelWebhookRow),
    Reactivated(ChannelWebhookRow),
    AlreadyActive,
}

pub async fn create_or_reactivate(
    pool: &SqlitePool,
    channel_id: Uuid,
    created_by: Uuid,
    token_hash: &str,
    display_name: &str,
) -> Result<CreateOutcome, sqlx::Error> {
    let mut conn = pool.acquire().await?;
    let mut tx = conn.begin_with("BEGIN IMMEDIATE").await?;
    let existing = sqlx::query_as::<_, Row>(&format!(
        "SELECT {COLS} FROM channel_webhook WHERE channel_id = ?"
    ))
    .bind(channel_id.to_string())
    .fetch_optional(&mut *tx)
    .await?
    .map(map_row)
    .transpose()?;
    if let Some(row) = existing {
        if row.revoked_at.is_none() {
            return Ok(CreateOutcome::AlreadyActive);
        }
        sqlx::query("UPDATE channel_webhook SET token_hash = ?, revoked_at = NULL WHERE id = ?")
            .bind(token_hash)
            .bind(row.id.to_string())
            .execute(&mut *tx)
            .await?;
        tx.commit().await?;
        return Ok(CreateOutcome::Reactivated(
            find_by_channel(pool, channel_id)
                .await?
                .ok_or(sqlx::Error::RowNotFound)?,
        ));
    }
    let now = Utc::now();
    let account_id = Uuid::new_v4();
    let mut password_bytes = [0u8; 32];
    let mut pubkey = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut password_bytes);
    rand::thread_rng().fill_bytes(&mut pubkey);
    let password_hash = crate::api::auth::register::hash_password(&hex::encode(password_bytes))
        .map_err(|_| sqlx::Error::Protocol("failed to hash webhook password".into()))?;
    let account = AccountRecord {
        is_system_account: true,
        id: account_id,
        handle: format!("webhook-{account_id}"),
        password_hash,
        identity_pubkey: pubkey.to_vec(),
        identity_vault: None,
        has_recovery_key: false,
        is_initial_operator: false,
        created_at: now,
        avatar_filename: None,
        avatar_content_type: None,
        display_name: Some(display_name.to_string()),
        email: None,
        email_canonical: None,
        email_verified_at: None,
        terms_accepted_at: None,
        key_reminders: false,
        last_key_reminder_at: None,
        key_reminder_count: 0,
    };
    crate::db::account::create(&mut *tx, &account).await?;
    let id = Uuid::new_v4();
    sqlx::query("INSERT INTO channel_webhook (id, channel_id, account_id, token_hash, created_by_account_id, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(id.to_string()).bind(channel_id.to_string()).bind(account_id.to_string())
        .bind(token_hash).bind(created_by.to_string()).bind(now.to_rfc3339()).execute(&mut *tx).await?;
    tx.commit().await?;
    Ok(CreateOutcome::Created(
        find_by_channel(pool, channel_id)
            .await?
            .ok_or(sqlx::Error::RowNotFound)?,
    ))
}

pub async fn revoke(pool: &SqlitePool, channel_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE channel_webhook SET revoked_at = ? WHERE channel_id = ? AND revoked_at IS NULL",
    )
    .bind(Utc::now().to_rfc3339())
    .bind(channel_id.to_string())
    .execute(pool)
    .await?;
    Ok(())
}
pub async fn rename(
    pool: &SqlitePool,
    channel_id: Uuid,
    display_name: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE account SET display_name = ? WHERE id = (SELECT account_id FROM channel_webhook WHERE channel_id = ?)")
        .bind(display_name).bind(channel_id.to_string()).execute(pool).await?;
    Ok(())
}
pub async fn rotate_token(
    pool: &SqlitePool,
    channel_id: Uuid,
    new_token_hash: &str,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE channel_webhook SET token_hash = ? WHERE channel_id = ? AND revoked_at IS NULL",
    )
    .bind(new_token_hash)
    .bind(channel_id.to_string())
    .execute(pool)
    .await?;
    Ok(())
}
pub async fn public_view(
    pool: &SqlitePool,
    row: &ChannelWebhookRow,
) -> Result<ChannelWebhook, sqlx::Error> {
    let account = crate::db::account::find_by_id(pool, row.account_id)
        .await?
        .ok_or(sqlx::Error::RowNotFound)?;
    Ok(ChannelWebhook {
        id: row.id,
        channel_id: row.channel_id,
        account_id: row.account_id,
        display_name: account.public_label(),
        has_avatar: account.avatar_filename.is_some(),
        created_by_account_id: row.created_by_account_id,
        created_at: row.created_at,
        revoked_at: row.revoked_at,
    })
}
