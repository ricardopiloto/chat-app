use crate::api::auth::session::{hash_token, AuthUser};
use crate::api::{avatars, channels, messages::send_to_channel_viewers};
use crate::db;
use crate::domain::account::normalize_display_name;
use crate::domain::channel::ChannelType;
use crate::domain::channel_webhook::{ChannelWebhook, WEBHOOK_CONTENT_MAX_CHARS};
use crate::domain::message::Message;
use crate::error::ApiError;
use crate::rate_limit::{ClientIp, WEBHOOK_POST_WINDOW_SECS};
use crate::AppState;
use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::http::{header, HeaderMap, HeaderValue, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::Json;
use chrono::Utc;
use rand::RngCore;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub const WEBHOOK_BODY_LIMIT: usize = WEBHOOK_CONTENT_MAX_CHARS * 4 + 4096;

fn new_token() -> String {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    hex::encode(bytes)
}
fn no_store<T: IntoResponse>(value: T) -> Response {
    let mut response = value.into_response();
    response
        .headers_mut()
        .insert(header::CACHE_CONTROL, HeaderValue::from_static("no-store"));
    response
}
async fn managed(
    state: &AppState,
    account_id: Uuid,
    channel_id: Uuid,
) -> Result<crate::domain::channel::Channel, ApiError> {
    Ok(
        channels::require_channel_manager(state, account_id, channel_id)
            .await?
            .channel,
    )
}
async fn matching(
    state: &AppState,
    channel_id: Uuid,
    webhook_id: Uuid,
) -> Result<db::channel_webhook::ChannelWebhookRow, ApiError> {
    let row = db::channel_webhook::find_by_channel(&state.pool, channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("webhook not found"))?;
    if row.id != webhook_id {
        return Err(ApiError::not_found("webhook not found"));
    }
    Ok(row)
}

#[derive(Deserialize)]
pub struct CreateBody {
    pub consent_cleartext: bool,
    pub display_name: Option<String>,
}
#[derive(Serialize)]
struct SecretResponse {
    webhook: ChannelWebhook,
    token: String,
}

/// consent_cleartext acknowledges that integration content is stored in cleartext even in E2EE channels.
pub async fn create_or_reactivate_webhook(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
    Json(body): Json<CreateBody>,
) -> Result<Response, ApiError> {
    let channel = managed(&state, account.id, channel_id).await?;
    if channel.kind != ChannelType::Text {
        return Err(ApiError::bad_request("webhooks só em canais de texto"));
    }
    if !body.consent_cleartext {
        return Err(ApiError::bad_request(
            "confirmação explícita de conteúdo em claro necessária",
        ));
    }
    let display_name = normalize_display_name(body.display_name.as_deref())
        .map_err(ApiError::bad_request)?
        .unwrap_or_else(|| channel.name.clone());
    let token = new_token();
    let outcome = db::channel_webhook::create_or_reactivate(
        &state.pool,
        channel_id,
        account.id,
        &hash_token(&token),
        &display_name,
    )
    .await?;
    let (status, row) = match outcome {
        db::channel_webhook::CreateOutcome::Created(row) => (StatusCode::CREATED, row),
        db::channel_webhook::CreateOutcome::Reactivated(row) => (StatusCode::OK, row),
        db::channel_webhook::CreateOutcome::AlreadyActive => {
            return Err(ApiError::conflict_code(
                "webhook_already_active",
                "webhook já activo",
            ))
        }
    };
    let webhook = db::channel_webhook::public_view(&state.pool, &row).await?;
    Ok(no_store((status, Json(SecretResponse { webhook, token }))))
}

pub async fn get_webhook(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(channel_id): Path<Uuid>,
) -> Result<Json<Option<ChannelWebhook>>, ApiError> {
    managed(&state, account.id, channel_id).await?;
    let row = db::channel_webhook::find_by_channel(&state.pool, channel_id).await?;
    Ok(Json(match row {
        Some(row) => Some(db::channel_webhook::public_view(&state.pool, &row).await?),
        None => None,
    }))
}

#[derive(Deserialize)]
pub struct PatchBody {
    pub display_name: Option<String>,
}
pub async fn patch_webhook(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((channel_id, webhook_id)): Path<(Uuid, Uuid)>,
    Json(body): Json<PatchBody>,
) -> Result<Json<ChannelWebhook>, ApiError> {
    managed(&state, account.id, channel_id).await?;
    let row = matching(&state, channel_id, webhook_id).await?;
    let name = normalize_display_name(body.display_name.as_deref())
        .map_err(ApiError::bad_request)?
        .ok_or_else(|| ApiError::bad_request("display_name obrigatório"))?;
    db::channel_webhook::rename(&state.pool, channel_id, &name).await?;
    Ok(Json(
        db::channel_webhook::public_view(&state.pool, &row).await?,
    ))
}

pub async fn rotate_webhook_token(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((channel_id, webhook_id)): Path<(Uuid, Uuid)>,
) -> Result<Response, ApiError> {
    managed(&state, account.id, channel_id).await?;
    let row = matching(&state, channel_id, webhook_id).await?;
    if row.revoked_at.is_some() {
        return Err(ApiError::conflict("webhook revogado"));
    }
    let token = new_token();
    db::channel_webhook::rotate_token(&state.pool, channel_id, &hash_token(&token)).await?;
    let webhook = db::channel_webhook::public_view(&state.pool, &row).await?;
    Ok(no_store((
        StatusCode::OK,
        Json(SecretResponse { webhook, token }),
    )))
}

pub async fn put_webhook_avatar(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((channel_id, webhook_id)): Path<(Uuid, Uuid)>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Json<ChannelWebhook>, ApiError> {
    managed(&state, account.id, channel_id).await?;
    let row = matching(&state, channel_id, webhook_id).await?;
    avatars::validate_body(&body)?;
    let media_type = avatars::media_type_from_headers(&headers)?;
    let filename = Uuid::new_v4().to_string();
    avatars::write_file(&state.config.avatars_dir.join(&filename), &body).await?;
    // Keep prior files: historical messages refer to their immutable filename snapshot.
    db::account::set_avatar(
        &state.pool,
        row.account_id,
        Some(&filename),
        Some(&media_type),
    )
    .await?;
    Ok(Json(
        db::channel_webhook::public_view(&state.pool, &row).await?,
    ))
}

pub async fn delete_webhook(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path((channel_id, webhook_id)): Path<(Uuid, Uuid)>,
) -> Result<StatusCode, ApiError> {
    managed(&state, account.id, channel_id).await?;
    matching(&state, channel_id, webhook_id).await?;
    db::channel_webhook::revoke(&state.pool, channel_id).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Deserialize)]
pub struct PostBody {
    pub content: String,
}
pub async fn post_webhook_message(
    State(state): State<AppState>,
    ClientIp(ip): ClientIp,
    Path((webhook_id, token)): Path<(Uuid, String)>,
    Json(body): Json<PostBody>,
) -> Result<Response, ApiError> {
    let row = db::channel_webhook::find_by_id_active(&state.pool, webhook_id)
        .await?
        .ok_or_else(|| ApiError::not_found("webhook not found"))?;
    if hash_token(&token) != row.token_hash {
        return Err(ApiError::not_found("webhook not found"));
    }
    if !state.config.rate_limit_disabled && !state.rate_limiter.allow_webhook_post(webhook_id, ip) {
        let mut response = ApiError::too_many_requests().into_response();
        response.headers_mut().insert(
            header::RETRY_AFTER,
            HeaderValue::from_str(&WEBHOOK_POST_WINDOW_SECS.to_string()).unwrap(),
        );
        return Ok(response);
    }
    if body.content.trim().is_empty() || body.content.chars().count() > WEBHOOK_CONTENT_MAX_CHARS {
        return Err(ApiError::bad_request("content inválido ou demasiado longo"));
    }
    let channel = db::channel::find_by_id(&state.pool, row.channel_id)
        .await?
        .ok_or_else(|| ApiError::not_found("channel not found"))?;
    let sender = db::account::find_by_id(&state.pool, row.account_id)
        .await?
        .ok_or_else(|| ApiError::not_found("webhook not found"))?;
    let message: Message = db::message::create_webhook(
        &state.pool,
        Uuid::new_v4(),
        row.channel_id,
        row.account_id,
        &body.content,
        &sender.public_label(),
        sender.avatar_filename.as_deref(),
        sender.avatar_content_type.as_deref(),
        Utc::now(),
    )
    .await?;
    send_to_channel_viewers(&state, &channel, "message.new", &message).await;
    Ok((StatusCode::CREATED, Json(message)).into_response())
}

pub async fn get_webhook_message_avatar(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(message_id): Path<Uuid>,
) -> Result<Response, ApiError> {
    let message = db::message::find_by_id(&state.pool, message_id)
        .await?
        .ok_or_else(|| ApiError::not_found("message not found"))?;
    crate::api::authz::require_channel_view(&state.pool, account.id, message.channel_id).await?;
    let (filename, content_type) = db::message::webhook_avatar_snapshot(&state.pool, message_id)
        .await?
        .ok_or_else(|| ApiError::not_found("avatar not found"))?;
    avatars::image_response(&state.config.avatars_dir.join(filename), &content_type).await
}
