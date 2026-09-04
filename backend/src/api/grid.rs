use crate::api::auth::session::AuthUser;
use crate::db;
use crate::domain::grid::{GridLayout, LayoutKey};
use crate::domain::permissions;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, State};
use axum::Json;
use uuid::Uuid;

async fn active_layout(pool: &sqlx::SqlitePool, channel_id: Uuid) -> Result<GridLayout, ApiError> {
    let slots = db::grid::list(pool, channel_id).await?;
    let (layout_key, slot_count) = if let Some(sid) = db::grid::active_scene_id(pool, channel_id).await? {
        if let Some(scene) = db::scene::find_by_id(pool, sid).await? {
            (scene.layout_key, scene.slot_count)
        } else {
            (LayoutKey::Quad, 4)
        }
    } else {
        (LayoutKey::Quad, 4)
    };
    Ok(db::grid::to_layout(&slots, layout_key, slot_count))
}

pub async fn get_grid(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<Json<GridLayout>, ApiError> {
    let channel = db::channel::find_by_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    crate::api::channels::require_member(&state.pool, account.id, channel.server_id).await?;
    Ok(Json(active_layout(&state.pool, channel_id).await?))
}

pub async fn put_grid(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    Json(body): Json<GridLayout>,
) -> Result<Json<GridLayout>, ApiError> {
    let channel = db::channel::find_by_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    crate::api::channels::require_member(&state.pool, account.id, channel.server_id).await?;
    let server = db::server::find_by_id(&state.pool, channel.server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    if !permissions::is_channel_admin(server.owner_account_id, account.id) {
        return Err(ApiError::forbidden("only the owner can change the grid"));
    }
    let mapped = crate::domain::grid::validate_layout(&body).map_err(ApiError::bad_request)?;
    db::grid::replace_layout(
        &state.pool,
        channel_id,
        body.layout_key,
        body.slot_count,
        &mapped,
    )
    .await?;
    db::channel::set_grid_slot_count(&state.pool, channel_id, body.slot_count).await?;
    let slots = db::grid::list(&state.pool, channel_id).await?;
    let layout = db::grid::to_layout(&slots, body.layout_key, body.slot_count);
    state
        .ws
        .send_to_server_members(
            &state.pool,
            channel.server_id,
            "grid.updated",
            &serde_json::json!({ "channel_id": channel_id, "grid": layout }),
        )
        .await;
    Ok(Json(layout))
}
