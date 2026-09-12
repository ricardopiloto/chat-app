use crate::api::auth::session::AuthUser;
use crate::api::authz::{channel_access, require_channel_view, require_member};
use crate::api::channel_provision;
use crate::db;
use crate::domain::channel::{ChannelType, ChannelVisibility};
use crate::domain::channel_acl::{
    AclEffect, AclSubjectType, ChannelAclEntry, PermLevel, EVERYONE_SUBJECT_ID,
};
use crate::domain::channel_name;
use crate::domain::permissions;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateChannelBody {
    pub name: String,
    #[serde(rename = "type")]
    pub kind: ChannelType,
    pub grid_slot_count: Option<i64>,
    pub visibility: Option<ChannelVisibility>,
    pub custody_ack: Option<bool>,
    pub channel_key_sealed: Option<String>,
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
    let role_can_create =
        db::server_role::account_has_can_create(&state.pool, server_id, account.id).await?;
    if !permissions::can_create_channel(server.owner_account_id == account.id, role_can_create) {
        return Err(ApiError::forbidden("sem permissão para criar canais"));
    }
    let channel = channel_provision::provision_channel(
        &state.pool,
        server_id,
        account.id,
        body.name,
        body.kind,
        body.grid_slot_count,
        body.visibility,
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
    let mut visible = Vec::new();
    for mut channel in db::channel::list_by_server(&state.pool, server_id).await? {
        let (_, access) = channel_access(&state.pool, account.id, &channel).await?;
        if access.view {
            channel.my_permission = access.level.map(|level| level.as_str().to_string());
            visible.push(channel);
        }
    }
    Ok(Json(visible))
}

pub async fn get_channel(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<Json<crate::domain::channel::Channel>, ApiError> {
    let (mut channel, _, access) =
        require_channel_view(&state.pool, account.id, channel_id).await?;
    channel.my_permission = access.level.map(|level| level.as_str().to_string());
    Ok(Json(channel))
}

#[derive(Debug, Deserialize)]
pub struct PatchChannelBody {
    pub name: Option<String>,
    pub visibility: Option<ChannelVisibility>,
    pub visible_to_new_members: Option<bool>,
}

pub async fn patch_channel(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    Json(body): Json<PatchChannelBody>,
) -> Result<Json<crate::domain::channel::Channel>, ApiError> {
    let _managed = require_channel_manager(&state, account.id, channel_id).await?;

    if let Some(raw_name) = body.name {
        let name = channel_name::validate_channel_name(&raw_name).map_err(ApiError::bad_request)?;
        db::channel::update_name(&state.pool, channel_id, &name).await?;
    }

    if body.visibility.is_some() || body.visible_to_new_members.is_some() {
        let channel = db::channel::find_by_id(&state.pool, channel_id)
            .await?
            .ok_or_else(|| ApiError::not_found("channel not found"))?;
        let visibility = body.visibility.unwrap_or(channel.visibility);
        let visible_to_new_members = if visibility == ChannelVisibility::Private {
            if body.visible_to_new_members == Some(true) {
                return Err(ApiError::bad_request(
                    "private channels cannot be visible to new members",
                ));
            }
            false
        } else {
            body.visible_to_new_members.unwrap_or_else(|| {
                if channel.visibility == ChannelVisibility::Private {
                    true
                } else {
                    channel.visible_to_new_members
                }
            })
        };
        db::channel::update_visibility(&state.pool, channel_id, visibility, visible_to_new_members)
            .await?;
    }

    get_channel(State(state), AuthUser(account), Path(channel_id)).await
}

fn valid_level(kind: ChannelType, level: PermLevel) -> bool {
    matches!(
        (kind, level),
        (ChannelType::Text, PermLevel::Read | PermLevel::Write)
            | (
                ChannelType::VoiceVideo,
                PermLevel::Listen | PermLevel::Speak
            )
    )
}

struct ChannelManagerCtx {
    channel: crate::domain::channel::Channel,
    server: crate::domain::server::Server,
    is_owner: bool,
    is_creator: bool,
    actor_pos: i64,
}

async fn require_channel_manager(
    state: &AppState,
    account_id: Uuid,
    channel_id: Uuid,
) -> Result<ChannelManagerCtx, ApiError> {
    let channel = db::channel::find_by_id(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    require_member(&state.pool, account_id, channel.server_id).await?;
    let server = db::server::find_by_id(&state.pool, channel.server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    let is_owner = server.owner_account_id == account_id;
    let is_creator = channel.created_by_account_id == account_id;
    let caps = db::server_role::aggregated_caps(&state.pool, channel.server_id, account_id).await?;
    let caps = permissions::effective_role_caps(is_owner, caps);
    let actor_pos = permissions::effective_position(
        is_owner,
        Some(
            db::server_role::position_for_account(&state.pool, channel.server_id, account_id)
                .await?,
        ),
    );
    let creator_is_owner = channel.created_by_account_id == server.owner_account_id;
    let creator_pos = permissions::effective_position(
        creator_is_owner,
        Some(
            db::server_role::position_for_account(
                &state.pool,
                channel.server_id,
                channel.created_by_account_id,
            )
            .await?,
        ),
    );
    if !permissions::can_manage_channel(
        is_owner,
        is_creator,
        caps.can_manage_channels,
        actor_pos,
        creator_pos,
    ) {
        return Err(ApiError::forbidden_code(
            "hierarchy_denied",
            "sem permissão para gerir este canal",
        ));
    }
    Ok(ChannelManagerCtx {
        channel,
        server,
        is_owner,
        is_creator,
        actor_pos,
    })
}

pub async fn get_acl(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<Json<Vec<ChannelAclEntry>>, ApiError> {
    let ctx = require_channel_manager(&state, account.id, channel_id).await?;
    Ok(Json(
        db::channel_acl::list_by_channel(&state.pool, ctx.channel.id).await?,
    ))
}

#[derive(Debug, Deserialize)]
pub struct PutAclEntry {
    pub subject_type: AclSubjectType,
    #[serde(default = "nil_uuid")]
    pub subject_id: Uuid,
    pub level: PermLevel,
    #[serde(default = "default_allow_effect")]
    pub effect: AclEffect,
}

fn nil_uuid() -> Uuid {
    EVERYONE_SUBJECT_ID
}

fn default_allow_effect() -> AclEffect {
    AclEffect::Allow
}

pub async fn put_acl(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    Json(body): Json<Vec<PutAclEntry>>,
) -> Result<Json<Vec<ChannelAclEntry>>, ApiError> {
    use crate::domain::channel::ChannelVisibility;
    let ctx = require_channel_manager(&state, account.id, channel_id).await?;
    let channel = &ctx.channel;
    let mut entries = Vec::with_capacity(body.len());
    for input in body {
        if !valid_level(channel.kind, input.level) {
            return Err(ApiError::bad_request(
                "permission level does not match channel type",
            ));
        }
        if input.effect == AclEffect::Deny
            && input.level.is_view_level()
            && channel.visibility == ChannelVisibility::Public
        {
            return Err(ApiError::bad_request_code(
                "deny_view_public",
                "Não é possível negar visualização em canais públicos.",
            ));
        }
        let subject_id = match input.subject_type {
            AclSubjectType::Everyone => EVERYONE_SUBJECT_ID,
            AclSubjectType::Account => {
                if !db::membership::exists(&state.pool, input.subject_id, channel.server_id).await?
                {
                    return Err(ApiError::bad_request("ACL account is not a server member"));
                }
                let subject_is_owner = input.subject_id == ctx.server.owner_account_id;
                let subject_pos = permissions::effective_position(
                    subject_is_owner,
                    Some(
                        db::server_role::position_for_account(
                            &state.pool,
                            channel.server_id,
                            input.subject_id,
                        )
                        .await?,
                    ),
                );
                if !permissions::can_acl_overwrite_subject(
                    ctx.is_owner,
                    ctx.is_creator,
                    ctx.actor_pos,
                    subject_pos,
                ) {
                    return Err(ApiError::forbidden_code(
                        "hierarchy_denied",
                        "Não podes alterar sobrescritas para membros no mesmo nível ou acima do teu.",
                    ));
                }
                input.subject_id
            }
            AclSubjectType::Role => {
                let role = db::server_role::find_by_id(&state.pool, input.subject_id)
                    .await?
                    .ok_or_else(|| ApiError::bad_request("ACL role not found"))?;
                if role.server_id != channel.server_id {
                    return Err(ApiError::bad_request("ACL role belongs to another server"));
                }
                if !permissions::can_acl_overwrite_subject(
                    ctx.is_owner,
                    ctx.is_creator,
                    ctx.actor_pos,
                    role.position,
                ) {
                    return Err(ApiError::forbidden_code(
                        "hierarchy_denied",
                        "Não podes alterar sobrescritas para papéis no mesmo nível ou acima do teu.",
                    ));
                }
                input.subject_id
            }
        };
        entries.push(ChannelAclEntry {
            id: Uuid::new_v4(),
            channel_id,
            subject_type: input.subject_type,
            subject_id,
            level: input.level,
            effect: input.effect,
        });
    }
    db::channel_acl::replace_all(&state.pool, channel_id, &entries).await?;
    get_acl(State(state), AuthUser(account), Path(channel_id)).await
}

pub async fn get_channel_access(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((channel_id, target_id)): Path<(Uuid, Uuid)>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let ctx = require_channel_manager(&state, account.id, channel_id).await?;
    if !db::membership::exists(&state.pool, target_id, ctx.channel.server_id).await? {
        return Err(ApiError::not_found("member not found"));
    }
    let decision =
        crate::api::authz::channel_access_decision(&state.pool, target_id, &ctx.channel).await?;
    Ok(Json(serde_json::json!({
        "account_id": target_id,
        "channel_id": channel_id,
        "view": decision.access.view,
        "level": decision.access.level.map(|l| l.as_str()),
        "factors": decision.factors,
    })))
}

#[derive(Debug, Serialize)]
pub struct MentionableView {
    pub account_id: Uuid,
    pub handle: String,
    pub has_avatar: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
}

/// Members with channel view access, excluding the caller (for @ mention picker / resolve).
pub async fn list_mentionables(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<Json<Vec<MentionableView>>, ApiError> {
    let (channel, _, _) = require_channel_view(&state.pool, account.id, channel_id).await?;
    let memberships = db::membership::list_by_server(&state.pool, channel.server_id).await?;
    let mut out = Vec::new();
    for m in memberships {
        if m.account_id == account.id {
            continue;
        }
        match channel_access(&state.pool, m.account_id, &channel).await {
            Ok((_, access)) if access.view => {}
            _ => continue,
        }
        let Some(acc) = db::account::find_by_id(&state.pool, m.account_id).await? else {
            continue;
        };
        out.push(MentionableView {
            account_id: acc.id,
            handle: acc.handle,
            has_avatar: acc.avatar_filename.is_some(),
            display_name: acc.display_name,
        });
    }
    out.sort_by(|a, b| {
        a.handle
            .to_lowercase()
            .cmp(&b.handle.to_lowercase())
            .then_with(|| a.account_id.cmp(&b.account_id))
    });
    Ok(Json(out))
}

pub async fn delete_channel(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    let ctx = require_channel_manager(&state, account.id, channel_id).await?;
    let channel = ctx.channel;
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
