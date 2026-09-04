use crate::domain::grid::{AssignedBy, GridLayout, GridSlot, LayoutKey};
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn active_scene_id(pool: &SqlitePool, channel_id: Uuid) -> Result<Option<Uuid>, sqlx::Error> {
    let row: Option<(Option<String>,)> =
        sqlx::query_as("SELECT active_scene_id FROM channel WHERE id = ?")
            .bind(channel_id.to_string())
            .fetch_optional(pool)
            .await?;
    match row {
        Some((Some(id),)) => Ok(Some(
            Uuid::parse_str(&id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        )),
        _ => Ok(None),
    }
}

pub async fn list(pool: &SqlitePool, channel_id: Uuid) -> Result<Vec<GridSlot>, sqlx::Error> {
    let Some(scene_id) = active_scene_id(pool, channel_id).await? else {
        return Ok(Vec::new());
    };
    crate::db::scene::list_slots(pool, scene_id, channel_id).await
}

pub async fn find_account_slot(
    pool: &SqlitePool,
    channel_id: Uuid,
    account_id: Uuid,
) -> Result<Option<GridSlot>, sqlx::Error> {
    Ok(list(pool, channel_id)
        .await?
        .into_iter()
        .find(|s| s.account_id == Some(account_id)))
}

pub async fn replace_layout(
    pool: &SqlitePool,
    channel_id: Uuid,
    layout_key: LayoutKey,
    slot_count: i64,
    slots: &[(i64, Option<Uuid>)],
) -> Result<(), sqlx::Error> {
    let scene_id = active_scene_id(pool, channel_id)
        .await?
        .ok_or_else(|| sqlx::Error::RowNotFound)?;
    crate::db::scene::replace_slots(pool, scene_id, layout_key, slot_count, slots, AssignedBy::Owner)
        .await
}

pub fn to_layout(slots: &[GridSlot], layout_key: LayoutKey, slot_count: i64) -> GridLayout {
    let assigned_by = if slots.iter().any(|s| s.assigned_by == AssignedBy::Owner) {
        AssignedBy::Owner
    } else {
        AssignedBy::Auto
    };
    GridLayout {
        layout_key,
        slot_count,
        assigned_by,
        slots: (0..slot_count)
            .map(|index| {
                let found = slots.iter().find(|s| s.slot_index == index);
                crate::domain::grid::GridSlotView {
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
    let Some(scene_id) = active_scene_id(pool, channel_id).await? else {
        return Ok(Vec::new());
    };
    if find_account_slot(pool, channel_id, account_id).await?.is_some() {
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
        crate::db::scene::assign_slot(
            pool,
            scene_id,
            empty.slot_index,
            Some(account_id),
            AssignedBy::Auto,
        )
        .await?;
    }
    list(pool, channel_id).await
}
