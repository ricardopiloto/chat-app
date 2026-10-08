use super::recovery::{finish_credential_change, CredentialWrite, SessionPolicy};
use super::register::{self, encode_identity_vault};
use super::session::AuthUser;
use crate::{db, error::ApiError, rate_limit::ClientIp, AppState};
use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::extract::State;
use axum::http::StatusCode;
use axum::Json;
use axum_extra::extract::cookie::CookieJar;
use base64::Engine;
use chrono::{Duration, Utc};
use ed25519_dalek::{Signature, Verifier, VerifyingKey};
use rand::RngCore;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use sqlx::Connection;
use uuid::Uuid;

const TTL_SECS: i64 = 300;

#[derive(Deserialize)]
pub struct ChallengeBody {
    handle: String,
}

#[derive(Deserialize)]
pub struct StartBody {
    handle: String,
    challenge_id: Uuid,
    nonce: String,
    signature: String,
}

#[derive(Deserialize)]
pub struct RedeemKeyBody {
    handle: String,
    ticket: String,
    signature: String,
    password: String,
    identity_vault: serde_json::Value,
}

#[derive(Deserialize)]
pub struct PutRecoveryBody {
    current_password: String,
    recovery_vault: serde_json::Value,
    recovery_verifier_pubkey: String,
}

fn b64_decode(value: &str) -> Result<Vec<u8>, ApiError> {
    base64::engine::general_purpose::STANDARD
        .decode(value.trim())
        .map_err(|_| ApiError::unauthorized())
}

pub fn recovery_sign_message(operation: &str, handle: &str, left: &[u8], right: &[u8]) -> Vec<u8> {
    let handle = handle.trim().to_lowercase();
    let mut out = vec![1u8];
    for part in [operation.as_bytes(), handle.as_bytes(), left, right] {
        let len = part.len();
        out.push((len >> 8) as u8);
        out.push((len & 0xff) as u8);
        out.extend_from_slice(part);
    }
    out
}

fn signature_ok(public_key: &[u8], message: &[u8], signature: &[u8]) -> bool {
    let Ok(key_bytes) = <[u8; 32]>::try_from(public_key) else {
        return false;
    };
    let Ok(key) = VerifyingKey::from_bytes(&key_bytes) else {
        return false;
    };
    let Ok(signature) = Signature::from_slice(signature) else {
        return false;
    };
    key.verify(message, &signature).is_ok()
}

pub fn canonical_vault_json(value: &serde_json::Value) -> Result<String, ApiError> {
    let v = value.get("v").and_then(|n| n.as_u64()).ok_or_else(|| ApiError::bad_request("identity_vault"))?;
    let public_key = compact(value.get("publicKey"))?;
    let iv = compact(value.get("iv"))?;
    let wrapped = compact(value.get("wrapped"))?;
    let salt = value.get("salt").map(|part| compact(Some(part))).transpose()?;
    // Field order matches JSON.stringify on the client. serde_json's map sorts keys, so this is built by hand.
    Ok(match salt {
        Some(salt) => format!(r#"{{"v":{v},"publicKey":{public_key},"salt":{salt},"iv":{iv},"wrapped":{wrapped}}}"#),
        None => format!(r#"{{"v":{v},"publicKey":{public_key},"iv":{iv},"wrapped":{wrapped}}}"#),
    })
}

fn compact(value: Option<&serde_json::Value>) -> Result<String, ApiError> {
    let value = value.ok_or_else(|| ApiError::bad_request("identity_vault"))?;
    serde_json::to_string(value).map_err(|e| ApiError::bad_request(e.to_string()))
}

fn payload_hash(password: &str, vault_json: &str) -> [u8; 32] {
    let mut hasher = Sha256::new();
    hasher.update(password.as_bytes());
    hasher.update([0u8]);
    hasher.update(vault_json.as_bytes());
    hasher.finalize().into()
}

async fn failure_slot<'a>(state: &'a AppState, ip: Option<std::net::IpAddr>, handle: &str) -> Result<Option<crate::rate_limit::RecoveryAttempt<'a>>, ApiError> {
    if state.config.rate_limit_disabled {
        return Ok(None);
    }
    if !state.rate_limiter.allow_auth(ip) {
        return Err(ApiError::too_many_requests());
    }
    state
        .rate_limiter
        .start_recovery_attempt(handle)
        .map(Some)
        .ok_or_else(ApiError::too_many_requests)
}

