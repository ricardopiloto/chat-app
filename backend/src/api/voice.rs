use crate::api::auth::session::AuthUser;
use crate::db;
use crate::domain::channel::{Channel, ChannelType};
use crate::domain::voice_occupancy::{VoiceOccupancyResponse, VoiceOccupant};
use crate::error::ApiError;
use crate::token;
use crate::AppState;
use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use chrono::Utc;
use livekit_api::services::egress::{EgressClient, EgressOutput, RoomCompositeOptions};
use livekit_protocol::EncodedFileOutput;
use serde::{de::DeserializeOwned, Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Serialize)]
pub struct VoiceJoinResponse {
    pub token: String,
    pub url: String,
    pub room: String,
}

#[derive(Debug, Deserialize)]
pub struct E2eeBody {
    pub enabled: bool,
    pub intent: Option<String>,
}

#[derive(Debug, Serialize)]
pub struct EgressStartResponse {
    pub recording_id: Uuid,
    pub egress_id: Option<String>,
    pub status: String,
}

async fn require_voice_owner(
    state: &AppState,
    account_id: Uuid,
    channel_id: Uuid,
) -> Result<(crate::domain::channel::Channel, crate::domain::server::Server), ApiError> {
    let channel = db::channel::find_by_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    if channel.kind != ChannelType::VoiceVideo {
        return Err(ApiError::bad_request("not a voice/video channel"));
    }
    crate::api::authz::require_member(&state.pool, account_id, channel.server_id).await?;
    let server = db::server::find_by_id(&state.pool, channel.server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    if account_id != server.owner_account_id {
        return Err(ApiError::forbidden("only the owner can manage voice privacy"));
    }
    Ok((channel, server))
}

async fn broadcast_e2ee(
    state: &AppState,
    server_id: Uuid,
    channel_id: Uuid,
    e2ee_enabled: bool,
    actor_account_id: Uuid,
    intent: Option<&str>,
) {
    state
        .ws
        .send_to_server_members(
            &state.pool,
            server_id,
            "channel.e2ee_changed",
            &serde_json::json!({
                "channel_id": channel_id,
                "e2ee_enabled": e2ee_enabled,
                "actor_account_id": actor_account_id,
                "at": Utc::now().to_rfc3339(),
                "intent": intent,
            }),
        )
        .await;
}

#[derive(Debug, Default, Deserialize)]
pub struct VoiceMediaBody {
    pub mic_on: Option<bool>,
    pub cam_on: Option<bool>,
}

fn parse_json_or_default<T: Default + DeserializeOwned>(body: &Bytes) -> Result<T, ApiError> {
    if body.is_empty() {
        return Ok(T::default());
    }
    serde_json::from_slice(body).map_err(|_| ApiError::bad_request("invalid json"))
}

async fn require_voice_channel(pool: &sqlx::SqlitePool, channel_id: Uuid) -> Result<Channel, ApiError> {
    let channel = db::channel::find_by_id(pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    if channel.kind != ChannelType::VoiceVideo {
        return Err(ApiError::bad_request("not a voice/video channel"));
    }
    Ok(channel)
}

async fn layout_for_channel(
    pool: &sqlx::SqlitePool,
    channel: &Channel,
) -> Result<crate::domain::grid::GridLayout, ApiError> {
    let slot_count = channel.grid_slot_count.unwrap_or(4);
    let slots = db::grid::list(pool, channel.id).await?;
    let layout_key = if let Some(sid) = db::grid::active_scene_id(pool, channel.id).await? {
        db::scene::find_by_id(pool, sid)
            .await?
            .map(|s| s.layout_key)
            .unwrap_or(crate::domain::grid::LayoutKey::Quad)
    } else {
        crate::domain::grid::LayoutKey::Quad
    };
    Ok(db::grid::to_layout(&slots, layout_key, slot_count))
}

async fn broadcast_grid(state: &AppState, channel: &Channel) -> Result<(), ApiError> {
    let layout = layout_for_channel(&state.pool, channel).await?;
    state
        .ws
        .send_to_server_members(
            &state.pool,
            channel.server_id,
            "grid.updated",
            &serde_json::json!({ "channel_id": channel.id, "grid": layout }),
        )
        .await;
    Ok(())
}

async fn broadcast_occupancy(state: &AppState, server_id: Uuid, channel_id: Uuid) {
    let snap = match db::voice_occupancy::snapshot_for_channel(&state.pool, channel_id).await {
        Ok(s) => s,
        Err(err) => {
            tracing::error!(%err, "voice occupancy snapshot failed");
            return;
        }
    };
    state
        .ws
        .send_to_server_members(&state.pool, server_id, "voice.occupancy", &snap)
        .await;
}

async fn apply_leave(
    state: &AppState,
    account_id: Uuid,
    channel: &Channel,
) -> Result<(), ApiError> {
    db::voice_occupancy::delete_by_account(&state.pool, account_id).await?;
    db::grid::unassign_account(&state.pool, channel.id, account_id).await?;
    db::voice_occupancy::sync_session_after_count_change(&state.pool, channel.id, Utc::now())
        .await?;
    broadcast_occupancy(state, channel.server_id, channel.id).await;
    broadcast_grid(state, channel).await?;
    Ok(())
}

async fn expire_stale(state: &AppState) -> Result<(), ApiError> {
    let stale = db::voice_occupancy::list_stale(&state.pool, Utc::now()).await?;
    for occ in stale {
        let Some(channel) = db::channel::find_by_id(&state.pool, occ.channel_id).await? else {
            let _ = db::voice_occupancy::delete_by_account(&state.pool, occ.account_id).await;
            continue;
        };
        apply_leave(state, occ.account_id, &channel).await?;
    }
    Ok(())
}

async fn upsert_occupant(
    state: &AppState,
    account_id: Uuid,
    channel: &Channel,
    mic_on: bool,
    cam_on: bool,
) -> Result<(), ApiError> {
    let now = Utc::now();
    if let Some(existing) = db::voice_occupancy::find_by_account(&state.pool, account_id).await? {
        if existing.channel_id == channel.id {
            db::voice_occupancy::update_media(
                &state.pool,
                account_id,
                channel.id,
                Some(mic_on),
                Some(cam_on),
                now,
            )
            .await?;
            broadcast_occupancy(state, channel.server_id, channel.id).await;
            return Ok(());
        }
        if let Some(old) = db::channel::find_by_id(&state.pool, existing.channel_id).await? {
            apply_leave(state, account_id, &old).await?;
        } else {
            db::voice_occupancy::delete_by_account(&state.pool, account_id).await?;
        }
    }
    db::voice_occupancy::insert(
        &state.pool,
        &VoiceOccupant {
            account_id,
            channel_id: channel.id,
            server_id: channel.server_id,
            mic_on,
            cam_on,
            joined_at: now,
            last_seen_at: now,
        },
    )
    .await?;
    db::voice_occupancy::sync_session_after_count_change(&state.pool, channel.id, now).await?;
    broadcast_occupancy(state, channel.server_id, channel.id).await;
    Ok(())
}

pub async fn join(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    body: Bytes,
) -> Result<Json<VoiceJoinResponse>, ApiError> {
    let channel = require_voice_channel(&state.pool, channel_id).await?;
    crate::api::authz::require_member(&state.pool, account.id, channel.server_id).await?;
    let media: VoiceMediaBody = parse_json_or_default(&body)?;
    expire_stale(&state).await?;
    upsert_occupant(
        &state,
        account.id,
        &channel,
        media.mic_on.unwrap_or(true),
        media.cam_on.unwrap_or(true),
    )
    .await?;
    let slot_count = channel.grid_slot_count.unwrap_or(4);
    let slots =
        db::grid::auto_assign_first_empty(&state.pool, channel_id, account.id, slot_count).await?;
    let layout_key = if let Some(sid) = db::grid::active_scene_id(&state.pool, channel_id).await? {
        db::scene::find_by_id(&state.pool, sid)
            .await?
            .map(|s| s.layout_key)
            .unwrap_or(crate::domain::grid::LayoutKey::Quad)
    } else {
        crate::domain::grid::LayoutKey::Quad
    };
    let layout = db::grid::to_layout(&slots, layout_key, slot_count);
    state
        .ws
        .send_to_server_members(
            &state.pool,
            channel.server_id,
            "grid.updated",
            &serde_json::json!({ "channel_id": channel_id, "grid": layout }),
        )
        .await;
    let minted = token::mint(
        &state.config,
        &account.id.to_string(),
        &channel_id.to_string(),
        &account.handle,
    )
    .map_err(ApiError::internal)?;
    Ok(Json(VoiceJoinResponse {
        token: minted.token,
        url: state.config.livekit_url.clone(),
        room: minted.room,
    }))
}

pub async fn leave(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    let channel = require_voice_channel(&state.pool, channel_id).await?;
    crate::api::authz::require_member(&state.pool, account.id, channel.server_id).await?;
    expire_stale(&state).await?;
    if let Some(existing) = db::voice_occupancy::find_by_account(&state.pool, account.id).await? {
        if existing.channel_id == channel.id {
            apply_leave(&state, account.id, &channel).await?;
        }
    }
    Ok(StatusCode::NO_CONTENT)
}

pub async fn patch_media(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    body: Bytes,
) -> Result<StatusCode, ApiError> {
    let channel = require_voice_channel(&state.pool, channel_id).await?;
    crate::api::authz::require_member(&state.pool, account.id, channel.server_id).await?;
    expire_stale(&state).await?;
    let media: VoiceMediaBody = parse_json_or_default(&body)?;
    let updated = db::voice_occupancy::update_media(
        &state.pool,
        account.id,
        channel.id,
        media.mic_on,
        media.cam_on,
        Utc::now(),
    )
    .await?;
    if !updated {
        return Err(ApiError::forbidden("not in this voice call"));
    }
    broadcast_occupancy(&state, channel.server_id, channel.id).await;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn occupancy(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
) -> Result<Json<VoiceOccupancyResponse>, ApiError> {
    db::server::find_by_id(&state.pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    crate::api::authz::require_member(&state.pool, account.id, server_id).await?;
    expire_stale(&state).await?;
    let snap = db::voice_occupancy::snapshot_for_server(&state.pool, server_id).await?;
    Ok(Json(snap))
}

pub async fn set_e2ee(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    Json(body): Json<E2eeBody>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let (channel, _) = require_voice_owner(&state, account.id, channel_id).await?;
    if !channel.has_channel_key {
        return Err(ApiError::forbidden(
            "channel has no channel key; recreate the voice channel to enable Gravar/Religar",
        ));
    }
    let action = if body.enabled { "enable" } else { "disable" };
    let intent = body.intent.as_deref();
    db::channel::set_e2ee_enabled(&state.pool, channel_id, body.enabled).await?;
    let entry = db::e2ee_audit::insert(
        &state.pool,
        channel_id,
        account.id,
        action,
        intent,
    )
    .await?;
    broadcast_e2ee(
        &state,
        channel.server_id,
        channel_id,
        body.enabled,
        account.id,
        intent,
    )
    .await;
    Ok(Json(serde_json::json!({
        "e2ee_enabled": body.enabled,
        "audit_id": entry.id,
        "at": entry.created_at,
    })))
}

fn livekit_http_host(ws_url: &str) -> String {
    ws_url
        .replacen("wss://", "https://", 1)
        .replacen("ws://", "http://", 1)
}

async fn try_start_egress(
    state: &AppState,
    room: &str,
    filepath: &str,
) -> Result<String, String> {
    let host = livekit_http_host(&state.config.livekit_url);
    let client = EgressClient::with_api_key(
        &host,
        &state.config.livekit_api_key,
        &state.config.livekit_api_secret,
    );
    let output = EgressOutput::File(EncodedFileOutput {
        filepath: filepath.to_string(),
        ..Default::default()
    });
    let info = client
        .start_room_composite_egress(room, vec![output], RoomCompositeOptions::default())
        .await
        .map_err(|e| e.to_string())?;
    Ok(info.egress_id)
}

async fn try_stop_egress(state: &AppState, egress_id: &str) -> Result<(), String> {
    let host = livekit_http_host(&state.config.livekit_url);
    let client = EgressClient::with_api_key(
        &host,
        &state.config.livekit_api_key,
        &state.config.livekit_api_secret,
    );
    client
        .stop_egress(egress_id)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub async fn egress_start(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<Json<EgressStartResponse>, ApiError> {
    let (channel, _) = require_voice_owner(&state, account.id, channel_id).await?;
    if !channel.has_channel_key {
        return Err(ApiError::forbidden(
            "channel has no channel key; recreate the voice channel to enable Gravar",
        ));
    }

    let recording_id = db::recording::insert_starting(&state.pool, channel_id, account.id).await?;

    db::channel::set_e2ee_enabled(&state.pool, channel_id, false).await?;
    let _ = db::e2ee_audit::insert(
        &state.pool,
        channel_id,
        account.id,
        "disable",
        Some("record"),
    )
    .await?;
    broadcast_e2ee(
        &state,
        channel.server_id,
        channel_id,
        false,
        account.id,
        Some("record"),
    )
    .await;

    let Some(prefix) = state.config.egress_file_prefix.as_deref() else {
        compensate_e2ee_on(&state, &channel, account.id, "egress not configured").await?;
        let _ = db::recording::mark_failed(
            &state.pool,
            recording_id,
            "egress_unavailable: LIVEKIT_EGRESS_FILE_PREFIX not set",
        )
        .await;
        return Err(ApiError::service_unavailable(
            "egress_unavailable",
            "LiveKit egress is not configured on this instance (set LIVEKIT_EGRESS_FILE_PREFIX)",
        ));
    };

    let filepath = format!("{prefix}/mesa-{channel_id}-{recording_id}.mp4");
    let room = channel_id.to_string();
    match try_start_egress(&state, &room, &filepath).await {
        Ok(egress_id) => {
            db::recording::mark_active(&state.pool, recording_id, Some(&egress_id)).await?;
            Ok(Json(EgressStartResponse {
                recording_id,
                egress_id: Some(egress_id),
                status: "active".into(),
            }))
        }
        Err(err) => {
            compensate_e2ee_on(&state, &channel, account.id, &err).await?;
            let _ = db::recording::mark_failed(&state.pool, recording_id, &err).await;
            Err(ApiError::service_unavailable(
                "egress_unavailable",
                format!("LiveKit egress failed: {err}"),
            ))
        }
    }
}

async fn compensate_e2ee_on(
    state: &AppState,
    channel: &crate::domain::channel::Channel,
    actor: Uuid,
    reason: &str,
) -> Result<(), ApiError> {
    db::channel::set_e2ee_enabled(&state.pool, channel.id, true).await?;
    let _ = db::e2ee_audit::insert(
        &state.pool,
        channel.id,
        actor,
        "enable",
        Some("egress_compensate"),
    )
    .await?;
    broadcast_e2ee(
        state,
        channel.server_id,
        channel.id,
        true,
        actor,
        Some("egress_compensate"),
    )
    .await;
    tracing::warn!(%reason, channel_id = %channel.id, "egress failed; E2EE re-enabled");
    Ok(())
}

pub async fn egress_stop(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let (_channel, _) = require_voice_owner(&state, account.id, channel_id).await?;
    if let Some(rec) = db::recording::active_for_channel(&state.pool, channel_id).await? {
        if let Some(egress_id) = rec.egress_id.as_deref() {
            let _ = try_stop_egress(&state, egress_id).await;
        }
        db::recording::mark_stopped(&state.pool, rec.id).await?;
        Ok(Json(serde_json::json!({
            "recording_id": rec.id,
            "status": "stopped",
            "e2ee_enabled": false,
        })))
    } else {
        Ok(Json(serde_json::json!({
            "status": "stopped",
            "e2ee_enabled": false,
        })))
    }
}
