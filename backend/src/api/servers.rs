use crate::api::auth::session::AuthUser;
use crate::api::channel_provision;
use crate::db;
use crate::domain::channel::ChannelType;
use crate::domain::membership::{KeyHandoffStatus, Membership};
use crate::domain::server::Server;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateServerBody {
    pub name: String,
    pub custody_ack: Option<bool>,
    pub channel_key_sealed: Option<String>,
}

pub async fn create_server(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Json(body): Json<CreateServerBody>,
) -> Result<impl IntoResponse, ApiError> {
    let name = body.name.trim().to_string();
    if name.is_empty() {
        return Err(ApiError::bad_request("name required"));
    }
    if body.custody_ack != Some(true) {
        return Err(ApiError::bad_request(
            "custody_ack required to create a server (voice channel key)",
        ));
    }
    let sealed = body
        .channel_key_sealed
        .as_deref()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .ok_or_else(|| ApiError::bad_request("channel_key_sealed required"))?;

    let server = Server {
        id: Uuid::new_v4(),
        name,
        owner_account_id: account.id,
    };
    db::server::create(&state.pool, &server).await?;
    db::membership::create(
        &state.pool,
        &Membership {
            account_id: account.id,
            server_id: server.id,
            joined_at: Utc::now(),
            joined_via_invite_id: None,
            key_handoff_status: KeyHandoffStatus::Synced,
        },
    )
    .await?;

    channel_provision::provision_channel(
        &state.pool,
        server.id,
        account.id,
        "geral".into(),
        ChannelType::Text,
        None,
        None,
        None,
    )
    .await?;
    channel_provision::provision_channel(
        &state.pool,
        server.id,
        account.id,
        "mesa".into(),
        ChannelType::VoiceVideo,
        Some(4),
        Some(true),
        Some(sealed),
    )
    .await?;

    Ok((StatusCode::CREATED, Json(server)))
}

pub async fn list_servers(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
) -> Result<Json<Vec<Server>>, ApiError> {
    Ok(Json(
        db::server::list_for_account(&state.pool, account.id).await?,
    ))
}

pub async fn delete_server(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    let server = db::server::find_by_id(&state.pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    if account.id != server.owner_account_id {
        return Err(ApiError::forbidden("only the owner can delete this server"));
    }
    // Broadcast before delete so membership list still resolves.
    state
        .ws
        .send_to_server_members(
            &state.pool,
            server_id,
            "server.deleted",
            &serde_json::json!({ "server_id": server_id }),
        )
        .await;
    db::server::delete(&state.pool, server_id).await?;
    Ok(StatusCode::NO_CONTENT)
}
