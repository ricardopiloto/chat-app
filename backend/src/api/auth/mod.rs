use crate::api::auth::session::{current_session_id, AuthUser, SESSION_COOKIE};
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

async fn me(AuthUser(account): AuthUser) -> impl IntoResponse {
    axum::Json(account.auth_view())
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
