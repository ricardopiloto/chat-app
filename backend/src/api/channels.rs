use crate::api::auth::session::AuthUser;
use crate::api::channel_provision;
use crate::db;
use crate::domain::channel::ChannelType;
use crate::domain::permissions;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateChannelBody {
    pub name: String,
    #[serde(rename = "type")]
    pub kind: ChannelType,
    pub grid_slot_count: Option<i64>,
    pub custody_ack: Option<bool>,
    pub channel_key_sealed: Option<String>,
}

pub async fn require_member(
    pool: &sqlx::SqlitePool,
    account_id: Uuid,
    server_id: Uuid,
) -> Result<(), ApiError> {
    if db::membership::exists(pool, account_id, server_id).await? {
        Ok(())
    } else {
        Err(ApiError::forbidden("not a member of this server"))
    }
}

pub async fn create_channel(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
    Json(body): Json<CreateChannelBody>,
) -> Result<impl IntoResponse, ApiError> {
    let server = db::server::find_by_id(&state.pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    require_member(&state.pool, account.id, server_id).await?;
    if !permissions::is_channel_admin(server.owner_account_id, account.id) {
        return Err(ApiError::forbidden("only the owner can create channels"));
    }
    let channel = channel_provision::provision_channel(
        &state.pool,
        server_id,
        account.id,
        body.name,
        body.kind,
        body.grid_slot_count,
        body.custody_ack,
        body.channel_key_sealed.as_deref(),
    )
    .await?;
    Ok((StatusCode::CREATED, Json(channel)))
}

pub async fn list_channels(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
) -> Result<Json<Vec<crate::domain::channel::Channel>>, ApiError> {
    db::server::find_by_id(&state.pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    require_member(&state.pool, account.id, server_id).await?;
    Ok(Json(
        db::channel::list_by_server(&state.pool, server_id).await?,
    ))
}

pub async fn get_channel(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<Json<crate::domain::channel::Channel>, ApiError> {
    let channel = db::channel::find_by_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    require_member(&state.pool, account.id, channel.server_id).await?;
    Ok(Json(channel))
}

pub async fn delete_channel(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    let channel = db::channel::find_by_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    require_member(&state.pool, account.id, channel.server_id).await?;
    let server = db::server::find_by_id(&state.pool, channel.server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    let allowed =
        account.id == channel.created_by_account_id || account.id == server.owner_account_id;
    if !allowed {
        return Err(ApiError::forbidden(
            "only the channel creator or server owner can delete this channel",
        ));
    }
    let of_type =
        db::channel::count_by_server_and_type(&state.pool, channel.server_id, channel.kind).await?;
    if of_type <= 1 {
        let kind_label = match channel.kind {
            ChannelType::Text => "text",
            ChannelType::VoiceVideo => "voice",
        };
        return Err(ApiError::conflict_code(
            "last_channel_of_type",
            format!("cannot delete the last {kind_label} channel on a server"),
        ));
    }
    let count = db::channel::count_by_server(&state.pool, channel.server_id).await?;
    if count <= 1 {
        return Err(ApiError::conflict_code(
            "last_channel",
            "cannot delete the last channel on a server",
        ));
    }
    let server_id = channel.server_id;
    db::channel::delete(&state.pool, channel_id).await?;
    state
        .ws
        .send_to_server_members(
            &state.pool,
            server_id,
            "channel.deleted",
            &serde_json::json!({ "channel_id": channel_id, "server_id": server_id }),
        )
        .await;
    Ok(StatusCode::NO_CONTENT)
}
