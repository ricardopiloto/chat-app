use crate::api::auth::session::AuthUser;
use crate::api::channels::require_member;
use crate::db;
use crate::domain::attachment::{
    is_allowed_media_type, MessageAttachment, MAX_ATTACHMENT_BYTES,
};
use crate::domain::channel::ChannelType;
use crate::error::ApiError;
use crate::AppState;
use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::http::{header, HeaderMap, StatusCode};
use axum::response::Response;
use axum::Json;
use chrono::Utc;
use uuid::Uuid;

async fn require_text_channel_member(
    pool: &sqlx::SqlitePool,
    account_id: Uuid,
    channel_id: Uuid,
) -> Result<crate::domain::channel::Channel, ApiError> {
    let channel = db::channel::find_by_id(pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    if channel.kind != ChannelType::Text {
        return Err(ApiError::bad_request("attachments only allowed on text channels"));
    }
    require_member(pool, account_id, channel.server_id).await?;
    Ok(channel)
}

pub async fn upload_attachment(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<(StatusCode, Json<MessageAttachment>), ApiError> {
    let _channel = require_text_channel_member(&state.pool, account.id, channel_id).await?;
    let media_type = headers
        .get("x-mesa-media-type")
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .trim()
        .to_ascii_lowercase();
    if !is_allowed_media_type(&media_type) {
        return Err(ApiError::bad_request(
            "X-Mesa-Media-Type must be image/jpeg, image/png, image/webp, or image/gif",
        ));
    }
    if body.is_empty() {
        return Err(ApiError::bad_request("empty attachment body"));
    }
    if body.len() > MAX_ATTACHMENT_BYTES {
        return Err(ApiError::bad_request("attachment exceeds 8 MiB limit"));
    }

    let id = Uuid::new_v4();
    let path = state.config.attachments_dir.join(id.to_string());
    tokio::fs::write(&path, &body)
        .await
        .map_err(|_| ApiError::internal("failed to store attachment"))?;

    let created = db::attachment::insert_pending(
        &state.pool,
        id,
        channel_id,
        account.id,
        &media_type,
        body.len() as i64,
        Utc::now(),
    )
    .await
    .map_err(|_| ApiError::internal("failed to record attachment"))?;

    Ok((StatusCode::CREATED, Json(created)))
}

pub async fn get_attachment(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(attachment_id): Path<Uuid>,
) -> Result<Response, ApiError> {
    let attachment = db::attachment::find_by_id(&state.pool, attachment_id)
        .await?
        .ok_or_else(|| ApiError::not_found("attachment not found"))?;

    let channel = db::channel::find_by_id(&state.pool, attachment.channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    require_member(&state.pool, account.id, channel.server_id).await?;

    if let Some(message_id) = attachment.message_id {
        let membership = db::membership::find(&state.pool, account.id, channel.server_id)
            .await?
            .ok_or_else(|| ApiError::forbidden("not a member of this server"))?;
        if let Some(since) = history_since(&state.pool, &membership).await? {
            let message = db::message::find_by_id(&state.pool, message_id)
                .await?
                .ok_or_else(|| ApiError::not_found("attachment not found"))?;
            if message.created_at < since {
                return Err(ApiError::forbidden("attachment outside your history"));
            }
        }
    } else if attachment.uploader_account_id != account.id {
        return Err(ApiError::forbidden("pending attachment not available"));
    }

    let path = state.config.attachments_dir.join(attachment.id.to_string());
    let bytes = tokio::fs::read(&path)
        .await
        .map_err(|_| ApiError::not_found("attachment blob missing"))?;

    let mut response = Response::new(bytes.into());
    *response.status_mut() = StatusCode::OK;
    response.headers_mut().insert(
        header::CONTENT_TYPE,
        header::HeaderValue::from_static("application/octet-stream"),
    );
    if let Ok(v) = header::HeaderValue::from_str(&attachment.content_type) {
        response.headers_mut().insert("x-mesa-media-type", v);
    }
    Ok(response)
}

async fn history_since(
    pool: &sqlx::SqlitePool,
    membership: &crate::domain::membership::Membership,
) -> Result<Option<chrono::DateTime<Utc>>, ApiError> {
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
