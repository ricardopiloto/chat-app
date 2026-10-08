use super::{apply_identity_replacement, register, session::current_session_id, session::hash_token, HandoffEvent};
use crate::{db, domain::session::Session, error::ApiError, rate_limit::ClientIp, AppState};
use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::{extract::State, http::StatusCode, Json};
use axum_extra::extract::cookie::CookieJar;
use base64::Engine;
use chrono::{DateTime, Duration, Utc};
use rand::RngCore;
use serde::Deserialize;
use sha2::{Digest, Sha256};
use sqlx::Connection;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct RedeemCodeBody {
    handle: String,
    code: String,
    password: String,
    identity_pubkey: String,
    identity_vault: serde_json::Value,
}

#[derive(Deserialize)]
pub struct ChangePasswordBody {
    current_password: String,
    new_password: String,
    identity_vault: serde_json::Value,
}

/// How the credential transaction treats existing sessions.
pub(crate) enum SessionPolicy {
    /// Reset: revoke every session and open a new one.
    ReplaceAll { ttl_secs: i64 },
    /// Password change: keep the calling session and revoke the rest.
    Keep(Uuid),
}

pub(crate) struct CredentialWrite {
    pub account_id: Uuid,
    pub password_hash: String,
    pub vault: Vec<u8>,
    /// When set, the account receives this public key and the identity-replacement consequences.
    pub new_pubkey: Option<Vec<u8>>,
    pub sessions: SessionPolicy,
    /// When set, the operator code is checked and consumed in this same transaction.
    pub operator_code_hash: Option<String>,
    /// When both are set, the write is refused if the account changed since the caller checked it.
    pub expected_password_hash: Option<String>,
    pub expected_pubkey: Option<Vec<u8>>,
    /// Deletes this unused recovery ticket in the same transaction. Missing ticket → 401.
    pub consume_ticket_id: Option<Uuid>,
}

pub(crate) struct CredentialDone {
    pub events: Vec<HandoffEvent>,
    pub revoked: Vec<Uuid>,
    pub token: Option<String>,
}

pub fn normalize_code(code: &str) -> Option<String> {
    let value: String = code
        .chars()
        .filter(|c| *c != '-' && !c.is_ascii_whitespace())
        .map(|c| c.to_ascii_uppercase())
        .collect();
    (value.len() == 26 && value.bytes().all(|c| b"0123456789ABCDEFGHJKMNPQRSTVWXYZ".contains(&c))).then_some(value)
}

pub fn hash_code(code: &str) -> Option<String> {
    normalize_code(code).map(|c| hex::encode(Sha256::digest(c.as_bytes())))
}

pub fn generate_code() -> String {
    const ALPHABET: &[u8; 32] = b"0123456789ABCDEFGHJKMNPQRSTVWXYZ";
    let mut bytes = [0u8; 16];
    rand::thread_rng().fill_bytes(&mut bytes);
    let mut bits = 0u32;
    let mut available = 0;
    let mut out = String::with_capacity(26);
    for byte in bytes {
        bits = (bits << 8) | u32::from(byte);
        available += 8;
        while available >= 5 {
            available -= 5;
            out.push(ALPHABET[((bits >> available) & 31) as usize] as char);
        }
    }
    if available > 0 {
        out.push(ALPHABET[((bits << (5 - available)) & 31) as usize] as char);
    }
    out
}

pub fn format_code(code: &str) -> String {
    code.as_bytes()
        .chunks(4)
        .map(|part| std::str::from_utf8(part).unwrap_or(""))
        .collect::<Vec<_>>()
        .join("-")
}

fn validate_new_password(password: &str) -> Result<(), ApiError> {
    if password.len() < 8 {
        return Err(ApiError::bad_request("password must be at least 8 characters"));
    }
    Ok(())
}

pub(crate) fn vault_matches(vault: &serde_json::Value, pubkey: &[u8]) -> bool {
    let Some(public_key) = vault.get("publicKey").and_then(|v| v.as_array()) else {
        return false;
    };
    let bytes: Option<Vec<u8>> = public_key
        .iter()
        .map(|v| v.as_u64().and_then(|n| u8::try_from(n).ok()))
        .collect();
    bytes.as_deref() == Some(pubkey)
}

