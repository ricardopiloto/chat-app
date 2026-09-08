use crate::domain::channel_acl::{
    AclEffect, AclSubjectType, ChannelAclEntry, PermLevel, EVERYONE_SUBJECT_ID,
};
use sqlx::{Sqlite, SqlitePool, Transaction};
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    id: String,
    channel_id: String,
    subject_type: String,
    subject_id: String,
    level: String,
    effect: String,
}

fn map_row(row: Row) -> Result<ChannelAclEntry, sqlx::Error> {
    Ok(ChannelAclEntry {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        channel_id: Uuid::parse_str(&row.channel_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        subject_type: AclSubjectType::parse(&row.subject_type)
            .ok_or_else(|| sqlx::Error::Decode("invalid ACL subject type".into()))?,
        subject_id: Uuid::parse_str(&row.subject_id)
            .map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        level: PermLevel::parse(&row.level)
            .ok_or_else(|| sqlx::Error::Decode("invalid ACL permission level".into()))?,
        effect: AclEffect::parse(&row.effect)
            .ok_or_else(|| sqlx::Error::Decode("invalid ACL effect".into()))?,
    })
}

pub async fn list_by_channel(
    pool: &SqlitePool,
    channel_id: Uuid,
) -> Result<Vec<ChannelAclEntry>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Row>(
        "SELECT id, channel_id, subject_type, subject_id, level, effect
         FROM channel_acl WHERE channel_id = ?
         ORDER BY subject_type, subject_id, level, effect",
    )
    .bind(channel_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter().map(map_row).collect()
}

async fn upsert_tx(
    tx: &mut Transaction<'_, Sqlite>,
    entry: &ChannelAclEntry,
) -> Result<(), sqlx::Error> {
    let subject_id = if entry.subject_type == AclSubjectType::Everyone {
        EVERYONE_SUBJECT_ID
    } else {
        entry.subject_id
    };
    sqlx::query(
        "INSERT INTO channel_acl (id, channel_id, subject_type, subject_id, level, effect)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(channel_id, subject_type, subject_id, level, effect)
         DO UPDATE SET id = excluded.id",
    )
    .bind(entry.id.to_string())
    .bind(entry.channel_id.to_string())
    .bind(entry.subject_type.as_str())
    .bind(subject_id.to_string())
    .bind(entry.level.as_str())
    .bind(entry.effect.as_str())
    .execute(&mut **tx)
    .await?;
    Ok(())
}

pub async fn upsert(pool: &SqlitePool, entry: &ChannelAclEntry) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    upsert_tx(&mut tx, entry).await?;
    tx.commit().await
}

pub async fn replace_all(
    pool: &SqlitePool,
    channel_id: Uuid,
    entries: &[ChannelAclEntry],
) -> Result<(), sqlx::Error> {
    let mut tx = pool.begin().await?;
    sqlx::query("DELETE FROM channel_acl WHERE channel_id = ?")
        .bind(channel_id.to_string())
        .execute(&mut *tx)
        .await?;
    for entry in entries {
        upsert_tx(&mut tx, entry).await?;
    }
    tx.commit().await
}

pub async fn delete_by_channel(pool: &SqlitePool, channel_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM channel_acl WHERE channel_id = ?")
        .bind(channel_id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}

/// Legacy: allow-effect levels only (for callers not yet on full resolve).
pub async fn list_grants_for_account(
    pool: &SqlitePool,
    channel_id: Uuid,
    account_id: Uuid,
) -> Result<Vec<PermLevel>, sqlx::Error> {
    let rows: Vec<(String,)> = sqlx::query_as(
        "SELECT ca.level
         FROM channel_acl ca
         WHERE ca.channel_id = ?
           AND ca.effect = 'allow'
           AND (
             (ca.subject_type = 'account' AND ca.subject_id = ?)
             OR
             (ca.subject_type = 'role' AND EXISTS (
               SELECT 1 FROM server_role_member srm
               WHERE srm.role_id = ca.subject_id AND srm.account_id = ?
             ))
             OR ca.subject_type = 'everyone'
           )",
    )
    .bind(channel_id.to_string())
    .bind(account_id.to_string())
    .bind(account_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter()
        .map(|(level,)| {
            PermLevel::parse(&level)
                .ok_or_else(|| sqlx::Error::Decode("invalid ACL permission level".into()))
        })
        .collect()
}
