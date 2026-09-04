use crate::api::auth::session::{hash_token, SESSION_COOKIE};
use crate::db;
use crate::domain::account::AccountRecord;
use crate::domain::membership::{KeyHandoffStatus, Membership};
use crate::domain::session::Session;
use crate::error::ApiError;
use crate::AppState;
use argon2::{
    password_hash::{rand_core::OsRng, SaltString},
    Argon2, PasswordHasher,
};
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use base64::Engine;
use chrono::{Duration, Utc};
use rand::RngCore;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct RegisterBody {
    pub handle: String,
    pub password: String,
    pub identity_pubkey: String,
    pub identity_vault: Option<serde_json::Value>,
    pub invite_code: Option<String>,
}

pub fn encode_identity_vault(value: Option<&serde_json::Value>) -> Result<Option<Vec<u8>>, ApiError> {
    let Some(value) = value else {
        return Ok(None);
    };
    if value.is_null() {
        return Ok(None);
    }
    let bytes = serde_json::to_vec(value).map_err(|e| ApiError::bad_request(e.to_string()))?;
    if bytes.len() > 16 * 1024 {
        return Err(ApiError::bad_request("identity_vault too large"));
    }
    Ok(Some(bytes))
}

pub fn hash_password(password: &str) -> Result<String, ApiError> {
    let salt = SaltString::generate(&mut OsRng);
    Argon2::default()
        .hash_password(password.as_bytes(), &salt)
        .map(|h| h.to_string())
        .map_err(|e| ApiError::internal(e.to_string()))
}

pub async fn persist_session(
    pool: &sqlx::SqlitePool,
    account_id: Uuid,
    ttl_secs: i64,
) -> Result<String, ApiError> {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    let token = hex::encode(bytes);
    let session = Session {
        id: Uuid::new_v4(),
        account_id,
        token_hash: hash_token(&token),
        expires_at: Utc::now() + Duration::seconds(ttl_secs),
        revoked_at: None,
    };
    db::session::create(pool, &session).await?;
    Ok(token)
}

pub fn with_session_cookie(jar: CookieJar, token: String, secure: bool) -> CookieJar {
    jar.add(
        Cookie::build((SESSION_COOKIE, token))
            .path("/")
            .http_only(true)
            .same_site(SameSite::Strict)
            .secure(secure)
            .build(),
    )
}

pub fn decode_pubkey(value: &str) -> Result<Vec<u8>, ApiError> {
    let bytes = base64::engine::general_purpose::STANDARD
        .decode(value.trim())
        .map_err(|_| ApiError::bad_request("identity_pubkey must be base64"))?;
    if bytes.len() != 32 {
        return Err(ApiError::bad_request("identity_pubkey must be 32 bytes"));
    }
    Ok(bytes)
}

pub async fn register(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(body): Json<RegisterBody>,
) -> Result<impl IntoResponse, ApiError> {
    let (account, jar) = register_inner(&state, jar, body).await?;
    Ok((StatusCode::CREATED, jar, Json(account.auth_view())))
}

pub async fn register_inner(
    state: &AppState,
    jar: CookieJar,
    body: RegisterBody,
) -> Result<(AccountRecord, CookieJar), ApiError> {
    let handle = body.handle.trim().to_string();
    if handle.is_empty() {
        return Err(ApiError::bad_request("handle required"));
    }
    if body.password.len() < 8 {
        return Err(ApiError::bad_request("password must be at least 8 characters"));
    }
    let pubkey = decode_pubkey(&body.identity_pubkey)?;
    let count = db::account::count(&state.pool).await?;
    let mut invite = None;
    if count == 0 {
        if body.invite_code.is_some() {
            // first account ignores invite; still allowed
        }
    } else {
        let code = body
            .invite_code
            .as_deref()
            .filter(|s| !s.is_empty())
            .ok_or_else(|| {
                ApiError::forbidden("invite required after the first account exists")
            })?;
        let record = db::invite::find_by_code(&state.pool, code)
            .await?
            .ok_or_else(|| ApiError::forbidden("invite required after the first account exists"))?;
        if !record.is_usable(Utc::now()) {
            return Err(ApiError::forbidden("invite required after the first account exists"));
        }
        invite = Some(record);
    }

    if db::account::find_by_handle(&state.pool, &handle)
        .await?
        .is_some()
    {
        return Err(ApiError::conflict("handle already exists"));
    }

    let record = AccountRecord {
        id: Uuid::new_v4(),
        handle,
        password_hash: hash_password(&body.password)?,
        identity_pubkey: pubkey,
        identity_vault: encode_identity_vault(body.identity_vault.as_ref())?,
        is_initial_operator: count == 0,
        created_at: Utc::now(),
    };
    db::account::create(&state.pool, &record).await?;

    if let Some(inv) = invite {
        if db::membership::exists(&state.pool, record.id, inv.server_id).await? {
            // already member — ignore
        } else {
            let membership = Membership {
                account_id: record.id,
                server_id: inv.server_id,
                joined_at: Utc::now(),
                joined_via_invite_id: Some(inv.id),
                key_handoff_status: KeyHandoffStatus::Pending,
            };
            db::membership::create(&state.pool, &membership).await?;
            emit_invite_consumed(state, &inv, record.id).await;
        }
    }

    let token = persist_session(&state.pool, record.id, state.config.session_ttl_secs).await?;
    let jar = with_session_cookie(jar, token, state.config.cookie_secure);
    Ok((record, jar))
}

pub async fn emit_invite_consumed(
    state: &AppState,
    invite: &crate::domain::invite::InviteRecord,
    new_member: Uuid,
) {
    state
        .ws
        .send_to_server_members(
            &state.pool,
            invite.server_id,
            "invite.consumed",
            &serde_json::json!({
                "invite_code": invite.code,
                "new_member_account_id": new_member,
            }),
        )
        .await;

    if let Ok(Some(account)) = db::account::find_by_id(&state.pool, new_member).await {
        use base64::Engine;
        let pubkey = base64::engine::general_purpose::STANDARD.encode(&account.identity_pubkey);
        if let Ok(synced) = db::membership::list_synced_account_ids(&state.pool, invite.server_id).await
        {
            state.ws.send_to_accounts(
                &synced,
                "key_handoff.requested",
                invite.server_id,
                &serde_json::json!({
                    "account_id": new_member,
                    "identity_pubkey": pubkey,
                }),
            );
        }
    }
}
