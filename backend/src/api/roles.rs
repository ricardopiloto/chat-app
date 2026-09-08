use crate::api::auth::session::AuthUser;
use crate::domain::permissions;
use crate::domain::server_role::{is_dono_name, RoleCapabilities};
use crate::{db, error::ApiError, AppState};
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::Json;
use serde::Deserialize;
use uuid::Uuid;

async fn server_for_member(
    state: &AppState,
    account_id: Uuid,
    server_id: Uuid,
) -> Result<crate::domain::server::Server, ApiError> {
    let server = db::server::find_by_id(&state.pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    crate::api::authz::require_member(&state.pool, account_id, server_id).await?;
    Ok(server)
}

async fn require_manage_roles(
    state: &AppState,
    account_id: Uuid,
    server_id: Uuid,
) -> Result<crate::domain::server::Server, ApiError> {
    let server = server_for_member(state, account_id, server_id).await?;
    if server.owner_account_id == account_id {
        return Ok(server);
    }
    let caps = db::server_role::aggregated_caps(&state.pool, server_id, account_id).await?;
    if !caps.can_manage_roles {
        return Err(ApiError::forbidden(
            "missing permission to manage roles",
        ));
    }
    Ok(server)
}

async fn actor_position(
    pool: &sqlx::SqlitePool,
    server_id: Uuid,
    account_id: Uuid,
    owner_id: Uuid,
) -> Result<i64, ApiError> {
    Ok(permissions::effective_position(
        account_id == owner_id,
        Some(db::server_role::position_for_account(pool, server_id, account_id).await?),
    ))
}

fn hierarchy_err() -> ApiError {
    ApiError::forbidden_code(
        "hierarchy_denied",
        "Não podes moderar este membro: o perfil dele está no mesmo nível ou acima do teu.",
    )
}

pub async fn list_roles(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
) -> Result<Json<Vec<crate::domain::server_role::ServerRole>>, ApiError> {
    server_for_member(&state, account.id, server_id).await?;
    Ok(Json(
        db::server_role::list_by_server(&state.pool, server_id).await?,
    ))
}

#[derive(Debug, Deserialize)]
pub struct CreateRoleBody {
    pub name: String,
    #[serde(default)]
    pub can_create_channels: bool,
    #[serde(default)]
    pub capabilities: Option<RoleCapabilities>,
}

pub async fn create_role(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
    Json(body): Json<CreateRoleBody>,
) -> Result<(StatusCode, Json<crate::domain::server_role::ServerRole>), ApiError> {
    require_manage_roles(&state, account.id, server_id).await?;
    let name = body.name.trim().to_string();
    if name.is_empty() {
        return Err(ApiError::bad_request("name required"));
    }
    if is_dono_name(&name) {
        return Err(ApiError::bad_request("name Dono is reserved"));
    }
    let mut caps = body.capabilities.unwrap_or_else(RoleCapabilities::open_defaults);
    if body.can_create_channels {
        caps.can_manage_channels = true;
    }
    let position = db::server_role::next_bottom_position(&state.pool, server_id).await?;
    let role = crate::domain::server_role::ServerRole {
        id: Uuid::new_v4(),
        server_id,
        name,
        can_create_channels: caps.can_manage_channels,
        capabilities: caps,
        is_system: false,
        position,
        member_ids: Vec::new(),
    };
    db::server_role::create(&state.pool, &role).await?;
    let role = db::server_role::find_by_id(&state.pool, role.id)
        .await?
        .ok_or_else(|| ApiError::not_found("role not found"))?;
    Ok((StatusCode::CREATED, Json(role)))
}

#[derive(Debug, Deserialize)]
pub struct PatchRoleBody {
    pub name: Option<String>,
    pub can_create_channels: Option<bool>,
    pub capabilities: Option<RoleCapabilities>,
}

pub async fn patch_role(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((server_id, role_id)): Path<(Uuid, Uuid)>,
    Json(body): Json<PatchRoleBody>,
) -> Result<Json<crate::domain::server_role::ServerRole>, ApiError> {
    let server = require_manage_roles(&state, account.id, server_id).await?;
    if body
        .name
        .as_deref()
        .is_some_and(|name| name.trim().is_empty())
    {
        return Err(ApiError::bad_request("name cannot be empty"));
    }
    let role = db::server_role::find_by_id(&state.pool, role_id)
        .await?
        .filter(|role| role.server_id == server_id)
        .ok_or_else(|| ApiError::not_found("role not found"))?;
    let actor_pos =
        actor_position(&state.pool, server_id, account.id, server.owner_account_id).await?;
    if !permissions::can_manage_role_target(
        actor_pos,
        role.position,
        account.id == server.owner_account_id,
        role.is_system,
    ) {
        return Err(hierarchy_err());
    }
    if role.is_system {
        let wants_name = body
            .name
            .as_deref()
            .map(str::trim)
            .filter(|n| !n.is_empty() && *n != role.name.as_str());
        let wants_caps = body.capabilities.is_some() || body.can_create_channels.is_some();
        if wants_name.is_some() || wants_caps {
            return Err(ApiError::forbidden("cannot modify system role Dono"));
        }
        return Ok(Json(role));
    }
    if body.name.as_deref().is_some_and(is_dono_name) {
        return Err(ApiError::bad_request("name Dono is reserved"));
    }
    let mut caps = body.capabilities.unwrap_or(role.capabilities.clone());
    if let Some(v) = body.can_create_channels {
        caps.can_manage_channels = v;
    }
    db::server_role::update_full(&state.pool, role.id, body.name.as_deref(), &caps).await?;
    Ok(Json(
        db::server_role::find_by_id(&state.pool, role_id)
            .await?
            .ok_or_else(|| ApiError::not_found("role not found"))?,
    ))
}

pub async fn delete_role(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((server_id, role_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, ApiError> {
    let server = require_manage_roles(&state, account.id, server_id).await?;
    let role = db::server_role::find_by_id(&state.pool, role_id)
        .await?
        .filter(|role| role.server_id == server_id)
        .ok_or_else(|| ApiError::not_found("role not found"))?;
    if role.is_system {
        return Err(ApiError::forbidden("cannot delete system role Dono"));
    }
    let actor_pos =
        actor_position(&state.pool, server_id, account.id, server.owner_account_id).await?;
    if !permissions::can_manage_role_target(
        actor_pos,
        role.position,
        account.id == server.owner_account_id,
        false,
    ) {
        return Err(hierarchy_err());
    }
    db::server_role::delete(&state.pool, role_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Deserialize)]
pub struct RolePositionUpdate {
    pub id: Uuid,
    pub position: i64,
}

#[derive(Debug, Deserialize)]
pub struct PutPositionsBody {
    pub roles: Vec<RolePositionUpdate>,
}

pub async fn put_role_positions(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
    Json(body): Json<PutPositionsBody>,
) -> Result<Json<Vec<crate::domain::server_role::ServerRole>>, ApiError> {
    let server = require_manage_roles(&state, account.id, server_id).await?;
    let actor_is_owner = account.id == server.owner_account_id;
    let actor_pos =
        actor_position(&state.pool, server_id, account.id, server.owner_account_id).await?;
    let mut updates = Vec::new();
    for item in &body.roles {
        let role = db::server_role::find_by_id(&state.pool, item.id)
            .await?
            .filter(|r| r.server_id == server_id)
            .ok_or_else(|| ApiError::not_found("role not found"))?;
        if role.is_system {
            return Err(ApiError::forbidden("cannot reorder system role Dono"));
        }
        if !actor_is_owner {
            if role.position >= actor_pos {
                return Err(hierarchy_err());
            }
            if item.position >= actor_pos {
                return Err(ApiError::forbidden_code(
                    "hierarchy_denied",
                    "Não podes colocar um perfil no mesmo nível ou acima do teu.",
                ));
            }
        }
        updates.push((item.id, item.position));
    }
    db::server_role::set_positions(&state.pool, server_id, &updates).await?;
    Ok(Json(
        db::server_role::list_by_server(&state.pool, server_id).await?,
    ))
}

#[derive(Debug, Deserialize)]
pub struct SetMembersBody {
    pub member_ids: Vec<Uuid>,
}

pub async fn set_role_members(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((server_id, role_id)): Path<(Uuid, Uuid)>,
    Json(body): Json<SetMembersBody>,
) -> Result<Json<crate::domain::server_role::ServerRole>, ApiError> {
    let server = require_manage_roles(&state, account.id, server_id).await?;
    let role = db::server_role::find_by_id(&state.pool, role_id)
        .await?
        .filter(|role| role.server_id == server_id)
        .ok_or_else(|| ApiError::not_found("role not found"))?;
    if role.is_system {
        return Err(ApiError::forbidden(
            "cannot reassign system role Dono via bulk members",
        ));
    }
    let actor_pos =
        actor_position(&state.pool, server_id, account.id, server.owner_account_id).await?;
    if !permissions::can_manage_role_target(
        actor_pos,
        role.position,
        account.id == server.owner_account_id,
        false,
    ) {
        return Err(hierarchy_err());
    }
    for member_id in &body.member_ids {
        if !db::membership::exists(&state.pool, *member_id, server_id).await? {
            return Err(ApiError::bad_request("role account is not a server member"));
        }
        crate::api::authz::require_hierarchy(
            &state.pool,
            server_id,
            account.id,
            *member_id,
            server.owner_account_id,
        )
        .await?;
    }
    db::server_role::set_members(&state.pool, role_id, &body.member_ids).await?;
    Ok(Json(
        db::server_role::find_by_id(&state.pool, role_id)
            .await?
            .ok_or_else(|| ApiError::not_found("role not found"))?,
    ))
}

#[derive(Debug, Deserialize)]
pub struct SetMemberRoleBody {
    pub role_id: Option<Uuid>,
}

pub async fn put_member_role(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((server_id, account_id)): Path<(Uuid, Uuid)>,
    Json(body): Json<SetMemberRoleBody>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let server = require_manage_roles(&state, account.id, server_id).await?;
    if !db::membership::exists(&state.pool, account_id, server_id).await? {
        return Err(ApiError::bad_request("account is not a server member"));
    }
    crate::api::authz::require_hierarchy(
        &state.pool,
        server_id,
        account.id,
        account_id,
        server.owner_account_id,
    )
    .await?;
    let is_owner = account_id == server.owner_account_id;
    let target_role = match body.role_id {
        Some(role_id) => Some(
            db::server_role::find_by_id(&state.pool, role_id)
                .await?
                .filter(|role| role.server_id == server_id)
                .ok_or_else(|| ApiError::not_found("role not found"))?,
        ),
        None => None,
    };
    if is_owner {
        let Some(role) = target_role.as_ref() else {
            return Err(ApiError::forbidden("server owner must remain on role Dono"));
        };
        if !role.is_system {
            return Err(ApiError::forbidden("server owner must remain on role Dono"));
        }
    } else if target_role.as_ref().is_some_and(|r| r.is_system) {
        return Err(ApiError::forbidden("only the server owner may hold role Dono"));
    }
    if let Some(role) = target_role.as_ref() {
        let actor_pos =
            actor_position(&state.pool, server_id, account.id, server.owner_account_id).await?;
        if account.id != server.owner_account_id && role.position >= actor_pos {
            return Err(ApiError::forbidden_code(
                "hierarchy_denied",
                "Não podes atribuir um perfil no mesmo nível ou acima do teu.",
            ));
        }
    }
    db::server_role::set_member_role(&state.pool, server_id, account_id, body.role_id).await?;
    Ok(Json(serde_json::json!({
        "account_id": account_id,
        "role_id": body.role_id,
    })))
}

pub async fn get_presence(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    server_for_member(&state, account.id, server_id).await?;
    let members = db::membership::list_by_server(&state.pool, server_id).await?;
    let online: Vec<Uuid> = members
        .into_iter()
        .map(|m| m.account_id)
        .filter(|id| state.ws.is_online(*id))
        .collect();
    Ok(Json(serde_json::json!({ "online_account_ids": online })))
}

pub async fn delete_member(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((server_id, member_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, ApiError> {
    let server = server_for_member(&state, account.id, server_id).await?;
    let is_owner = server.owner_account_id == account.id;
    if !is_owner {
        let caps = db::server_role::aggregated_caps(&state.pool, server_id, account.id).await?;
        if !caps.can_remove_members {
            return Err(ApiError::forbidden("missing permission to remove members"));
        }
    }
    if member_id == server.owner_account_id {
        return Err(ApiError::conflict("cannot remove the server owner"));
    }
    crate::api::authz::require_hierarchy(
        &state.pool,
        server_id,
        account.id,
        member_id,
        server.owner_account_id,
    )
    .await?;
    if !db::membership::delete(&state.pool, member_id, server_id).await? {
        return Err(ApiError::not_found("member not found"));
    }
    let _ = db::channel_mute::delete_for_account_on_server(&state.pool, server_id, member_id).await;
    Ok(StatusCode::NO_CONTENT)
}