fn fresh_session(account_id: Uuid, ttl_secs: i64) -> (Session, String) {
    let mut bytes = [0u8; 32];
    rand::thread_rng().fill_bytes(&mut bytes);
    let token = hex::encode(bytes);
    (
        Session {
            id: Uuid::new_v4(),
            account_id,
            token_hash: hash_token(&token),
            expires_at: Utc::now() + Duration::seconds(ttl_secs),
            revoked_at: None,
        },
        token,
    )
}

/// Writes password, vault, optional identity replacement, code consumption and session changes
/// in one `BEGIN IMMEDIATE` transaction. Events are returned only after commit.
pub(crate) async fn finish_credential_change(
    pool: &sqlx::SqlitePool,
    write: CredentialWrite,
) -> Result<CredentialDone, ApiError> {
    let mut conn = pool.acquire().await?;
    let mut tx = conn.begin_with("BEGIN IMMEDIATE").await?;
    let account_id = write.account_id.to_string();
    if let Some(ticket_id) = write.consume_ticket_id {
        let removed = sqlx::query(
            "DELETE FROM recovery_ticket WHERE id = ? AND account_id = ? AND used_at IS NULL AND expires_at > ? AND recovery_generation = (SELECT recovery_generation FROM account WHERE id = ?)",
        )
        .bind(ticket_id.to_string())
        .bind(&account_id)
        .bind(Utc::now().to_rfc3339())
        .bind(&account_id)
        .execute(&mut *tx)
        .await?;
        if removed.rows_affected() != 1 {
            return Err(ApiError::unauthorized());
        }
    }
    if let Some(code_hash) = &write.operator_code_hash {
        if !accept_operator_code(&mut tx, &account_id, code_hash).await? {
            tx.commit().await?;
            return Err(ApiError::unauthorized());
        }
    }
    if write.expected_password_hash.is_some() || write.expected_pubkey.is_some() {
        let latest: Option<(String, Vec<u8>)> =
            sqlx::query_as("SELECT password_hash, identity_pubkey FROM account WHERE id = ?")
                .bind(&account_id)
                .fetch_optional(&mut *tx)
                .await?;
        let Some((latest_hash, latest_pubkey)) = latest else {
            return Err(ApiError::unauthorized());
        };
        if write.expected_password_hash.as_ref().is_some_and(|hash| hash != &latest_hash)
            || write.expected_pubkey.as_ref().is_some_and(|key| key != &latest_pubkey)
        {
            return Err(ApiError::unauthorized());
        }
    }
    if let Some(pubkey) = &write.new_pubkey {
        let events = apply_identity_replacement(&mut tx, write.account_id, pubkey, &write.vault).await?;
        sqlx::query("UPDATE account SET password_hash = ? WHERE id = ?")
            .bind(&write.password_hash)
            .bind(&account_id)
        .execute(&mut *tx)
        .await?;
        let (revoked, token) = apply_sessions(&mut tx, write.account_id, &write.sessions).await?;
        tx.commit().await?;
        return Ok(CredentialDone { events, revoked, token });
    }
    sqlx::query("UPDATE account SET password_hash = ?, identity_vault = ? WHERE id = ?")
        .bind(&write.password_hash)
        .bind(&write.vault)
        .bind(&account_id)
        .execute(&mut *tx)
        .await?;
    let (revoked, token) = apply_sessions(&mut tx, write.account_id, &write.sessions).await?;
    tx.commit().await?;
    Ok(CredentialDone {
        events: Vec::new(),
        revoked,
        token,
    })
}

