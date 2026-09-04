use crate::api::auth::register::{persist_session, with_session_cookie};
use crate::db;
use crate::error::ApiError;
use crate::AppState;
use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::extract::State;
use axum::Json;
use axum_extra::extract::cookie::CookieJar;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
pub struct LoginBody {
    pub handle: String,
    pub password: String,
}

pub async fn login(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(body): Json<LoginBody>,
) -> Result<(CookieJar, Json<crate::domain::account::AuthAccount>), ApiError> {
    let account = db::account::find_by_handle(&state.pool, body.handle.trim())
        .await?
        .ok_or_else(|| ApiError::new(axum::http::StatusCode::UNAUTHORIZED, "invalid credentials"))?;
    let parsed = PasswordHash::new(&account.password_hash)
        .map_err(|e| ApiError::internal(e.to_string()))?;
    Argon2::default()
        .verify_password(body.password.as_bytes(), &parsed)
        .map_err(|_| ApiError::new(axum::http::StatusCode::UNAUTHORIZED, "invalid credentials"))?;
    let token = persist_session(&state.pool, account.id, state.config.session_ttl_secs).await?;
    let jar = with_session_cookie(jar, token, state.config.cookie_secure);
    Ok((jar, Json(account.auth_view())))
}
