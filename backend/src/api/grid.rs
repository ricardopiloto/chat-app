use crate::api::auth::session::AuthUser;
use crate::db;
use crate::domain::grid::GridLayout;
use crate::domain::permissions;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, State};
use axum::Json;
use std::collections::HashSet;
use uuid::Uuid;

pub async fn get_grid(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<Json<GridLayout>, ApiError> {
    let channel = db::channel::find_by_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    crate::api::channels::require_member(&state.pool, account.id, channel.server_id).await?;
    let slot_count = channel.grid_slot_count.unwrap_or(4);
    let slots = db::grid::list(&state.pool, channel_id).await?;
    Ok(Json(db::grid::to_layout(&slots, slot_count)))
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
    if !(2..=4).contains(&body.slot_count) {
        return Err(ApiError::bad_request("slot_count must be 2–4"));
    }
    if i64::try_from(body.slots.len()).unwrap_or(0) != body.slot_count {
        return Err(ApiError::bad_request("slots length must equal slot_count"));
    }
    let mut seen_index = HashSet::new();
    let mut seen_accounts = HashSet::new();
    let mut mapped = Vec::new();
    for slot in &body.slots {
        if slot.index < 0 || slot.index >= body.slot_count {
            return Err(ApiError::bad_request("slot index out of range"));
        }
        if !seen_index.insert(slot.index) {
            return Err(ApiError::bad_request("duplicate slot index"));
        }
        if let Some(id) = slot.account_id {
            if !seen_accounts.insert(id) {
                return Err(ApiError::bad_request("account already occupies a slot"));
            }
        }
        mapped.push((slot.index, slot.account_id));
    }
    db::grid::replace_layout(&state.pool, channel_id, body.slot_count, &mapped).await?;
    db::channel::set_grid_slot_count(&state.pool, channel_id, body.slot_count).await?;
    let slots = db::grid::list(&state.pool, channel_id).await?;
    let layout = db::grid::to_layout(&slots, body.slot_count);
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
