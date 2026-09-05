use crate::domain::grid::{AssignedBy, GridLayout, GridSlot, GridSlotView, LayoutKey};
use crate::domain::scene::{Scene, DEFAULT_SCENE_NAME};
use chrono::Utc;
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(sqlx::FromRow)]
struct SceneRow {
    id: String,
    channel_id: String,
    name: String,
    slot_count: i64,
    layout_key: String,
    created_at: String,
    updated_at: String,
}

#[derive(sqlx::FromRow)]
struct SlotRow {
    slot_index: i64,
    account_id: Option<String>,
    assigned_by: String,
}

fn map_scene(row: SceneRow) -> Result<Scene, sqlx::Error> {
    let layout_key = LayoutKey::parse(&row.layout_key).unwrap_or_else(|| {
        LayoutKey::from_slot_count(row.slot_count)
    });
    Ok(Scene {
        id: Uuid::parse_str(&row.id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        channel_id: Uuid::parse_str(&row.channel_id).map_err(|e| sqlx::Error::Decode(Box::new(e)))?,
        name: row.name,
        slot_count: row.slot_count,
        layout_key,
        created_at: crate::db::parse_time(&row.created_at)?,
        updated_at: crate::db::parse_time(&row.updated_at)?,
    })
}

fn map_slot(channel_id: Uuid, row: SlotRow) -> Result<GridSlot, sqlx::Error> {
    Ok(GridSlot {
        channel_id,
        slot_index: row.slot_index,
        account_id: row
            .account_id
            .map(|s| Uuid::parse_str(&s).map_err(|e| sqlx::Error::Decode(Box::new(e))))
            .transpose()?,
        assigned_by: AssignedBy::parse(&row.assigned_by),
    })
}

const SCENE_COLS: &str = "id, channel_id, name, slot_count, layout_key, created_at, updated_at";

pub async fn find_by_id(pool: &SqlitePool, id: Uuid) -> Result<Option<Scene>, sqlx::Error> {
    let row = sqlx::query_as::<_, SceneRow>(&format!(
        "SELECT {SCENE_COLS} FROM scene WHERE id = ?"
    ))
    .bind(id.to_string())
    .fetch_optional(pool)
    .await?;
    row.map(map_scene).transpose()
}

pub async fn list_by_channel(pool: &SqlitePool, channel_id: Uuid) -> Result<Vec<Scene>, sqlx::Error> {
    let rows = sqlx::query_as::<_, SceneRow>(&format!(
        "SELECT {SCENE_COLS} FROM scene WHERE channel_id = ? ORDER BY created_at"
    ))
    .bind(channel_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter().map(map_scene).collect()
}

pub async fn count_for_channel(pool: &SqlitePool, channel_id: Uuid) -> Result<i64, sqlx::Error> {
    let (n,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM scene WHERE channel_id = ?")
        .bind(channel_id.to_string())
        .fetch_one(pool)
        .await?;
    Ok(n)
}

pub async fn insert(pool: &SqlitePool, scene: &Scene) -> Result<(), sqlx::Error> {
    sqlx::query(
        "INSERT INTO scene (id, channel_id, name, slot_count, layout_key, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(scene.id.to_string())
    .bind(scene.channel_id.to_string())
    .bind(&scene.name)
    .bind(scene.slot_count)
    .bind(scene.layout_key.as_str())
    .bind(scene.created_at.to_rfc3339())
    .bind(scene.updated_at.to_rfc3339())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn set_name(pool: &SqlitePool, scene_id: Uuid, name: &str) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE scene SET name = ?, updated_at = ? WHERE id = ?")
        .bind(name)
        .bind(Utc::now().to_rfc3339())
        .bind(scene_id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn set_slot_count(pool: &SqlitePool, scene_id: Uuid, slot_count: i64) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE scene SET slot_count = ?, updated_at = ? WHERE id = ?")
        .bind(slot_count)
        .bind(Utc::now().to_rfc3339())
        .bind(scene_id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn set_layout_meta(
    pool: &SqlitePool,
    scene_id: Uuid,
    layout_key: LayoutKey,
    slot_count: i64,
) -> Result<(), sqlx::Error> {
    sqlx::query("UPDATE scene SET layout_key = ?, slot_count = ?, updated_at = ? WHERE id = ?")
        .bind(layout_key.as_str())
        .bind(slot_count)
        .bind(Utc::now().to_rfc3339())
        .bind(scene_id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn delete(pool: &SqlitePool, scene_id: Uuid) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM scene WHERE id = ?")
        .bind(scene_id.to_string())
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn list_slots(pool: &SqlitePool, scene_id: Uuid, channel_id: Uuid) -> Result<Vec<GridSlot>, sqlx::Error> {
    let rows = sqlx::query_as::<_, SlotRow>(
        "SELECT slot_index, account_id, assigned_by FROM scene_slot
         WHERE scene_id = ? ORDER BY slot_index",
    )
    .bind(scene_id.to_string())
    .fetch_all(pool)
    .await?;
    rows.into_iter().map(|row| map_slot(channel_id, row)).collect()
}

pub async fn insert_empty_slots(
    pool: &SqlitePool,
    scene_id: Uuid,
    slot_count: i64,
    assigned_by: AssignedBy,
) -> Result<(), sqlx::Error> {
    let now = Utc::now().to_rfc3339();
    for index in 0..slot_count {
        sqlx::query(
            "INSERT INTO scene_slot (scene_id, slot_index, account_id, assigned_by, updated_at)
             VALUES (?, ?, NULL, ?, ?)",
        )
        .bind(scene_id.to_string())
        .bind(index)
        .bind(assigned_by.as_str())
        .bind(&now)
        .execute(pool)
        .await?;
    }
    Ok(())
}

pub async fn copy_slots(
    pool: &SqlitePool,
    from_scene_id: Uuid,
    to_scene_id: Uuid,
    as_owner: bool,
) -> Result<(), sqlx::Error> {
    let assigned = if as_owner { "owner" } else { "auto" };
    let now = Utc::now().to_rfc3339();
    sqlx::query(
        "INSERT INTO scene_slot (scene_id, slot_index, account_id, assigned_by, updated_at)
         SELECT ?, slot_index, account_id, ?, ? FROM scene_slot WHERE scene_id = ?",
    )
    .bind(to_scene_id.to_string())
    .bind(assigned)
    .bind(&now)
    .bind(from_scene_id.to_string())
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn replace_slots(
    pool: &SqlitePool,
    scene_id: Uuid,
    layout_key: LayoutKey,
    slot_count: i64,
    slots: &[(i64, Option<Uuid>)],
    assigned_by: AssignedBy,
) -> Result<(), sqlx::Error> {
    sqlx::query("DELETE FROM scene_slot WHERE scene_id = ? AND slot_index >= ?")
        .bind(scene_id.to_string())
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
            "INSERT INTO scene_slot (scene_id, slot_index, account_id, assigned_by, updated_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(scene_id, slot_index) DO UPDATE SET
               account_id = excluded.account_id,
               assigned_by = excluded.assigned_by,
               updated_at = excluded.updated_at",
        )
        .bind(scene_id.to_string())
        .bind(index)
        .bind(account.map(|id| id.to_string()))
        .bind(assigned_by.as_str())
        .bind(&now)
        .execute(pool)
        .await?;
    }
    set_layout_meta(pool, scene_id, layout_key, slot_count).await?;
    Ok(())
}

pub async fn assign_slot(
    pool: &SqlitePool,
    scene_id: Uuid,
    slot_index: i64,
    account_id: Option<Uuid>,
    assigned_by: AssignedBy,
) -> Result<(), sqlx::Error> {
    sqlx::query(
        "UPDATE scene_slot SET account_id = ?, assigned_by = ?, updated_at = ?
         WHERE scene_id = ? AND slot_index = ?",
    )
    .bind(account_id.map(|id| id.to_string()))
    .bind(assigned_by.as_str())
    .bind(Utc::now().to_rfc3339())
    .bind(scene_id.to_string())
    .bind(slot_index)
    .execute(pool)
    .await?;
    Ok(())
}

pub async fn create_default(
    pool: &SqlitePool,
    channel_id: Uuid,
    slot_count: i64,
) -> Result<Scene, sqlx::Error> {
    use crate::domain::grid::{MAX_SCENE_SLOTS, MIN_SCENE_SLOTS};
    let slot_count = slot_count.clamp(MIN_SCENE_SLOTS, MAX_SCENE_SLOTS);
    let layout_key = LayoutKey::from_slot_count(slot_count);
    let now = Utc::now();
    let scene = Scene {
        id: Uuid::new_v4(),
        channel_id,
        name: DEFAULT_SCENE_NAME.to_string(),
        slot_count,
        layout_key,
        created_at: now,
        updated_at: now,
    };
    insert(pool, &scene).await?;
    insert_empty_slots(pool, scene.id, slot_count, AssignedBy::Auto).await?;
    crate::db::channel::set_active_scene(pool, channel_id, scene.id, slot_count).await?;
    Ok(scene)
}

pub fn layout_from_slots(slots: &[GridSlot], layout_key: LayoutKey, slot_count: i64) -> GridLayout {
    crate::db::grid::to_layout(slots, layout_key, slot_count)
}

pub fn slot_views(slots: &[GridSlot], layout_key: LayoutKey, slot_count: i64) -> Vec<GridSlotView> {
    layout_from_slots(slots, layout_key, slot_count).slots
}
