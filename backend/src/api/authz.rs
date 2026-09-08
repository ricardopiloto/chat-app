use crate::db;
use crate::domain::channel::Channel;
use crate::domain::membership::Membership;
use crate::domain::permissions::{self, EffectiveAccess};
use crate::error::ApiError;
use chrono::{DateTime, Utc};
use sqlx::SqlitePool;
use uuid::Uuid;

pub async fn require_member(
    pool: &SqlitePool,
    account_id: Uuid,
    server_id: Uuid,
) -> Result<(), ApiError> {
    if db::membership::exists(pool, account_id, server_id).await? {
        Ok(())
    } else {
        Err(ApiError::forbidden("not a member of this server"))
    }
}

pub async fn require_channel_member(
    pool: &SqlitePool,
    account_id: Uuid,
    channel_id: Uuid,
) -> Result<(Channel, Membership), ApiError> {
    let channel = db::channel::find_by_id(pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    require_member(pool, account_id, channel.server_id).await?;
    let membership = db::membership::find(pool, account_id, channel.server_id)
        .await?
        .ok_or_else(|| ApiError::forbidden("not a member of this server"))?;
    Ok((channel, membership))
}

pub async fn channel_access(
    pool: &SqlitePool,
    account_id: Uuid,
    channel: &Channel,
) -> Result<(Membership, EffectiveAccess), ApiError> {
    let membership = db::membership::find(pool, account_id, channel.server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    let server = db::server::find_by_id(pool, channel.server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    let is_owner = server.owner_account_id == account_id;
    let caps = db::server_role::aggregated_caps(pool, channel.server_id, account_id).await?;
    let caps = permissions::effective_role_caps(is_owner, caps);
    let role_id = db::server_role::role_id_for_account(pool, channel.server_id, account_id).await?;
    let overwrites = db::channel_acl::list_by_channel(pool, channel.id).await?;
    let decision = permissions::resolve_channel_access_for_member(
        channel,
        is_owner,
        true,
        account_id,
        &caps,
        role_id,
        &overwrites,
    );
    Ok((membership, decision.access))
}

pub async fn channel_access_decision(
    pool: &SqlitePool,
    account_id: Uuid,
    channel: &Channel,
) -> Result<permissions::AccessDecision, ApiError> {
    let server = db::server::find_by_id(pool, channel.server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    let is_member = db::membership::exists(pool, account_id, channel.server_id).await?;
    let is_owner = server.owner_account_id == account_id;
    let caps = if is_member {
        let caps = db::server_role::aggregated_caps(pool, channel.server_id, account_id).await?;
        permissions::effective_role_caps(is_owner, caps)
    } else {
        crate::domain::server_role::RoleCapabilities::open_defaults()
    };
    let role_id = if is_member {
        db::server_role::role_id_for_account(pool, channel.server_id, account_id).await?
    } else {
        None
    };
    let overwrites = db::channel_acl::list_by_channel(pool, channel.id).await?;
    Ok(permissions::resolve_channel_access_for_member(
        channel,
        is_owner,
        is_member,
        account_id,
        &caps,
        role_id,
        &overwrites,
    ))
}

pub async fn require_hierarchy(
    pool: &SqlitePool,
    server_id: Uuid,
    actor_id: Uuid,
    target_id: Uuid,
    owner_account_id: Uuid,
) -> Result<(), ApiError> {
    let actor_is_owner = actor_id == owner_account_id;
    if actor_is_owner {
        return Ok(());
    }
    if target_id == owner_account_id {
        return Err(ApiError::forbidden_code(
            "hierarchy_denied",
            "Não podes moderar o dono do servidor.",
        ));
    }
    let actor_pos = permissions::effective_position(
        false,
        Some(db::server_role::position_for_account(pool, server_id, actor_id).await?),
    );
    let target_pos = permissions::effective_position(
        target_id == owner_account_id,
        Some(db::server_role::position_for_account(pool, server_id, target_id).await?),
    );
    if !permissions::can_moderate_member(actor_pos, target_pos, false) {
        return Err(ApiError::forbidden_code(
            "hierarchy_denied",
            "Não podes moderar este membro: o perfil dele está no mesmo nível ou acima do teu.",
        ));
    }
    Ok(())
}

pub async fn require_channel_view(
    pool: &SqlitePool,
    account_id: Uuid,
    channel_id: Uuid,
) -> Result<(Channel, Membership, EffectiveAccess), ApiError> {
    let channel = db::channel::find_by_id(pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    let (membership, access) = channel_access(pool, account_id, &channel).await?;
    if !access.view {
        return Err(ApiError::not_found("channel not found"));
    }
    Ok((channel, membership, access))
}

pub async fn require_write_text(
    pool: &SqlitePool,
    account_id: Uuid,
    channel_id: Uuid,
) -> Result<(Channel, Membership, EffectiveAccess), ApiError> {
    let result = require_channel_view(pool, account_id, channel_id).await?;
    if !permissions::can_write_text(result.2) {
        return Err(ApiError::forbidden_code(
            "channel_overwrite_deny",
            "Não podes enviar mensagens neste canal (restrição do canal).",
        ));
    }
    let server = db::server::find_by_id(pool, result.0.server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    let caps = db::server_role::aggregated_caps(pool, result.0.server_id, account_id).await?;
    let caps = permissions::effective_role_caps(server.owner_account_id == account_id, caps);
    if !caps.can_send_messages {
        return Err(ApiError::forbidden(
            "sem permissão para enviar mensagens",
        ));
    }
    Ok(result)
}

pub async fn require_speak(
    pool: &SqlitePool,
    account_id: Uuid,
    channel_id: Uuid,
) -> Result<(Channel, Membership, EffectiveAccess), ApiError> {
    let result = require_channel_view(pool, account_id, channel_id).await?;
    if !permissions::can_speak_voice(result.2) {
        return Err(ApiError::forbidden_code(
            "channel_overwrite_deny",
            "Não podes falar neste canal (restrição do canal).",
        ));
    }
    let server = db::server::find_by_id(pool, result.0.server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    let caps = db::server_role::aggregated_caps(pool, result.0.server_id, account_id).await?;
    let caps = permissions::effective_role_caps(server.owner_account_id == account_id, caps);
    if !caps.can_speak_voice || !caps.can_connect_voice {
        return Err(ApiError::forbidden("sem permissão de voz neste servidor"));
    }
    Ok(result)
}

/// `None` = full history. `Some(t)` = messages at or after `t` (invite without include_history).
pub async fn history_visible_since(
    pool: &SqlitePool,
    membership: &Membership,
) -> Result<Option<DateTime<Utc>>, ApiError> {
    let Some(invite_id) = membership.joined_via_invite_id else {
        return Ok(None);
    };
    let Some(invite) = db::invite::find_by_id(pool, invite_id).await? else {
        return Ok(Some(membership.joined_at));
    };
    if invite.include_history {
        Ok(None)
    } else {
        Ok(Some(membership.joined_at))
    }
}