/// Deletes a valid operator code (still uncommitted) or records a failed attempt.
/// `Ok(false)` means the caller must commit the counter and answer 401.
/// A missing row is also `Ok(false)` but leaves nothing to commit; committing is harmless.
async fn accept_operator_code(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    account_id: &str,
    code_hash: &str,
) -> Result<bool, ApiError> {
    let record: Option<(String, String, i64)> = sqlx::query_as(
        "SELECT code_hash, expires_at, attempts FROM password_reset WHERE account_id = ? AND used_at IS NULL",
    )
    .bind(account_id)
    .fetch_optional(&mut **tx)
    .await?;
    let Some((expected_hash, expires_at, attempts)) = record else {
        return Ok(false);
    };
    let fresh = expected_hash == code_hash
        && attempts < 5
        && DateTime::parse_from_rfc3339(&expires_at).is_ok_and(|d| d.with_timezone(&Utc) > Utc::now());
    if fresh {
        sqlx::query("DELETE FROM password_reset WHERE account_id = ?")
            .bind(account_id)
            .execute(&mut **tx)
            .await?;
        return Ok(true);
    }
    if attempts >= 4 {
        sqlx::query("DELETE FROM password_reset WHERE account_id = ?")
            .bind(account_id)
            .execute(&mut **tx)
            .await?;
    } else {
        sqlx::query("UPDATE password_reset SET attempts = attempts + 1 WHERE account_id = ?")
            .bind(account_id)
            .execute(&mut **tx)
            .await?;
    }
    Ok(false)
}

async fn apply_sessions(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    account_id: Uuid,
    policy: &SessionPolicy,
) -> Result<(Vec<Uuid>, Option<String>), ApiError> {
    let except = match policy {
        SessionPolicy::Keep(id) => Some(*id),
        SessionPolicy::ReplaceAll { .. } => None,
    };
    let now = Utc::now().to_rfc3339();
    let rows: Vec<(String,)> = sqlx::query_as(
        "UPDATE session SET revoked_at = ? WHERE account_id = ? AND revoked_at IS NULL AND (? IS NULL OR id != ?) RETURNING id",
    )
    .bind(&now)
    .bind(account_id.to_string())
    .bind(except.map(|id| id.to_string()))
    .bind(except.map(|id| id.to_string()))
    .fetch_all(&mut **tx)
    .await?;
    let revoked = rows
        .into_iter()
        .map(|(id,)| Uuid::parse_str(&id).map_err(|e| ApiError::internal(e.to_string())))
        .collect::<Result<Vec<_>, _>>()?;
    let token = if let SessionPolicy::ReplaceAll { ttl_secs } = policy {
        let (session, token) = fresh_session(account_id, *ttl_secs);
        sqlx::query(
            "INSERT INTO session (id, account_id, token_hash, expires_at, revoked_at, created_at) VALUES (?, ?, ?, ?, NULL, ?)",
        )
        .bind(session.id.to_string())
        .bind(session.account_id.to_string())
        .bind(&session.token_hash)
        .bind(session.expires_at.to_rfc3339())
        .bind(Utc::now().to_rfc3339())
        .execute(&mut **tx)
        .await?;
        Some(token)
    } else {
        None
    };
    Ok((revoked, token))
}

fn publish(state: &AppState, account_id: Uuid, pubkey: &[u8], done: &CredentialDone) {
    state.ws.close_sessions(account_id, &done.revoked);
    if done.events.is_empty() {
        return;
    }
    let encoded = base64::engine::general_purpose::STANDARD.encode(pubkey);
    for event in &done.events {
        state.ws.send_to_accounts(
            &event.synced_account_ids,
            "key_handoff.requested",
            event.server_id,
            &serde_json::json!({ "account_id": account_id, "identity_pubkey": encoded }),
        );
    }
}

