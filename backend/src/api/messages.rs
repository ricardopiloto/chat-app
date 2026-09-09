use crate::api::auth::session::AuthUser;
use crate::api::authz::{history_visible_since, require_channel_view, require_write_text};
use crate::db;
use crate::domain::attachment::MAX_ATTACHMENTS_PER_MESSAGE;
use crate::domain::channel::ChannelType;
use crate::domain::message::Message;
use crate::domain::notification::{NotificationKind, UserNotification};
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

const MAX_MENTIONS_PER_MESSAGE: usize = 20;

#[derive(Debug, Deserialize)]
pub struct PostMessageBody {
    pub content_ciphertext: String,
    #[serde(default)]
    pub attachment_ids: Vec<Uuid>,
    #[serde(default)]
    pub mentioned_account_ids: Vec<Uuid>,
    #[serde(default)]
    pub reply_to_message_id: Option<Uuid>,
}

async fn membership_for_channel(
    pool: &sqlx::SqlitePool,
    account_id: Uuid,
    channel_id: Uuid,
) -> Result<
    (
        crate::domain::channel::Channel,
        crate::domain::membership::Membership,
    ),
    ApiError,
> {
    let (channel, membership, _) = require_channel_view(pool, account_id, channel_id).await?;
    Ok((channel, membership))
}

pub(crate) async fn send_to_channel_viewers<T: Serialize>(
    state: &AppState,
    channel: &crate::domain::channel::Channel,
    event: &str,
    payload: &T,
) {
    let Ok(memberships) = db::membership::list_by_server(&state.pool, channel.server_id).await
    else {
        return;
    };
    let mut account_ids = Vec::new();
    for membership in memberships {
        if let Ok((_, access)) =
            crate::api::authz::channel_access(&state.pool, membership.account_id, channel).await
        {
            if access.view {
                account_ids.push(membership.account_id);
            }
        }
    }
    state
        .ws
        .send_to_accounts(&account_ids, event, channel.server_id, payload);
}

pub async fn list_messages(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    Query(query): Query<MessageQuery>,
) -> Result<Json<Vec<Message>>, ApiError> {
    let (_, membership) = membership_for_channel(&state.pool, account.id, channel_id).await?;
    let since = history_visible_since(&state.pool, &membership).await?;
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
    let (channel, _, _) = require_write_text(&state.pool, account.id, channel_id).await?;
    if let Some(mute) =
        db::channel_mute::get_active(&state.pool, channel_id, account.id, Utc::now()).await?
    {
        return Err(ApiError::forbidden(format!(
            "silenciado neste canal até {}",
            mute.ends_at.to_rfc3339()
        )));
    }
    let ciphertext = base64::engine::general_purpose::STANDARD
        .decode(body.content_ciphertext.trim())
        .map_err(|_| ApiError::bad_request("content_ciphertext must be base64"))?;

    if body.attachment_ids.len() > MAX_ATTACHMENTS_PER_MESSAGE {
        return Err(ApiError::bad_request("at most 10 attachments per message"));
    }
    if body.mentioned_account_ids.len() > MAX_MENTIONS_PER_MESSAGE {
        return Err(ApiError::bad_request("at most 20 mentions per message"));
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

    let mut reply_parent: Option<Message> = None;
    if let Some(parent_id) = body.reply_to_message_id {
        let parent = db::message::find_by_id(&state.pool, parent_id)
            .await?
            .ok_or_else(|| ApiError::bad_request("reply parent not found"))?;
        if parent.channel_id != channel_id {
            return Err(ApiError::bad_request("reply parent must be in the same channel"));
        }
        reply_parent = Some(parent);
    }

    let mut mention_targets = Vec::new();
    for candidate in &body.mentioned_account_ids {
        if *candidate == account.id {
            continue;
        }
        if mention_targets.contains(candidate) {
            continue;
        }
        match crate::api::authz::channel_access(&state.pool, *candidate, &channel).await {
            Ok((_, access)) if access.view => mention_targets.push(*candidate),
            _ => continue,
        }
    }

    let message_id = Uuid::new_v4();
    let now = Utc::now();
    let created = db::message::create(
        &state.pool,
        message_id,
        channel_id,
        account.id,
        &stored,
        now,
        body.reply_to_message_id,
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

    db::message::insert_mentions(&state.pool, message_id, &mention_targets).await?;

    let mut created = created;
    created.attachment_ids = body.attachment_ids.clone();
    created.mentioned_account_ids = mention_targets.clone();
    if let Some(ref parent) = reply_parent {
        created.reply_to_sender_account_id = Some(parent.sender_account_id);
    }

    for target in &mention_targets {
        let n = UserNotification {
            id: Uuid::new_v4(),
            account_id: *target,
            kind: NotificationKind::Mention,
            channel_id,
            message_id: Some(message_id),
            actor_account_id: account.id,
            created_at: now,
            read_at: None,
        };
        db::notification::insert(&state.pool, &n).await?;
        state.ws.send_to_accounts(
            &[*target],
            "notification.created",
            channel.server_id,
            &n,
        );
    }

    if let Some(ref parent) = reply_parent {
        let parent_author = parent.sender_account_id;
        if parent_author != account.id {
            let n = UserNotification {
                id: Uuid::new_v4(),
                account_id: parent_author,
                kind: NotificationKind::Reply,
                channel_id,
                message_id: Some(message_id),
                actor_account_id: account.id,
                created_at: now,
                read_at: None,
            };
            db::notification::insert(&state.pool, &n).await?;
            state.ws.send_to_accounts(
                &[parent_author],
                "notification.created",
                channel.server_id,
                &n,
            );
        }
    }

    // Sender is caught up on this channel (avoid self-unread).
    let _ =
        db::read_state::upsert_last_read(&state.pool, account.id, channel_id, created.created_at)
            .await;

    send_to_channel_viewers(&state, &channel, "message.new", &created).await;
    Ok((StatusCode::CREATED, Json(created)))
}

#[derive(Debug, Deserialize, Default)]
pub struct MarkReadBody {
    pub last_read_at: Option<DateTime<Utc>>,
}

pub async fn mark_channel_read(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    Json(body): Json<MarkReadBody>,
) -> Result<StatusCode, ApiError> {
    let (channel, _) = membership_for_channel(&state.pool, account.id, channel_id).await?;
    if channel.kind != ChannelType::Text {
        return Err(ApiError::bad_request("read state applies to text channels"));
    }
    let ts = body.last_read_at.unwrap_or_else(Utc::now);
    db::read_state::upsert_last_read(&state.pool, account.id, channel_id, ts).await?;
    Ok(StatusCode::NO_CONTENT)
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
        {
            let caps = db::server_role::aggregated_caps(
                &state.pool,
                channel.server_id,
                account.id,
            )
            .await?;
            permissions::effective_role_caps(
                server.owner_account_id == account.id,
                caps,
            )
            .can_delete_messages
        },
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
    send_to_channel_viewers(&state, &channel, "message.deleted", &payload).await;

    Ok(StatusCode::NO_CONTENT)
}
