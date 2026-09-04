use crate::api::auth::register::{emit_invite_consumed, register_inner, RegisterBody};
use crate::api::auth::session::{AuthUser, OptionalAuth};
use crate::api::channels::require_member;
use crate::db;
use crate::domain::invite::InviteRecord;
use crate::domain::membership::{KeyHandoffStatus, Membership};
use crate::domain::permissions;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use axum_extra::extract::cookie::CookieJar;
use chrono::{Duration, Utc};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateInviteBody {
    /// `null` = permanente; omitido = TTL padrão da instância; número = segundos.
    #[serde(default)]
    pub expires_in_seconds: MaybeExpires,
    pub include_history: Option<bool>,
}

#[derive(Debug, Default)]
pub enum MaybeExpires {
    #[default]
    Missing,
    Value(Option<i64>),
}

impl<'de> Deserialize<'de> for MaybeExpires {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        Ok(MaybeExpires::Value(Option::<i64>::deserialize(deserializer)?))
    }
}

#[derive(Debug, Serialize)]
pub struct InvitePreview {
    pub server_name: String,
    pub include_history: bool,
    pub requires_account_creation: bool,
}

#[derive(Debug, Deserialize)]
pub struct AcceptBody {
    pub handle: Option<String>,
    pub password: Option<String>,
    pub identity_pubkey: Option<String>,
    pub identity_vault: Option<serde_json::Value>,
}

pub async fn create_invite(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
    Json(body): Json<CreateInviteBody>,
) -> Result<impl IntoResponse, ApiError> {
    let server = db::server::find_by_id(&state.pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    require_member(&state.pool, account.id, server_id).await?;
    if !permissions::is_channel_admin(server.owner_account_id, account.id) {
        return Err(ApiError::forbidden("only the owner can create invites"));
    }
    let expires_at = match body.expires_in_seconds {
        MaybeExpires::Missing => {
            Some(Utc::now() + Duration::seconds(state.config.default_invite_ttl_secs))
        }
        MaybeExpires::Value(None) => None,
        MaybeExpires::Value(Some(secs)) if secs < 0 => {
            return Err(ApiError::bad_request("expires_in_seconds must be >= 0"));
        }
        MaybeExpires::Value(Some(secs)) => Some(Utc::now() + Duration::seconds(secs)),
    };
    let include_history = body.include_history.unwrap_or(false);
    let mut bytes = [0u8; 18];
    rand::thread_rng().fill_bytes(&mut bytes);
    let code = hex::encode(bytes);
    let invite = InviteRecord {
        id: Uuid::new_v4(),
        code,
        server_id,
        created_by_account_id: account.id,
        expires_at,
        include_history,
        revoked_at: None,
    };
    db::invite::create(&state.pool, &invite).await?;
    Ok((StatusCode::CREATED, Json(invite.public())))
}

pub async fn list_invites(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
) -> Result<impl IntoResponse, ApiError> {
    let server = db::server::find_by_id(&state.pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    require_member(&state.pool, account.id, server_id).await?;
    if !permissions::is_channel_admin(server.owner_account_id, account.id) {
        return Err(ApiError::forbidden("only the owner can list invites"));
    }
    let invites: Vec<_> = db::invite::list_by_server(&state.pool, server_id)
        .await?
        .into_iter()
        .map(|i| i.public())
        .collect();
    Ok(Json(invites))
}

pub async fn preview_invite(
    State(state): State<AppState>,
    OptionalAuth(user): OptionalAuth,
    Path(code): Path<String>,
) -> Result<Json<InvitePreview>, ApiError> {
    let invite = usable_invite(&state, &code)
        .await
        .map_err(|_| ApiError::not_found("invite not found"))?;
    let server = db::server::find_by_id(&state.pool, invite.server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("invite not found"))?;
    Ok(Json(InvitePreview {
        server_name: server.name,
        include_history: invite.include_history,
        requires_account_creation: user.is_none(),
    }))
}

pub async fn revoke_invite(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(code): Path<String>,
) -> Result<StatusCode, ApiError> {
    let invite = db::invite::find_by_code(&state.pool, &code)
        .await?
        .ok_or_else(|| ApiError::not_found("invite not found"))?;
    let server = db::server::find_by_id(&state.pool, invite.server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("invite not found"))?;
    if !permissions::is_channel_admin(server.owner_account_id, account.id) {
        return Err(ApiError::forbidden("only the owner can revoke invites"));
    }
    db::invite::revoke(&state.pool, &code).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn accept_invite(
    State(state): State<AppState>,
    OptionalAuth(user): OptionalAuth,
    jar: CookieJar,
    Path(code): Path<String>,
    body: Option<Json<AcceptBody>>,
) -> Result<impl IntoResponse, ApiError> {
    let invite = usable_invite(&state, &code)
        .await
        .map_err(|_| ApiError::gone("invite expired, revoked, or invalid"))?;

    let (account_id, _jar) = if let Some(account) = user {
        (account.id, jar)
    } else {
        let body = body
            .map(|j| j.0)
            .ok_or_else(|| ApiError::bad_request("registration body required"))?;
        let handle = body
            .handle
            .ok_or_else(|| ApiError::bad_request("handle required"))?;
        let password = body
            .password
            .ok_or_else(|| ApiError::bad_request("password required"))?;
        let identity_pubkey = body
            .identity_pubkey
            .ok_or_else(|| ApiError::bad_request("identity_pubkey required"))?;
        let (record, jar) = register_inner(
            &state,
            jar,
            RegisterBody {
                handle,
                password,
                identity_pubkey,
                identity_vault: body.identity_vault,
                invite_code: Some(code.clone()),
            },
        )
        .await?;
        return Ok((
            jar,
            Json(
                db::membership::find(&state.pool, record.id, invite.server_id)
                    .await?
                    .ok_or_else(|| ApiError::internal("membership missing after register"))?,
            ),
        )
            .into_response());
    };

    if db::membership::exists(&state.pool, account_id, invite.server_id).await? {
        let membership = db::membership::find(&state.pool, account_id, invite.server_id)
            .await?
            .expect("exists");
        return Ok(Json(membership).into_response());
    }
    let membership = Membership {
        account_id,
        server_id: invite.server_id,
        joined_at: Utc::now(),
        joined_via_invite_id: Some(invite.id),
        key_handoff_status: KeyHandoffStatus::Pending,
    };
    db::membership::create(&state.pool, &membership).await?;
    emit_invite_consumed(&state, &invite, account_id).await;
    Ok(Json(membership).into_response())
}

async fn usable_invite(state: &AppState, code: &str) -> Result<InviteRecord, ApiError> {
    let invite = db::invite::find_by_code(&state.pool, code)
        .await?
        .ok_or_else(|| ApiError::gone("invite expired, revoked, or invalid"))?;
    if !invite.is_usable(Utc::now()) {
        return Err(ApiError::gone("invite expired, revoked, or invalid"));
    }
    Ok(invite)
}