pub async fn challenge(
    State(state): State<AppState>,
    ClientIp(ip): ClientIp,
    Json(body): Json<ChallengeBody>,
) -> Result<Json<serde_json::Value>, ApiError> {
    if body.handle.trim().is_empty() || body.handle.len() > 256 {
        return Err(ApiError::bad_request("invalid input"));
    }
    let mut slot = failure_slot(&state, ip, &body.handle).await?;
    let mut nonce = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut nonce);
    let id = Uuid::new_v4();
    let account = db::account::find_by_handle(&state.pool, body.handle.trim()).await?;
    let (account_id, generation) = if let Some(account) = account {
        let (generation,): (i64,) = sqlx::query_as("SELECT recovery_generation FROM account WHERE id = ?")
            .bind(account.id.to_string())
            .fetch_one(&state.pool)
            .await?;
        (Some(account.id.to_string()), generation)
    } else {
        (None, 0)
    };
    sqlx::query(
        "INSERT INTO recovery_challenge (id, account_id, recovery_generation, nonce_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(id.to_string())
    .bind(account_id)
    .bind(generation)
    .bind(hex::encode(Sha256::digest(nonce)))
    .bind((Utc::now() + Duration::seconds(TTL_SECS)).to_rfc3339())
    .bind(Utc::now().to_rfc3339())
    .execute(&state.pool)
    .await?;
    if let Some(slot) = slot.as_mut() {
        slot.success();
    }
    Ok(Json(serde_json::json!({
        "challenge_id": id,
        "nonce": base64::engine::general_purpose::STANDARD.encode(nonce),
    })))
}

pub async fn start(
    State(state): State<AppState>,
    ClientIp(ip): ClientIp,
    Json(body): Json<StartBody>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let mut slot = failure_slot(&state, ip, &body.handle).await?;
    let nonce = b64_decode(&body.nonce).unwrap_or_default();
    let signature = b64_decode(&body.signature).unwrap_or_default();
    let mut conn = state.pool.acquire().await?;
    let mut tx = conn.begin_with("BEGIN IMMEDIATE").await?;
    let row: Option<(Option<String>, i64, String, String)> = sqlx::query_as(
        "SELECT account_id, recovery_generation, nonce_hash, expires_at FROM recovery_challenge WHERE id = ? AND used_at IS NULL",
    )
    .bind(body.challenge_id.to_string())
    .fetch_optional(&mut *tx)
    .await?;
    sqlx::query("DELETE FROM recovery_challenge WHERE id = ?")
        .bind(body.challenge_id.to_string())
        .execute(&mut *tx)
        .await?;
    let Some((Some(account_id), generation, nonce_hash, expires_at)) = row else {
        tx.commit().await?;
        return Err(ApiError::unauthorized());
    };
    let fresh = hex::encode(Sha256::digest(&nonce)) == nonce_hash
        && chrono::DateTime::parse_from_rfc3339(&expires_at).is_ok_and(|d| d.with_timezone(&Utc) > Utc::now());
    let verifier: Option<(Vec<u8>, Vec<u8>, i64)> = sqlx::query_as(
        "SELECT recovery_verifier_pubkey, recovery_vault, recovery_generation FROM account WHERE id = ? AND recovery_verifier_pubkey IS NOT NULL AND recovery_vault IS NOT NULL",
    )
    .bind(&account_id)
    .fetch_optional(&mut *tx)
    .await?;
    let Some((public_key, vault, current_generation)) = verifier else {
        tx.commit().await?;
        return Err(ApiError::unauthorized());
    };
    let message = recovery_sign_message("start", &body.handle, body.challenge_id.as_bytes(), &nonce);
    if !fresh || current_generation != generation || !signature_ok(&public_key, &message, &signature) {
        tx.commit().await?;
        return Err(ApiError::unauthorized());
    }
    let mut ticket = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut ticket);
    let ticket_id = Uuid::new_v4();
    sqlx::query(
        "INSERT INTO recovery_ticket (id, account_id, recovery_generation, ticket_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    )
    .bind(ticket_id.to_string())
    .bind(&account_id)
    .bind(current_generation)
    .bind(hex::encode(Sha256::digest(ticket)))
    .bind((Utc::now() + Duration::seconds(TTL_SECS)).to_rfc3339())
    .bind(Utc::now().to_rfc3339())
    .execute(&mut *tx)
    .await?;
    tx.commit().await?;
    if let Some(slot) = slot.as_mut() {
        slot.success();
    }
    Ok(Json(serde_json::json!({
        "recovery_vault": serde_json::from_slice::<serde_json::Value>(&vault).unwrap_or(serde_json::Value::Null),
        "ticket": base64::engine::general_purpose::STANDARD.encode(ticket),
    })))
}

