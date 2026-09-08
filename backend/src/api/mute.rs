use crate::api::auth::session::AuthUser;
use crate::api::authz::require_channel_view;
use crate::db;
use crate::domain::channel_mute::ChannelMute;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct PutMuteBody {
    pub duration_minutes: i64,
}

#[derive(Debug, Serialize)]
pub struct MuteResponse {
    pub channel_id: Uuid,
    pub account_id: Uuid,
    pub muted_by_account_id: Uuid,
    pub created_at: chrono::DateTime<Utc>,
    pub ends_at: chrono::DateTime<Utc>,
}

#[derive(Debug, Serialize)]
pub struct MyMuteResponse {
    pub muted: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub ends_at: Option<chrono::DateTime<Utc>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub muted_by_account_id: Option<Uuid>,
}

fn validate_duration_minutes(minutes: i64) -> Result<(), ApiError> {
    if (1..=1440).contains(&minutes) {
        Ok(())
    } else {
        Err(ApiError::bad_request(
            "duration_minutes must be between 1 and 1440",
        ))
    }
}

async fn require_mute_permission(
    pool: &sqlx::SqlitePool,
    actor_id: Uuid,
    server_id: Uuid,
) -> Result<crate::domain::server::Server, ApiError> {
    let server = db::server::find_by_id(pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    if server.owner_account_id == actor_id {
        return Ok(server);
    }
    let caps = db::server_role::aggregated_caps(pool, server_id, actor_id).await?;
    if !caps.can_mute_members {
        return Err(ApiError::forbidden("missing permission to mute members"));
    }
    Ok(server)
}

fn to_response(mute: &ChannelMute) -> MuteResponse {
    MuteResponse {
        channel_id: mute.channel_id,
        account_id: mute.account_id,
        muted_by_account_id: mute.muted_by_account_id,
        created_at: mute.created_at,
        ends_at: mute.ends_at,
    }
}

pub async fn put_mute(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((channel_id, target_id)): Path<(Uuid, Uuid)>,
    Json(body): Json<PutMuteBody>,
) -> Result<Json<MuteResponse>, ApiError> {
    validate_duration_minutes(body.duration_minutes)?;
    let (channel, _, _) = require_channel_view(&state.pool, account.id, channel_id).await?;
    let server = require_mute_permission(&state.pool, account.id, channel.server_id).await?;

    if target_id == account.id {
        return Err(ApiError::bad_request("cannot mute yourself"));
    }
    if target_id == server.owner_account_id {
        return Err(ApiError::forbidden("cannot mute the server owner"));
    }
    crate::api::authz::require_hierarchy(
        &state.pool,
        channel.server_id,
        account.id,
        target_id,
        server.owner_account_id,
    )
    .await?;
    if !db::membership::exists(&state.pool, target_id, channel.server_id).await? {
        return Err(ApiError::not_found("member not found"));
    }
    // Target should be able to view the channel (otherwise mute is meaningless / 404)
    require_channel_view(&state.pool, target_id, channel_id).await?;

    let now = Utc::now();
    let mute = ChannelMute {
        channel_id,
        account_id: target_id,
        muted_by_account_id: account.id,
        created_at: now,
        ends_at: now + Duration::minutes(body.duration_minutes),
    };
    db::channel_mute::upsert(&state.pool, &mute).await?;
    Ok(Json(to_response(&mute)))
}

pub async fn delete_mute(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((channel_id, target_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, ApiError> {
    let (channel, _, _) = require_channel_view(&state.pool, account.id, channel_id).await?;
    require_mute_permission(&state.pool, account.id, channel.server_id).await?;
    let _ = db::channel_mute::delete(&state.pool, channel_id, target_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_my_mute(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<Json<MyMuteResponse>, ApiError> {
    require_channel_view(&state.pool, account.id, channel_id).await?;
    let now = Utc::now();
    let mute = db::channel_mute::get_active(&state.pool, channel_id, account.id, now).await?;
    Ok(Json(match mute {
        Some(m) => MyMuteResponse {
            muted: true,
            ends_at: Some(m.ends_at),
            muted_by_account_id: Some(m.muted_by_account_id),
        },
        None => MyMuteResponse {
            muted: false,
            ends_at: None,
            muted_by_account_id: None,
        },
    }))
}

pub async fn list_mutes(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<Json<Vec<MuteResponse>>, ApiError> {
    let (channel, _, _) = require_channel_view(&state.pool, account.id, channel_id).await?;
    require_mute_permission(&state.pool, account.id, channel.server_id).await?;
    let mutes = db::channel_mute::list_active_for_channel(&state.pool, channel_id, Utc::now()).await?;
    Ok(Json(mutes.iter().map(to_response).collect()))
}
