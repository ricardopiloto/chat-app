use crate::db;
use crate::domain::account::AccountRecord;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum_extra::extract::cookie::CookieJar;
use sha2::{Digest, Sha256};

pub const SESSION_COOKIE: &str = "Session";

pub fn hash_token(token: &str) -> String {
    hex::encode(Sha256::digest(token.as_bytes()))
}

pub struct AuthUser(pub AccountRecord);

pub struct OptionalAuth(pub Option<AccountRecord>);

async fn load_user(state: &AppState, jar: &CookieJar) -> Result<Option<AccountRecord>, ApiError> {
    let Some(cookie) = jar.get(SESSION_COOKIE) else {
        return Ok(None);
    };
    let hash = hash_token(cookie.value());
    let Some(session) = db::session::find_by_token_hash(&state.pool, &hash).await? else {
        return Ok(None);
    };
    if !session.is_valid(chrono::Utc::now()) {
        return Ok(None);
    }
    let account = db::account::find_by_id(&state.pool, session.account_id)
        .await?
        .ok_or_else(ApiError::unauthorized)?;
    Ok(Some(account))
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let jar = CookieJar::from_headers(&parts.headers);
        load_user(state, &jar)
            .await?
            .map(AuthUser)
            .ok_or_else(ApiError::unauthorized)
    }
}

impl FromRequestParts<AppState> for OptionalAuth {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let jar = CookieJar::from_headers(&parts.headers);
        Ok(OptionalAuth(load_user(state, &jar).await?))
    }
}

pub fn current_session_id(
    state: &AppState,
    jar: &CookieJar,
) -> impl std::future::Future<Output = Result<Option<uuid::Uuid>, ApiError>> + Send {
    let hash = jar.get(SESSION_COOKIE).map(|c| hash_token(c.value()));
    let pool = state.pool.clone();
    async move {
        let Some(hash) = hash else {
            return Ok(None);
        };
        Ok(db::session::find_by_token_hash(&pool, &hash)
            .await?
            .filter(|s| s.is_valid(chrono::Utc::now()))
            .map(|s| s.id))
    }
}
