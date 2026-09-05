use crate::api::auth::session::AuthUser;
use crate::api::channels::require_member;
use crate::db;
use crate::domain::attachment::MAX_ATTACHMENTS_PER_MESSAGE;
use crate::domain::channel::ChannelType;
use crate::domain::message::Message;
use crate::domain::permissions;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use base64::Engine;
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct MessageQuery {
    pub before: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct PostMessageBody {
    pub content_ciphertext: String,
    #[serde(default)]
    pub attachment_ids: Vec<Uuid>,
}

async fn membership_for_channel(
    pool: &sqlx::SqlitePool,
    account_id: Uuid,
    channel_id: Uuid,
) -> Result<(crate::domain::channel::Channel, crate::domain::membership::Membership), ApiError> {
    let channel = db::channel::find_by_id(pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    require_member(pool, account_id, channel.server_id).await?;
    let membership = db::membership::find(pool, account_id, channel.server_id)
        .await?
        .ok_or_else(|| ApiError::forbidden("not a member of this server"))?;
    Ok((channel, membership))
}

async fn history_since(
    pool: &sqlx::SqlitePool,
    membership: &crate::domain::membership::Membership,
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

pub async fn list_messages(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    Query(query): Query<MessageQuery>,
) -> Result<Json<Vec<Message>>, ApiError> {
    let (_, membership) = membership_for_channel(&state.pool, account.id, channel_id).await?;
    let since = history_since(&state.pool, &membership).await?;
    Ok(Json(
        db::message::list_since(&state.pool, channel_id, since, query.before, 200).await?,
    ))
}

pub async fn post_message(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    Json(body): Json<PostMessageBody>,
) -> Result<impl IntoResponse, ApiError> {
    let (channel, _) = membership_for_channel(&state.pool, account.id, channel_id).await?;
    let ciphertext = base64::engine::general_purpose::STANDARD
        .decode(body.content_ciphertext.trim())
        .map_err(|_| ApiError::bad_request("content_ciphertext must be base64"))?;

    if body.attachment_ids.len() > MAX_ATTACHMENTS_PER_MESSAGE {
        return Err(ApiError::bad_request("at most 10 attachments per message"));
    }
    if ciphertext.is_empty() && body.attachment_ids.is_empty() {
        return Err(ApiError::bad_request(
            "content_ciphertext or attachment_ids required",
        ));
    }

    // Empty ciphertext allowed only with attachments — store a single zero byte marker
    // so DB NOT NULL / consumers still have a blob; client encrypts empty string normally
    // (non-empty AES-GCM pack). Reject truly empty decoded buffer without attachments above.
    let stored = if ciphertext.is_empty() {
        // Should not happen if client encrypts ""; keep guard for media-only mishaps
        return Err(ApiError::bad_request(
            "content_ciphertext must be non-empty base64 (encrypt empty string for media-only)",
        ));
    } else {
        ciphertext
    };

    let message_id = Uuid::new_v4();
    let created = db::message::create(
        &state.pool,
        message_id,
        channel_id,
        account.id,
        &stored,
        Utc::now(),
    )
    .await?;

    for attachment_id in &body.attachment_ids {
        db::attachment::bind_to_message(
            &state.pool,
            *attachment_id,
            message_id,
            channel_id,
            account.id,
        )
        .await
        .map_err(|_| {
            ApiError::bad_request(
                "invalid attachment_id (missing, already bound, or not yours on this channel)",
            )
        })?;
    }

    let mut created = created;
    created.attachment_ids = body.attachment_ids.clone();

    state
        .ws
        .send_to_server_members(
            &state.pool,
            channel.server_id,
            "message.new",
            &created,
        )
        .await;
    Ok((StatusCode::CREATED, Json(created)))
}

#[derive(Debug, Serialize)]
struct MessageDeletedPayload {
    id: Uuid,
    channel_id: Uuid,
}

pub async fn delete_message(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((channel_id, message_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, ApiError> {
    let (channel, _) = membership_for_channel(&state.pool, account.id, channel_id).await?;
    if channel.kind != ChannelType::Text {
        return Err(ApiError::not_found("message not found"));
    }

    let server = db::server::find_by_id(&state.pool, channel.server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;

    let message = db::message::find_by_id(&state.pool, message_id)
        .await?
        .ok_or_else(|| ApiError::not_found("message not found"))?;
    if message.channel_id != channel_id {
        return Err(ApiError::not_found("message not found"));
    }

    if !permissions::can_delete_text_message(
        account.id,
        message.sender_account_id,
        channel.created_by_account_id,
        server.owner_account_id,
    ) {
        return Err(ApiError::forbidden("not allowed to delete this message"));
    }

    db::attachment::delete_files_for_message(
        &state.pool,
        &state.config.attachments_dir,
        message_id,
    )
    .await
    .map_err(|_| ApiError::internal("failed to remove attachment files"))?;

    let deleted = db::message::delete_by_id(&state.pool, message_id, channel_id)
        .await
        .map_err(|_| ApiError::internal("failed to delete message"))?;
    if !deleted {
        return Err(ApiError::not_found("message not found"));
    }

    let payload = MessageDeletedPayload {
        id: message_id,
        channel_id,
    };
    state
        .ws
        .send_to_server_members(&state.pool, channel.server_id, "message.deleted", &payload)
        .await;

    Ok(StatusCode::NO_CONTENT)
}
