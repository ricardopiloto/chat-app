use crate::db;
use crate::domain::account::AccountRecord;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::FromRequestParts;
use axum::http::request::Parts;
use axum::http::HeaderMap;
use axum_extra::extract::cookie::CookieJar;
use sha2::{Digest, Sha256};
use uuid::Uuid;

pub const SESSION_COOKIE: &str = "Session";

pub fn hash_token(token: &str) -> String {
    hex::encode(Sha256::digest(token.as_bytes()))
}

pub struct AuthUser(pub AccountRecord);

pub struct OptionalAuth(pub Option<AccountRecord>);

struct ResolvedSession {
    account: AccountRecord,
    session_id: Uuid,
}

fn bearer_token(headers: &HeaderMap) -> Option<&str> {
    let value = headers
        .get(axum::http::header::AUTHORIZATION)?
        .to_str()
        .ok()?;
    let (scheme, token) = value.split_once(' ')?;
    let token = token.trim();
    if !scheme.eq_ignore_ascii_case("bearer") || token.is_empty() {
        return None;
    }
    Some(token)
}

async fn session_for_token(
    state: &AppState,
    token: &str,
) -> Result<Option<ResolvedSession>, ApiError> {
    let hash = hash_token(token);
    let Some(session) = db::session::find_by_token_hash(&state.pool, &hash).await? else {
        return Ok(None);
    };
    if !session.is_valid(chrono::Utc::now()) {
        return Ok(None);
    }
    let account = db::account::find_by_id(&state.pool, session.account_id)
        .await?
        .ok_or_else(ApiError::unauthorized)?;
    Ok(Some(ResolvedSession {
        account,
        session_id: session.id,
    }))
}

/// Cookie wins when it names a valid session. An absent or invalid cookie falls
/// through to `Authorization: Bearer <token>`, validated the same way.
async fn resolve_session(
    state: &AppState,
    jar: &CookieJar,
    headers: &HeaderMap,
) -> Result<Option<ResolvedSession>, ApiError> {
    if let Some(cookie) = jar.get(SESSION_COOKIE) {
        if let Some(resolved) = session_for_token(state, cookie.value()).await? {
            return Ok(Some(resolved));
        }
    }
    if let Some(token) = bearer_token(headers) {
        if let Some(resolved) = session_for_token(state, token).await? {
            return Ok(Some(resolved));
        }
    }
    Ok(None)
}

async fn load_user(
    state: &AppState,
    jar: &CookieJar,
    headers: &HeaderMap,
) -> Result<Option<AccountRecord>, ApiError> {
    Ok(resolve_session(state, jar, headers)
        .await?
        .map(|resolved| resolved.account))
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let jar = CookieJar::from_headers(&parts.headers);
        load_user(state, &jar, &parts.headers)
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
        Ok(OptionalAuth(load_user(state, &jar, &parts.headers).await?))
    }
}

pub async fn current_session_id(
    state: &AppState,
    jar: &CookieJar,
    headers: &HeaderMap,
) -> Result<Option<Uuid>, ApiError> {
    Ok(resolve_session(state, jar, headers)
        .await?
        .map(|resolved| resolved.session_id))
}
