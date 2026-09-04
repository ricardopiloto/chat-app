use crate::api::auth::session::AuthUser;
use crate::db;
use crate::domain::channel::ChannelType;
use crate::error::ApiError;
use crate::token;
use crate::AppState;
use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::Json;
use serde::Serialize;
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct VoiceJoinResponse {
    pub token: String,
    pub url: String,
    pub room: String,
}

pub async fn join(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    headers: HeaderMap,
) -> Result<Json<VoiceJoinResponse>, ApiError> {
    let channel = db::channel::find_by_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    if channel.kind != ChannelType::VoiceVideo {
        return Err(ApiError::bad_request("not a voice/video channel"));
    }
    crate::api::channels::require_member(&state.pool, account.id, channel.server_id).await?;
    let slot_count = channel.grid_slot_count.unwrap_or(4);
    let slots =
        db::grid::auto_assign_first_empty(&state.pool, channel_id, account.id, slot_count).await?;
    let layout = db::grid::to_layout(&slots, slot_count);
    state
        .ws
        .send_to_server_members(
            &state.pool,
            channel.server_id,
            "grid.updated",
            &serde_json::json!({ "channel_id": channel_id, "grid": layout }),
        )
        .await;
    let host = headers
        .get("x-forwarded-host")
        .or_else(|| headers.get("host"))
        .and_then(|v| v.to_str().ok());
    let minted = token::mint(
        &state.config,
        &account.id.to_string(),
        &channel_id.to_string(),
        &account.handle,
    )
    .map_err(ApiError::internal)?;
    Ok(Json(VoiceJoinResponse {
        token: minted.token,
        url: token::signaling_url(&state.config, host),
        room: minted.room,
    }))
}
