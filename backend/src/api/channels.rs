use crate::api::auth::session::AuthUser;
use crate::db;
use crate::domain::channel::{Channel, ChannelType};
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
    let name = body.name.trim().to_string();
    if name.is_empty() {
        return Err(ApiError::bad_request("name required"));
    }
    let grid_slot_count = match body.kind {
        ChannelType::VoiceVideo => {
            let n = body.grid_slot_count.unwrap_or(4);
            if !(2..=4).contains(&n) {
                return Err(ApiError::bad_request("grid_slot_count must be 2–4"));
            }
            Some(n)
        }
        ChannelType::Text => None,
    };
    let channel = Channel {
        id: Uuid::new_v4(),
        server_id,
        name,
        kind: body.kind,
        grid_slot_count,
    };
    db::channel::create(&state.pool, &channel).await?;
    if let Some(n) = grid_slot_count {
        db::grid::init_empty(&state.pool, channel.id, n).await?;
    }
    Ok((StatusCode::CREATED, Json(channel)))
}

pub async fn list_channels(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
) -> Result<Json<Vec<Channel>>, ApiError> {
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
) -> Result<Json<Channel>, ApiError> {
    let channel = db::channel::find_by_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    require_member(&state.pool, account.id, channel.server_id).await?;
    Ok(Json(channel))
}
