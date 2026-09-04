use crate::api::auth::session::AuthUser;
use crate::db;
use crate::domain::channel::ChannelType;
use crate::domain::grid::{validate_layout, AssignedBy, GridLayout};
use crate::domain::permissions;
use crate::domain::scene::{normalize_name, Scene, SceneSummary, SceneView, MAX_SCENES_PER_CHANNEL};
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use serde::Deserialize;
use serde::Serialize;
use sqlx::SqlitePool;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateSceneBody {
    pub name: String,
}

#[derive(Debug, Deserialize)]
pub struct PatchSceneBody {
    pub name: Option<String>,
    pub layout: Option<GridLayout>,
}

#[derive(Debug, Serialize)]
pub struct SceneListResponse {
    pub active_scene_id: Uuid,
    pub scenes: Vec<SceneView>,
}

async fn require_voice_channel(
    pool: &SqlitePool,
    account_id: Uuid,
    channel_id: Uuid,
) -> Result<crate::domain::channel::Channel, ApiError> {
    let channel = db::channel::find_by_id(pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    crate::api::channels::require_member(pool, account_id, channel.server_id).await?;
    if channel.kind != ChannelType::VoiceVideo {
        return Err(ApiError::bad_request("not a voice/video channel"));
    }
    Ok(channel)
}

async fn require_admin(
    pool: &SqlitePool,
    account_id: Uuid,
    server_id: Uuid,
) -> Result<(), ApiError> {
    let server = db::server::find_by_id(pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    if !permissions::is_channel_admin(server.owner_account_id, account_id) {
        return Err(ApiError::forbidden("only the owner can manage scenes"));
    }
    Ok(())
}

async fn can_activate(
    pool: &SqlitePool,
    account_id: Uuid,
    server_id: Uuid,
    _channel_id: Uuid,
) -> Result<bool, ApiError> {
    let server = db::server::find_by_id(pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    Ok(permissions::is_channel_admin(server.owner_account_id, account_id))
}

async fn view_of(
    pool: &SqlitePool,
    scene: &Scene,
    active_id: Uuid,
    channel_id: Uuid,
) -> Result<SceneView, ApiError> {
    let slots = db::scene::list_slots(pool, scene.id, channel_id).await?;
    Ok(SceneView {
        id: scene.id,
        channel_id: scene.channel_id,
        name: scene.name.clone(),
        is_active: scene.id == active_id,
        layout: db::grid::to_layout(&slots, scene.layout_key, scene.slot_count),
    })
}

async fn summaries(pool: &SqlitePool, channel_id: Uuid, active_id: Uuid) -> Result<Vec<SceneSummary>, ApiError> {
    let scenes = db::scene::list_by_channel(pool, channel_id).await?;
    Ok(scenes
        .into_iter()
        .map(|s| SceneSummary {
            id: s.id,
            name: s.name,
            is_active: s.id == active_id,
        })
        .collect())
}

async fn broadcast_scene_changed(state: &AppState, server_id: Uuid, channel_id: Uuid, active_id: Uuid) {
    let scenes = summaries(&state.pool, channel_id, active_id)
        .await
        .unwrap_or_default();
    state
        .ws
        .send_to_server_members(
            &state.pool,
            server_id,
            "scene.changed",
            &serde_json::json!({
                "channel_id": channel_id,
                "active_scene_id": active_id,
                "scenes": scenes,
            }),
        )
        .await;
}

async fn broadcast_grid(state: &AppState, server_id: Uuid, channel_id: Uuid, layout: &GridLayout) {
    state
        .ws
        .send_to_server_members(
            &state.pool,
            server_id,
            "grid.updated",
            &serde_json::json!({ "channel_id": channel_id, "grid": layout }),
        )
        .await;
}

async fn require_scene_in_channel(
    pool: &SqlitePool,
    channel_id: Uuid,
    scene_id: Uuid,
) -> Result<Scene, ApiError> {
    let scene = db::scene::find_by_id(pool, scene_id)
        .await?
        .ok_or_else(|| ApiError::not_found("scene not found"))?;
    if scene.channel_id != channel_id {
        return Err(ApiError::not_found("scene not found"));
    }
    Ok(scene)
}

pub async fn list_scenes(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<Json<SceneListResponse>, ApiError> {
    let _channel = require_voice_channel(&state.pool, account.id, channel_id).await?;
    let active_id = db::channel::active_scene_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("no active scene"))?;
    let scenes = db::scene::list_by_channel(&state.pool, channel_id).await?;
    let mut views = Vec::new();
    for scene in scenes {
        views.push(view_of(&state.pool, &scene, active_id, channel_id).await?);
    }
    Ok(Json(SceneListResponse {
        active_scene_id: active_id,
        scenes: views,
    }))
}

pub async fn create_scene(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    Json(body): Json<CreateSceneBody>,
) -> Result<impl IntoResponse, ApiError> {
    let channel = require_voice_channel(&state.pool, account.id, channel_id).await?;
    require_admin(&state.pool, account.id, channel.server_id).await?;
    let name = normalize_name(&body.name).map_err(ApiError::bad_request)?;
    let count = db::scene::count_for_channel(&state.pool, channel_id).await?;
    if count >= MAX_SCENES_PER_CHANNEL {
        return Err(ApiError::bad_request("channel already has 32 scenes"));
    }
    let active_id = db::channel::active_scene_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("no active scene"))?;
    let source = db::scene::find_by_id(&state.pool, active_id)
        .await?
        .ok_or_else(|| ApiError::not_found("active scene missing"))?;
    let now = Utc::now();
    let scene = Scene {
        id: Uuid::new_v4(),
        channel_id,
        name,
        slot_count: source.slot_count,
        layout_key: source.layout_key,
        created_at: now,
        updated_at: now,
    };
    db::scene::insert(&state.pool, &scene).await?;
    db::scene::copy_slots(&state.pool, source.id, scene.id, true).await?;
    broadcast_scene_changed(&state, channel.server_id, channel_id, active_id).await;
    let view = view_of(&state.pool, &scene, active_id, channel_id).await?;
    Ok((StatusCode::CREATED, Json(view)))
}

pub async fn get_scene(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((channel_id, scene_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<SceneView>, ApiError> {
    let _channel = require_voice_channel(&state.pool, account.id, channel_id).await?;
    let scene = require_scene_in_channel(&state.pool, channel_id, scene_id).await?;
    let active_id = db::channel::active_scene_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("no active scene"))?;
    Ok(Json(view_of(&state.pool, &scene, active_id, channel_id).await?))
}

pub async fn patch_scene(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((channel_id, scene_id)): Path<(Uuid, Uuid)>,
    Json(body): Json<PatchSceneBody>,
) -> Result<Json<SceneView>, ApiError> {
    let channel = require_voice_channel(&state.pool, account.id, channel_id).await?;
    require_admin(&state.pool, account.id, channel.server_id).await?;
    let scene = require_scene_in_channel(&state.pool, channel_id, scene_id).await?;
    let active_id = db::channel::active_scene_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("no active scene"))?;
    if let Some(raw) = body.name.as_deref() {
        let name = normalize_name(raw).map_err(ApiError::bad_request)?;
        db::scene::set_name(&state.pool, scene.id, &name).await?;
    }
    if let Some(layout) = body.layout {
        let mapped = validate_layout(&layout).map_err(ApiError::bad_request)?;
        db::scene::replace_slots(
            &state.pool,
            scene.id,
            layout.layout_key,
            layout.slot_count,
            &mapped,
            AssignedBy::Owner,
        )
        .await?;
        if scene.id == active_id {
            db::channel::set_grid_slot_count(&state.pool, channel_id, layout.slot_count).await?;
            let slots = db::scene::list_slots(&state.pool, scene.id, channel_id).await?;
            let live = db::grid::to_layout(&slots, layout.layout_key, layout.slot_count);
            broadcast_grid(&state, channel.server_id, channel_id, &live).await;
        }
    }
    let updated = db::scene::find_by_id(&state.pool, scene.id)
        .await?
        .ok_or_else(|| ApiError::not_found("scene not found"))?;
    broadcast_scene_changed(&state, channel.server_id, channel_id, active_id).await;
    Ok(Json(view_of(&state.pool, &updated, active_id, channel_id).await?))
}

pub async fn delete_scene(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((channel_id, scene_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, ApiError> {
    let channel = require_voice_channel(&state.pool, account.id, channel_id).await?;
    require_admin(&state.pool, account.id, channel.server_id).await?;
    let scene = require_scene_in_channel(&state.pool, channel_id, scene_id).await?;
    let active_id = db::channel::active_scene_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("no active scene"))?;
    if scene.id == active_id {
        return Err(ApiError::conflict("cannot delete the active scene"));
    }
    let count = db::scene::count_for_channel(&state.pool, channel_id).await?;
    if count <= 1 {
        return Err(ApiError::conflict("cannot delete the last scene"));
    }
    db::scene::delete(&state.pool, scene.id).await?;
    broadcast_scene_changed(&state, channel.server_id, channel_id, active_id).await;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn duplicate_scene(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((channel_id, scene_id)): Path<(Uuid, Uuid)>,
    Json(body): Json<CreateSceneBody>,
) -> Result<impl IntoResponse, ApiError> {
    let channel = require_voice_channel(&state.pool, account.id, channel_id).await?;
    require_admin(&state.pool, account.id, channel.server_id).await?;
    let name = normalize_name(&body.name).map_err(ApiError::bad_request)?;
    let count = db::scene::count_for_channel(&state.pool, channel_id).await?;
    if count >= MAX_SCENES_PER_CHANNEL {
        return Err(ApiError::bad_request("channel already has 32 scenes"));
    }
    let source = require_scene_in_channel(&state.pool, channel_id, scene_id).await?;
    let active_id = db::channel::active_scene_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("no active scene"))?;
    let now = Utc::now();
    let scene = Scene {
        id: Uuid::new_v4(),
        channel_id,
        name,
        slot_count: source.slot_count,
        layout_key: source.layout_key,
        created_at: now,
        updated_at: now,
    };
    db::scene::insert(&state.pool, &scene).await?;
    db::scene::copy_slots(&state.pool, source.id, scene.id, true).await?;
    broadcast_scene_changed(&state, channel.server_id, channel_id, active_id).await;
    let view = view_of(&state.pool, &scene, active_id, channel_id).await?;
    Ok((StatusCode::CREATED, Json(view)))
}

pub async fn activate_scene(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((channel_id, scene_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<SceneView>, ApiError> {
    let channel = require_voice_channel(&state.pool, account.id, channel_id).await?;
    if !can_activate(&state.pool, account.id, channel.server_id, channel_id).await? {
        return Err(ApiError::forbidden("cannot activate scenes"));
    }
    let scene = require_scene_in_channel(&state.pool, channel_id, scene_id).await?;
    db::channel::set_active_scene(&state.pool, channel_id, scene.id, scene.slot_count).await?;
    let slots = db::scene::list_slots(&state.pool, scene.id, channel_id).await?;
    let layout = db::grid::to_layout(&slots, scene.layout_key, scene.slot_count);
    broadcast_grid(&state, channel.server_id, channel_id, &layout).await;
    broadcast_scene_changed(&state, channel.server_id, channel_id, scene.id).await;
    Ok(Json(view_of(&state.pool, &scene, scene.id, channel_id).await?))
}
