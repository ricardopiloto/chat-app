use crate::api::auth::session::hash_token;
use crate::config::RegistoModo;
use crate::email_address::{domain_blocked, normalize};
use crate::email_sender::EmailMessage;
use crate::email_templates;
use crate::error::ApiError;
use crate::rate_limit::RealClientIp;
use crate::AppState;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::Json;
use chrono::{Duration, Utc};
use rand::RngCore;
use serde::{Deserialize, Serialize};
use sqlx::Connection;
use uuid::Uuid;

#[derive(Serialize)]
pub struct RegisterConfig {
    mode: &'static str,
    turnstile_site_key: Option<String>,
}

pub async fn register_config(State(state): State<AppState>) -> Json<RegisterConfig> {
    Json(RegisterConfig {
        mode: state.config.mode().unwrap_or(RegistoModo::Fechado).as_str(),
        turnstile_site_key: state.config.turnstile_site_key.clone(),
    })
}

#[derive(Deserialize)]
pub struct RequestBody {
    #[serde(default)]
    email: String,
    #[serde(default)]
    terms_accepted: bool,
    #[serde(default)]
    website: String,
    captcha_token: Option<String>,
}

async fn verify_captcha(
    state: &AppState,
    token: Option<&str>,
    ip: Option<std::net::IpAddr>,
) -> bool {
    if state.config.turnstile_secret.is_empty() {
        return true;
    }
    let Some(token) = token.filter(|v| !v.is_empty()) else {
        return false;
    };
    let client = match reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(5))
        .build()
    {
        Ok(v) => v,
        Err(_) => return false,
    };
    let mut form = vec![
        ("secret", state.config.turnstile_secret.expose().to_owned()),
        ("response", token.to_owned()),
    ];
    if let Some(ip) = ip {
        form.push(("remoteip", ip.to_string()));
    }
    let result = client
        .post("https://challenges.cloudflare.com/turnstile/v0/siteverify")
        .form(&form)
        .send()
        .await;
    match result {
        Ok(response) => response
            .json::<serde_json::Value>()
            .await
            .ok()
            .is_some_and(|v| v["success"] == true),
        Err(_) => false,
    }
}

fn code(status: StatusCode, name: &'static str) -> ApiError {
    match status {
        StatusCode::FORBIDDEN => ApiError::forbidden_code(name, name),
        _ => ApiError::bad_request_code(name, name),
    }
}

pub async fn request(
    State(state): State<AppState>,
    RealClientIp(ip): RealClientIp,
    headers: HeaderMap,
    Json(body): Json<RequestBody>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    if state.config.mode().ok() != Some(RegistoModo::Aberto) {
        return Err(code(StatusCode::FORBIDDEN, "registration_closed"));
    }
    if !body.terms_accepted {
        return Err(code(StatusCode::BAD_REQUEST, "terms_required"));
    }
    if !verify_captcha(&state, body.captcha_token.as_deref(), ip).await {
        return Err(code(StatusCode::BAD_REQUEST, "captcha_failed"));
    }
    let (email, canonical) =
        normalize(&body.email).map_err(|_| code(StatusCode::BAD_REQUEST, "email_invalid"))?;
    if domain_blocked(&email, state.config.registo_dominios_bloqueados.as_deref()) {
        return Err(code(StatusCode::BAD_REQUEST, "email_domain_blocked"));
    }
    if !state.config.rate_limit_disabled && !state.rate_limiter.allow_email_ip(ip) {
        return Err(ApiError::too_many_requests());
    }
    let generic = (StatusCode::ACCEPTED, Json(serde_json::json!({"ok": true})));
    if !body.website.is_empty() {
        return Ok(generic);
    }
    let english = headers
        .get("accept-language")
        .and_then(|v| v.to_str().ok())
        .is_some_and(|v| v.to_ascii_lowercase().starts_with("en"));
    tokio::spawn(async move {
        if let Err(error) = process_request(&state, email, canonical, english).await {
            tracing::warn!(status = %error.status, "email request processing failed");
        }
    });
    Ok(generic)
}

