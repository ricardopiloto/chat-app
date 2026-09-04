use crate::api::auth::session::AuthUser;
use crate::db;
use crate::domain::channel::ChannelType;
use crate::domain::permissions;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, State};
use axum::Json;
use base64::Engine;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct RolesResponse {
    pub roles: Vec<crate::domain::channel_role::ChannelRole>,
}

#[derive(Debug, Deserialize)]
pub struct PutRolesBody {
    pub account_ids: Vec<Uuid>,
}

#[derive(Debug, Serialize)]
pub struct MemberView {
    pub account_id: Uuid,
    pub handle: String,
    pub identity_pubkey: String,
}

pub async fn list_roles(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<Json<RolesResponse>, ApiError> {
    let channel = db::channel::find_by_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    crate::api::channels::require_member(&state.pool, account.id, channel.server_id).await?;
    if channel.kind != ChannelType::VoiceVideo {
        return Err(ApiError::bad_request("not a voice/video channel"));
    }
    let roles = db::channel_role::list_co_directors(&state.pool, channel_id).await?;
    Ok(Json(RolesResponse { roles }))
}

pub async fn put_roles(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    Json(body): Json<PutRolesBody>,
) -> Result<Json<RolesResponse>, ApiError> {
    let channel = db::channel::find_by_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    crate::api::channels::require_member(&state.pool, account.id, channel.server_id).await?;
    if channel.kind != ChannelType::VoiceVideo {
        return Err(ApiError::bad_request("not a voice/video channel"));
    }
    let server = db::server::find_by_id(&state.pool, channel.server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    if !permissions::is_channel_admin(server.owner_account_id, account.id) {
        return Err(ApiError::forbidden("only the owner can assign co-directors"));
    }
    for id in &body.account_ids {
        if !db::membership::exists(&state.pool, *id, channel.server_id).await? {
            return Err(ApiError::bad_request("account_id is not a member of this server"));
        }
    }
    db::channel_role::replace_co_directors(&state.pool, channel_id, &body.account_ids, account.id)
        .await?;
    let roles = db::channel_role::list_co_directors(&state.pool, channel_id).await?;
    state
        .ws
        .send_to_server_members(
            &state.pool,
            channel.server_id,
            "channel_role.changed",
            &serde_json::json!({
                "channel_id": channel_id,
                "roles": roles,
            }),
        )
        .await;
    Ok(Json(RolesResponse { roles }))
}

pub async fn list_members(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
) -> Result<Json<Vec<MemberView>>, ApiError> {
    db::server::find_by_id(&state.pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    crate::api::channels::require_member(&state.pool, account.id, server_id).await?;
    let memberships = db::membership::list_by_server(&state.pool, server_id).await?;
    let mut out = Vec::new();
    for m in memberships {
        if let Some(acc) = db::account::find_by_id(&state.pool, m.account_id).await? {
            out.push(MemberView {
                account_id: acc.id,
                handle: acc.handle,
                identity_pubkey: base64::engine::general_purpose::STANDARD
                    .encode(&acc.identity_pubkey),
            });
        }
    }
    Ok(Json(out))
}