pub async fn redeem_code(
    State(state): State<AppState>,
    ClientIp(ip): ClientIp,
    jar: CookieJar,
    Json(body): Json<RedeemCodeBody>,
) -> Result<(CookieJar, Json<crate::domain::account::AuthAccount>), ApiError> {
    validate_new_password(&body.password)?;
    if body.handle.trim().is_empty() || body.handle.len() > 256 || body.code.len() > 128 {
        return Err(ApiError::bad_request("invalid input"));
    }
    let pubkey = register::decode_pubkey(&body.identity_pubkey)?;
    if !vault_matches(&body.identity_vault, &pubkey) {
        return Err(ApiError::bad_request("identity_vault publicKey mismatch"));
    }
    let vault = register::encode_identity_vault(Some(&body.identity_vault))?
        .ok_or_else(|| ApiError::bad_request("identity_vault required"))?;
    if !state.config.rate_limit_disabled && !state.rate_limiter.allow_auth(ip) {
        return Err(ApiError::too_many_requests());
    }
    let mut attempt = if state.config.rate_limit_disabled {
        None
    } else {
        Some(
            state
                .rate_limiter
                .start_recovery_attempt(&body.handle)
                .ok_or_else(ApiError::too_many_requests)?,
        )
    };
    let outcome = redeem_authorized(&state, &body, &pubkey, &vault).await;
    let failed_auth = outcome.as_ref().err().is_some_and(|err| err.status == StatusCode::UNAUTHORIZED);
    if !failed_auth {
        if let Some(slot) = attempt.as_mut() {
            slot.success();
        }
    }
    let (token, account_id) = outcome?;
    let account = db::account::find_by_id(&state.pool, account_id)
        .await?
        .ok_or_else(ApiError::unauthorized)?;
    let jar = register::with_session_cookie(jar, token, state.config.cookie_secure);
    Ok((jar, Json(account.auth_view())))
}

async fn redeem_authorized(
    state: &AppState,
    body: &RedeemCodeBody,
    pubkey: &[u8],
    vault: &[u8],
) -> Result<(String, Uuid), ApiError> {
    let Some(account) = db::account::find_by_handle(&state.pool, body.handle.trim()).await? else {
        return Err(ApiError::unauthorized());
    };
    let done = finish_credential_change(
        &state.pool,
        CredentialWrite {
            account_id: account.id,
            password_hash: register::hash_password(&body.password)?,
            vault: vault.to_vec(),
            new_pubkey: Some(pubkey.to_vec()),
            sessions: SessionPolicy::ReplaceAll {
                ttl_secs: state.config.session_ttl_secs,
            },
            operator_code_hash: Some(hash_code(&body.code).unwrap_or_default()),
            expected_password_hash: None,
            expected_pubkey: None,
            consume_ticket_id: None,
        },
    )
    .await?;
    let token = done.token.clone().ok_or_else(|| ApiError::internal("session missing"))?;
    publish(state, account.id, pubkey, &done);
    Ok((token, account.id))
}

pub async fn change_password(
    State(state): State<AppState>,
    super::session::AuthUser(account): super::session::AuthUser,
    jar: CookieJar,
    Json(body): Json<ChangePasswordBody>,
) -> Result<StatusCode, ApiError> {
    validate_new_password(&body.new_password)?;
    if !vault_matches(&body.identity_vault, &account.identity_pubkey) {
        return Err(ApiError::bad_request("identity_vault publicKey mismatch"));
    }
    let vault = register::encode_identity_vault(Some(&body.identity_vault))?
        .ok_or_else(|| ApiError::bad_request("identity_vault required"))?;
    let parsed = PasswordHash::new(&account.password_hash).map_err(|e| ApiError::internal(e.to_string()))?;
    Argon2::default()
        .verify_password(body.current_password.as_bytes(), &parsed)
        .map_err(|_| ApiError::unauthorized())?;
    let current = current_session_id(&state, &jar).await?.ok_or_else(ApiError::unauthorized)?;
    let pubkey = account.identity_pubkey.clone();
    let done = finish_credential_change(
        &state.pool,
        CredentialWrite {
            account_id: account.id,
            password_hash: register::hash_password(&body.new_password)?,
            vault,
            new_pubkey: None,
            sessions: SessionPolicy::Keep(current),
            operator_code_hash: None,
            expected_password_hash: Some(account.password_hash),
            expected_pubkey: Some(pubkey.clone()),
            consume_ticket_id: None,
        },
    )
    .await?;
    publish(&state, account.id, &pubkey, &done);
    Ok(StatusCode::NO_CONTENT)
}