pub async fn redeem(
    State(state): State<AppState>,
    ClientIp(ip): ClientIp,
    jar: CookieJar,
    Json(body): Json<RedeemKeyBody>,
) -> Result<(CookieJar, Json<crate::domain::account::AuthAccount>), ApiError> {
    if body.password.len() < 8 {
        return Err(ApiError::bad_request("password must be at least 8 characters"));
    }
    let mut slot = failure_slot(&state, ip, &body.handle).await?;
    let outcome = redeem_authorized(&state, &body).await;
    let failed_auth = outcome.as_ref().err().is_some_and(|err| err.status == StatusCode::UNAUTHORIZED);
    if !failed_auth {
        if let Some(slot) = slot.as_mut() {
            slot.success();
        }
    }
    let (token, account_id, revoked) = outcome?;
    state.ws.close_sessions(account_id, &revoked);
    let updated = db::account::find_by_id(&state.pool, account_id).await?.ok_or_else(ApiError::unauthorized)?;
    let jar = register::with_session_cookie(jar, token, state.config.cookie_secure);
    Ok((jar, Json(updated.auth_view())))
}

async fn redeem_authorized(
    state: &AppState,
    body: &RedeemKeyBody,
) -> Result<(String, Uuid, Vec<Uuid>), ApiError> {
    let Some(account) = db::account::find_by_handle(&state.pool, body.handle.trim()).await? else {
        return Err(ApiError::unauthorized());
    };
    let ticket = b64_decode(&body.ticket).unwrap_or_default();
    let signature = b64_decode(&body.signature).unwrap_or_default();
    let Ok(vault_json) = canonical_vault_json(&body.identity_vault) else {
        return Err(ApiError::unauthorized());
    };
    let hash = payload_hash(&body.password, &vault_json);
    let (public_key,): (Vec<u8>,) = sqlx::query_as(
        "SELECT recovery_verifier_pubkey FROM account WHERE id = ? AND recovery_verifier_pubkey IS NOT NULL",
    )
    .bind(account.id.to_string())
    .fetch_optional(&state.pool)
    .await?
    .ok_or_else(ApiError::unauthorized)?;
    let ticket_id: Option<(String,)> = sqlx::query_as(
        "SELECT id FROM recovery_ticket WHERE account_id = ? AND ticket_hash = ? AND used_at IS NULL",
    )
    .bind(account.id.to_string())
    .bind(hex::encode(Sha256::digest(&ticket)))
    .fetch_optional(&state.pool)
    .await?;
    let Some((ticket_id,)) = ticket_id else {
        return Err(ApiError::unauthorized());
    };
    let ticket_uuid = Uuid::parse_str(&ticket_id).map_err(|e| ApiError::internal(e.to_string()))?;
    let message = recovery_sign_message("redeem", &body.handle, &ticket, &hash);
    if !signature_ok(&public_key, &message, &signature) {
        return Err(ApiError::unauthorized());
    }
    if !super::recovery::vault_matches(&body.identity_vault, &account.identity_pubkey) {
        return Err(ApiError::bad_request("identity_vault publicKey mismatch"));
    }
    let vault = encode_identity_vault(Some(&body.identity_vault))?.ok_or_else(|| ApiError::bad_request("identity_vault required"))?;
    let done = finish_credential_change(
        &state.pool,
        CredentialWrite {
            account_id: account.id,
            password_hash: register::hash_password(&body.password)?,
            vault,
            new_pubkey: None,
            sessions: SessionPolicy::ReplaceAll { ttl_secs: state.config.session_ttl_secs },
            operator_code_hash: None,
            expected_password_hash: None,
            expected_pubkey: Some(account.identity_pubkey.clone()),
            consume_ticket_id: Some(ticket_uuid),
        },
    )
    .await?;
    let token = done.token.ok_or_else(|| ApiError::internal("session missing"))?;
    Ok((token, account.id, done.revoked))
}

pub async fn put_recovery_key(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Json(body): Json<PutRecoveryBody>,
) -> Result<Json<crate::domain::account::AuthAccount>, ApiError> {
    let parsed = PasswordHash::new(&account.password_hash).map_err(|e| ApiError::internal(e.to_string()))?;
    Argon2::default()
        .verify_password(body.current_password.as_bytes(), &parsed)
        .map_err(|_| ApiError::unauthorized())?;
    let mut conn = state.pool.acquire().await?;
    let mut tx = conn.begin_with("BEGIN IMMEDIATE").await?;
    register::store_recovery(&mut tx, account.id, Some(&body.recovery_vault), Some(&body.recovery_verifier_pubkey)).await?;
    sqlx::query("DELETE FROM recovery_challenge WHERE account_id = ?")
        .bind(account.id.to_string())
        .execute(&mut *tx)
        .await?;
    sqlx::query("DELETE FROM recovery_ticket WHERE account_id = ?")
        .bind(account.id.to_string())
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    let updated = db::account::find_by_id(&state.pool, account.id).await?.ok_or_else(ApiError::unauthorized)?;
    Ok(Json(updated.auth_view()))
}
