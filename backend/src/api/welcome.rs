//! Member join welcome announce (077).

use crate::api::messages::send_to_channel_viewers;
use crate::db;
use crate::domain::channel::ChannelType;
use crate::domain::invite::InviteRecord;
use crate::AppState;
use chrono::Utc;
use sqlx::SqlitePool;
use tracing::warn;
use uuid::Uuid;

pub const DEFAULT_WELCOME_TEMPLATE: &str = "Usuário {nome} acabou de entrar no canal";

pub fn render_welcome_text(template: Option<&str>, handle: &str) -> String {
    let raw = template
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .unwrap_or(DEFAULT_WELCOME_TEMPLATE);
    raw.replace("{nome}", handle)
}

/// Owner destination → text channel named `geral` → invite-level channel.
pub async fn resolve_welcome_channel(
    pool: &SqlitePool,
    server_id: Uuid,
    invite_welcome_channel_id: Option<Uuid>,
) -> Result<Option<Uuid>, sqlx::Error> {
    if let Some(settings) = db::server::get_welcome_settings(pool, server_id).await? {
        if let Some(channel_id) = settings.welcome_channel_id {
            if is_text_channel_on_server(pool, server_id, channel_id).await? {
                return Ok(Some(channel_id));
            }
        }
    }

    let channels = db::channel::list_by_server(pool, server_id).await?;
    if let Some(geral) = channels
        .iter()
        .find(|c| c.kind == ChannelType::Text && c.name == "geral")
    {
        return Ok(Some(geral.id));
    }

    if let Some(channel_id) = invite_welcome_channel_id {
        if is_text_channel_on_server(pool, server_id, channel_id).await? {
            return Ok(Some(channel_id));
        }
    }

    Ok(None)
}

/// True when create-invite must supply `welcome_channel_id` (no owner dest and no `geral`).
pub async fn invite_requires_welcome_channel(
    pool: &SqlitePool,
    server_id: Uuid,
) -> Result<bool, sqlx::Error> {
    Ok(resolve_welcome_channel(pool, server_id, None)
        .await?
        .is_none())
}

async fn is_text_channel_on_server(
    pool: &SqlitePool,
    server_id: Uuid,
    channel_id: Uuid,
) -> Result<bool, sqlx::Error> {
    let Some(channel) = db::channel::find_by_id(pool, channel_id).await? else {
        return Ok(false);
    };
    Ok(channel.server_id == server_id && channel.kind == ChannelType::Text)
}

pub async fn validate_text_channel_on_server(
    pool: &SqlitePool,
    server_id: Uuid,
    channel_id: Uuid,
) -> Result<bool, sqlx::Error> {
    is_text_channel_on_server(pool, server_id, channel_id).await
}

/// Insert system welcome + WS `message.new`. Errors are logged; join already committed.
pub async fn announce_member_join(state: &AppState, invite: &InviteRecord, new_member: Uuid) {
    if let Err(e) = announce_member_join_inner(state, invite, new_member).await {
        warn!(
            error = %e,
            server_id = %invite.server_id,
            member = %new_member,
            "welcome announce failed (non-fatal)"
        );
    }
}

async fn announce_member_join_inner(
    state: &AppState,
    invite: &InviteRecord,
    new_member: Uuid,
) -> Result<(), String> {
    let channel_id = resolve_welcome_channel(
        &state.pool,
        invite.server_id,
        invite.welcome_channel_id,
    )
    .await
    .map_err(|e| e.to_string())?
    .ok_or_else(|| "no welcome destination".to_string())?;

    let channel = db::channel::find_by_id(&state.pool, channel_id)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| "welcome channel missing".to_string())?;

    let handle = db::account::find_by_id(&state.pool, new_member)
        .await
        .map_err(|e| e.to_string())?
        .map(|a| a.handle)
        .unwrap_or_else(|| new_member.to_string());

    let template = db::server::get_welcome_settings(&state.pool, invite.server_id)
        .await
        .map_err(|e| e.to_string())?
        .and_then(|s| s.welcome_message_template);

    let plaintext = render_welcome_text(template.as_deref(), &handle);
    let created = db::message::create_system(
        &state.pool,
        Uuid::new_v4(),
        channel_id,
        new_member,
        &plaintext,
        Utc::now(),
    )
    .await
    .map_err(|e| e.to_string())?;

    send_to_channel_viewers(state, &channel, "message.new", &created).await;
    Ok(())
}
