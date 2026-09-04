use crate::api::auth::session::AuthUser;
use crate::db;
use crate::domain::channel::ChannelType;
use crate::error::ApiError;
use crate::token;
use crate::AppState;
use axum::extract::{Path, State};
use axum::http::HeaderMap;
use axum::Json;
use chrono::Utc;
use livekit_api::services::egress::{EgressClient, EgressOutput, RoomCompositeOptions};
use livekit_protocol::EncodedFileOutput;
use serde::{Deserialize, Serialize};
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
    crate::api::channels::require_member(&state.pool, account_id, channel.server_id).await?;
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