async fn process_request(
    state: &AppState,
    email: String,
    canonical: String,
    english: bool,
) -> Result<(), ApiError> {
    if !state.config.rate_limit_disabled && !state.rate_limiter.allow_email_address(&canonical) {
        return Ok(());
    }
    let now = Utc::now();
    let mut conn = state.pool.acquire().await?;
    let mut tx = conn.begin_with("BEGIN IMMEDIATE").await?;
    let existing: Option<(String,)> =
        sqlx::query_as("SELECT id FROM account WHERE email_canonical = ?")
            .bind(&canonical)
            .fetch_optional(&mut *tx)
            .await?;
    let template;
    let purpose;
    if existing.is_some() {
        template = email_templates::existing_account(english);
        purpose = "notice";
    } else {
        let mut bytes = [0u8; 32];
        rand::thread_rng().fill_bytes(&mut bytes);
        let token = hex::encode(bytes);
        sqlx::query("UPDATE email_verification SET expires_at = ? WHERE email_canonical = ? AND consumed_at IS NULL AND expires_at > ?")
            .bind(now.to_rfc3339()).bind(&canonical).bind(now.to_rfc3339()).execute(&mut *tx).await?;
        sqlx::query("INSERT INTO email_verification (id, email, email_canonical, token_hash, expires_at, consumed_at, created_at) VALUES (?, ?, ?, ?, ?, NULL, ?)")
            .bind(Uuid::new_v4().to_string()).bind(&email).bind(&canonical).bind(hash_token(&token))
            .bind((now + Duration::hours(5)).to_rfc3339()).bind(now.to_rfc3339()).execute(&mut *tx).await?;
        template = email_templates::verification(
            state
                .config
                .public_base_url
                .as_deref()
                .unwrap_or("http://localhost:3000"),
            &token,
            english,
        );
        purpose = "verify";
    }
    tx.commit().await?;
    drop(conn);
    state
        .email_sender
        .send(EmailMessage {
            to: email,
            canonical,
            purpose,
            subject: template.subject,
            html: template.html,
            text: template.text,
        })
        .await;
    Ok(())
}

#[derive(Deserialize)]
pub struct VerifyBody {
    pub token: String,
}

pub async fn verify(
    State(state): State<AppState>,
    Json(body): Json<VerifyBody>,
) -> Result<Json<serde_json::Value>, ApiError> {
    let found = valid_token(&state.pool, &body.token).await?;
    match found {
        Some((email, _)) => Ok(Json(serde_json::json!({"email": email}))),
        None => Err(invalid_token()),
    }
}

pub fn invalid_token() -> ApiError {
    code(StatusCode::BAD_REQUEST, "email_token_invalid")
}

pub async fn valid_token<'e, E>(
    executor: E,
    token: &str,
) -> Result<Option<(String, String)>, ApiError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    if token.len() != 64 || !token.bytes().all(|b| b.is_ascii_hexdigit()) {
        return Ok(None);
    }
    let row: Option<(String, String)> = sqlx::query_as("SELECT email, email_canonical FROM email_verification WHERE token_hash = ? AND consumed_at IS NULL AND expires_at > ?")
        .bind(hash_token(token)).bind(Utc::now().to_rfc3339()).fetch_optional(executor).await?;
    Ok(row)
}

pub async fn cleanup(pool: &sqlx::SqlitePool) -> Result<u64, sqlx::Error> {
    let now = Utc::now();
    let result = sqlx::query("DELETE FROM email_verification WHERE expires_at <= ? OR (consumed_at IS NOT NULL AND consumed_at <= ?)")
        .bind(now.to_rfc3339()).bind((now - Duration::hours(24)).to_rfc3339()).execute(pool).await?;
    Ok(result.rows_affected())
}

pub fn spawn_cleanup(pool: sqlx::SqlitePool) {
    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_secs(15 * 60));
        loop {
            interval.tick().await;
            if let Err(error) = cleanup(&pool).await {
                tracing::warn!(error = %error, "email verification cleanup failed");
            }
        }
    });
}
