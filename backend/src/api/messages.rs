use crate::api::auth::session::AuthUser;
use crate::api::channels::require_member;
use crate::db;
use crate::domain::message::Message;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use base64::Engine;
use chrono::{DateTime, Utc};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct MessageQuery {
    pub before: Option<DateTime<Utc>>,
}

#[derive(Debug, Deserialize)]
pub struct PostMessageBody {
    pub content_ciphertext: String,
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
    if ciphertext.is_empty() {
        return Err(ApiError::bad_request("content_ciphertext required"));
    }
    let created = db::message::create(
        &state.pool,
        Uuid::new_v4(),
        channel_id,
        account.id,
        &ciphertext,
        Utc::now(),
    )
    .await?;
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
