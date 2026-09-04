use crate::api::auth::session::{current_session_id, AuthUser, OptionalAuth, SESSION_COOKIE};
use crate::db;
use crate::error::ApiError;
use crate::AppState;
use axum::Json;
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::routing::{get, post, put};
use axum::Router;
use axum_extra::extract::cookie::{Cookie, CookieJar};
use base64::Engine;
use serde::Deserialize;

pub mod login;
pub mod register;
pub mod session;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/auth/register", post(register::register))
        .route("/auth/login", post(login::login))
        .route("/auth/logout", post(logout))
        .route("/auth/me", get(me))
        .route("/auth/identity-vault", put(put_identity_vault))
        .route("/auth/identity", put(put_identity))
}

async fn logout(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<impl IntoResponse, ApiError> {
    if let Some(id) = current_session_id(&state, &jar).await? {
        db::session::revoke(&state.pool, id).await?;
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
    db::account::replace_identity(&state.pool, account.id, &pubkey, &vault).await?;
    db::key_envelope::delete_for_account(&state.pool, account.id).await?;
    let server_ids = db::membership::list_server_ids_for_account(&state.pool, account.id).await?;
    for server_id in server_ids {
        db::membership::set_handoff_pending(&state.pool, account.id, server_id).await?;
        let synced = db::membership::list_synced_account_ids(&state.pool, server_id).await?;
        let encoded = base64::engine::general_purpose::STANDARD.encode(&pubkey);
        state.ws.send_to_accounts(
            &synced,
            "key_handoff.requested",
            server_id,
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
