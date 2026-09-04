use crate::domain::grid::{AssignedBy, GridLayout, GridSlot, GridSlotView};
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct Row {
    channel_id: String,
    slot_index: i64,
    account_id: Option<String>,
    assigned_by: String,
}

fn map_row(row: Row) -> Result<GridSlot, sqlx::Error> {
    Ok(GridSlot {
        channel_id: Uuid::parse_str(&row.channel_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        slot_index: row.slot_index,
        account_id: row
            .account_id
            .map(|s| Uuid::parse_str(&s).map_err(|e| sqlx::Error::Decode(Box::new(e))))
            .transpose()?,
        assigned_by: AssignedBy::parse(&row.assigned_by),
    })
}

pub async fn init_empty(
    pool: &SqlitePool,
    channel_id: Uuid,
    slot_count: i64,
) -> Result<(), sqlx::Error> {
    let now = Utc::now().to_rfc3339();
    for index in 0..slot_count {
        sqlx::query(
            "INSERT INTO grid_slot (channel_id, slot_index, account_id, assigned_by, updated_at)
             VALUES (?, ?, NULL, 'auto', ?)",
        )
        .bind(channel_id.to_string())
        .bind(index)
        .bind(&now)
        .execute(pool)
        .await?;
    }
    Ok(())
}

pub async fn list(pool: &SqlitePool, channel_id: Uuid) -> Result<Vec<GridSlot>, sqlx::Error> {
    let rows = sqlx::query_as::<_, Row>(
        "SELECT channel_id, slot_index, account_id, assigned_by
         FROM grid_slot WHERE channel_id = ? ORDER BY slot_index",
    )
    .bind(channel_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter().map(map_row).collect()
}

pub async fn find_account_slot(
    pool: &SqlitePool,
    channel_id: Uuid,
    account_id: Uuid,
) -> Result<Option<GridSlot>, sqlx::Error> {
    let row = sqlx::query_as::<_, Row>(
        "SELECT channel_id, slot_index, account_id, assigned_by
         FROM grid_slot WHERE channel_id = ? AND account_id = ?",
    )
    .bind(channel_id.to_string())
    .bind(account_id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(map_row).transpose()
}

pub async fn assign(
    pool: &SqlitePool,
    channel_id: Uuid,
    slot_index: i64,
    account_id: Option<Uuid>,
    assigned_by: AssignedBy,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE grid_slot SET account_id = ?, assigned_by = ?, updated_at = ?
         WHERE channel_id = ? AND slot_index = ?",
    )
    .bind(account_id.map(|id| id.to_string()))
    .bind(assigned_by.as_str())
    .bind(Utc::now().to_rfc3339())
    .bind(channel_id.to_string())
    .bind(slot_index)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn replace_layout(
    pool: &SqlitePool,
    channel_id: Uuid,
    slot_count: i64,
    slots: &[(i64, Option<Uuid>)],
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM grid_slot WHERE channel_id = ? AND slot_index >= ?")
        .bind(channel_id.to_string())
        .bind(slot_count)
        .execute(pool)
        .await?;
    let now = Utc::now().to_rfc3339();
    for index in 0..slot_count {
        let account = slots
            .iter()
            .find(|(i, _)| *i == index)
            .and_then(|(_, a)| *a);
        sqlx::query(
            "INSERT INTO grid_slot (channel_id, slot_index, account_id, assigned_by, updated_at)
             VALUES (?, ?, ?, 'owner', ?)
             ON CONFLICT(channel_id, slot_index) DO UPDATE SET
               account_id = excluded.account_id,
               assigned_by = 'owner',
               updated_at = excluded.updated_at",
        )
        .bind(channel_id.to_string())
        .bind(index)
        .bind(account.map(|id| id.to_string()))
        .bind(&now)
        .execute(pool)
        .await?;
    }
    Ok(())
}

pub fn to_layout(slots: &[GridSlot], slot_count: i64) -> GridLayout {
    let assigned_by = if slots.iter().any(|s| s.assigned_by == AssignedBy::Owner) {
        AssignedBy::Owner
    } else {
        AssignedBy::Auto
    };
    GridLayout {
        slot_count,
        assigned_by,
        slots: (0..slot_count)
            .map(|index| {
                let found = slots.iter().find(|s| s.slot_index == index);
                GridSlotView {
                    index,
                    account_id: found.and_then(|s| s.account_id),
                }
            })
            .collect(),
    }
}

pub async fn auto_assign_first_empty(
    pool: &SqlitePool,
    channel_id: Uuid,
    account_id: Uuid,
    slot_count: i64,
) -> Result<Vec<GridSlot>, sqlx::Error> {
    if let Some(_) = find_account_slot(pool, channel_id, account_id).await? {
        return list(pool, channel_id).await;
    }
    let slots = list(pool, channel_id).await?;
    let owner_locked = slots.iter().any(|s| s.assigned_by == AssignedBy::Owner);
    if owner_locked {
        return Ok(slots);
    }
    if let Some(empty) = slots
        .iter()
        .filter(|s| s.slot_index < slot_count && s.account_id.is_none())
        .min_by_key(|s| s.slot_index)
    {
        assign(
            pool,
            channel_id,
            empty.slot_index,
            Some(account_id),
            AssignedBy::Auto,
        )
        .await?;
    }
    list(pool, channel_id).await
}
