use crate::api::auth::session::{current_session_id, AuthUser, OptionalAuth, SESSION_COOKIE};
use crate::api::avatars;
use crate::db;
use crate::domain::avatar::MAX_AVATAR_BYTES;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{DefaultBodyLimit, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::IntoResponse;
use axum::routing::{get, patch, post, put};
use axum::Json;
use axum::Router;
use axum_extra::extract::cookie::{Cookie, CookieJar};
use base64::Engine;
use serde::Deserialize;
use sqlx::SqliteConnection;
use uuid::Uuid;

pub mod login;
pub mod recovery;
pub mod recovery_key;
pub mod register;
pub mod session;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/auth/register", post(register::register))
        .route("/auth/login", post(login::login))
        .route("/auth/logout", post(logout))
        .route("/auth/me", get(me))
        .route(
            "/auth/avatar",
            put(avatars::put_own_avatar)
                .delete(avatars::delete_own_avatar)
                .layer(DefaultBodyLimit::max(MAX_AVATAR_BYTES + 64 * 1024)),
        )
        .route("/auth/identity-vault", put(put_identity_vault))
        .route("/auth/identity", put(put_identity))
        .route("/auth/password", put(recovery::change_password))
        .route("/auth/recovery/code/redeem", post(recovery::redeem_code))
        .route(
            "/auth/recovery/key/challenge",
            post(recovery_key::challenge),
        )
        .route("/auth/recovery/key/start", post(recovery_key::start))
        .route("/auth/recovery/key/redeem", post(recovery_key::redeem))
        .route("/auth/recovery-key", put(recovery_key::put_recovery_key))
        .route("/auth/display-name", patch(patch_display_name))
}

async fn logout(
    State(state): State<AppState>,
    headers: HeaderMap,
    jar: CookieJar,
) -> Result<impl IntoResponse, ApiError> {
    if let Some(id) = current_session_id(&state, &jar, &headers).await? {
        let account_id = db::session::find_by_id(&state.pool, id)
            .await?
            .map(|session| session.account_id);
        db::session::revoke(&state.pool, id).await?;
        if let Some(account_id) = account_id {
            state.ws.close_sessions(account_id, &[id]);
        }
    }
    let jar = jar.remove(Cookie::from(SESSION_COOKIE));
    Ok((StatusCode::NO_CONTENT, jar))
}

async fn me(OptionalAuth(user): OptionalAuth) -> impl IntoResponse {
    match user {
        Some(account) => Json(account.auth_view()).into_response(),
        None => StatusCode::NO_CONTENT.into_response(),
    }
}

async fn put_identity_vault(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Json(body): Json<serde_json::Value>,
) -> Result<StatusCode, ApiError> {
    let bytes = register::encode_identity_vault(Some(&body))?
        .ok_or_else(|| ApiError::bad_request("identity_vault required"))?;
    db::account::set_identity_vault(&state.pool, account.id, &bytes).await?;
    Ok(StatusCode::NO_CONTENT)
}

#[derive(Debug, Deserialize)]
struct ReplaceIdentityBody {
    identity_pubkey: String,
    identity_vault: serde_json::Value,
}

async fn put_identity(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Json(body): Json<ReplaceIdentityBody>,
) -> Result<Json<crate::domain::account::AuthAccount>, ApiError> {
    let pubkey = register::decode_pubkey(&body.identity_pubkey)?;
    let vault = register::encode_identity_vault(Some(&body.identity_vault))?
        .ok_or_else(|| ApiError::bad_request("identity_vault required"))?;
    let mut tx = state.pool.begin().await?;
    let events = apply_identity_replacement(&mut tx, account.id, &pubkey, &vault).await?;
    tx.commit().await?;
    let encoded = base64::engine::general_purpose::STANDARD.encode(&pubkey);
    for event in events {
        state.ws.send_to_accounts(
            &event.synced_account_ids,
            "key_handoff.requested",
            event.server_id,
            &serde_json::json!({
                "account_id": account.id,
                "identity_pubkey": encoded,
            }),
        );
    }
    let updated = db::account::find_by_id(&state.pool, account.id)
        .await?
        .ok_or_else(ApiError::unauthorized)?;
    Ok(Json(updated.auth_view()))
}

pub(crate) struct HandoffEvent {
    pub server_id: Uuid,
    pub synced_account_ids: Vec<Uuid>,
}

/// Performs every persistent consequence of a new identity in the caller's transaction.
/// The caller must publish returned events only after the transaction commits.
pub(crate) async fn apply_identity_replacement(
    tx: &mut sqlx::Transaction<'_, sqlx::Sqlite>,
    account_id: Uuid,
    pubkey: &[u8],
    vault: &[u8],
) -> Result<Vec<HandoffEvent>, ApiError> {
    let conn: &mut SqliteConnection = &mut *tx;
    sqlx::query(
        "UPDATE account SET identity_pubkey = ?, identity_vault = ?, recovery_vault = NULL, \
         recovery_verifier_pubkey = NULL, recovery_set_at = NULL, recovery_generation = recovery_generation + 1 \
         WHERE id = ?",
    )
    .bind(pubkey)
    .bind(vault)
    .bind(account_id.to_string())
    .execute(&mut *conn)
    .await?;
    sqlx::query("DELETE FROM recovery_challenge WHERE account_id = ?")
        .bind(account_id.to_string())
        .execute(&mut *conn)
        .await?;
    sqlx::query("DELETE FROM recovery_ticket WHERE account_id = ?")
        .bind(account_id.to_string())
        .execute(&mut *conn)
        .await?;
    sqlx::query("DELETE FROM key_envelope WHERE account_id = ?")
        .bind(account_id.to_string())
        .execute(&mut *conn)
        .await?;
    let server_ids: Vec<(String,)> =
        sqlx::query_as("SELECT server_id FROM membership WHERE account_id = ?")
            .bind(account_id.to_string())
            .fetch_all(&mut *conn)
            .await?;
    let mut events = Vec::with_capacity(server_ids.len());
    for (server_id,) in server_ids {
        sqlx::query("UPDATE membership SET key_handoff_status = 'pending' WHERE account_id = ? AND server_id = ?")
            .bind(account_id.to_string())
            .bind(&server_id)
            .execute(&mut *conn)
            .await?;
        let synced: Vec<(String,)> = sqlx::query_as("SELECT account_id FROM membership WHERE server_id = ? AND key_handoff_status = 'synced'")
            .bind(&server_id)
            .fetch_all(&mut *conn)
            .await?;
        events.push(HandoffEvent {
            server_id: Uuid::parse_str(&server_id)
                .map_err(|e| ApiError::internal(e.to_string()))?,
            synced_account_ids: synced
                .into_iter()
                .map(|(id,)| Uuid::parse_str(&id).map_err(|e| ApiError::internal(e.to_string())))
                .collect::<Result<_, _>>()?,
        });
    }
    Ok(events)
}

#[derive(Debug, Deserialize)]
struct PatchDisplayNameBody {
    /// Null or empty/whitespace clears the display name.
    display_name: Option<String>,
}

async fn patch_display_name(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Json(body): Json<PatchDisplayNameBody>,
) -> Result<Json<crate::domain::account::AuthAccount>, ApiError> {
    let normalized = crate::domain::account::normalize_display_name(body.display_name.as_deref())
        .map_err(ApiError::bad_request)?;
    db::account::set_display_name(&state.pool, account.id, normalized.as_deref()).await?;
    let updated = db::account::find_by_id(&state.pool, account.id)
        .await?
        .ok_or_else(ApiError::unauthorized)?;
    Ok(Json(updated.auth_view()))
}
