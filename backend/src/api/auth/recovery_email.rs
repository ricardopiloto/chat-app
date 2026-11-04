use crate::email_address::normalize;
use crate::email_sender::EmailMessage;
use crate::email_templates;
use crate::error::ApiError;
use crate::rate_limit::RealClientIp;
use crate::AppState;
use axum::extract::State;
use axum::http::{HeaderMap, StatusCode};
use axum::Json;
use serde::Deserialize;

#[derive(Deserialize)]
pub struct RequestBody {
    #[serde(default)]
    email: String,
    #[serde(default)]
    website: String,
    captcha_token: Option<String>,
}

pub async fn request(
    State(state): State<AppState>,
    RealClientIp(ip): RealClientIp,
    headers: HeaderMap,
    Json(body): Json<RequestBody>,
) -> Result<(StatusCode, Json<serde_json::Value>), ApiError> {
    if !state.config.reset_email {
        return Err(ApiError::not_found("not found"));
    }
    if !state.config.rate_limit_disabled && !state.rate_limiter.allow_recovery_email_ip(ip) {
        return Err(ApiError::too_many_requests());
    }
    let generic = (StatusCode::ACCEPTED, Json(serde_json::json!({"ok": true})));
    let Ok((_, canonical)) = normalize(&body.email) else {
        return Ok(generic);
    };
    if !body.website.is_empty()
        || !super::email::verify_captcha(&state, body.captcha_token.as_deref(), ip).await
    {
        return Ok(generic);
    }
    let english = wants_english(&headers);
    tokio::spawn(async move {
        if let Err(error) = process_request(&state, canonical, english).await {
            tracing::warn!(status = %error.status, "recovery email request failed");
        }
    });
    Ok(generic)
}

async fn process_request(
    state: &AppState,
    canonical: String,
    english: bool,
) -> Result<(), ApiError> {
    if !state.config.rate_limit_disabled
        && !state.rate_limiter.allow_recovery_email_address(&canonical)
    {
        return Ok(());
    }
    let row: Option<(String, String, bool)> = sqlx::query_as(
        "SELECT email, handle, (recovery_vault IS NOT NULL AND recovery_verifier_pubkey IS NOT NULL) \
         FROM account WHERE email_canonical = ? AND email_verified_at IS NOT NULL",
    )
    .bind(&canonical)
    .fetch_optional(&state.pool)
    .await?;
    let Some((email, handle, has_key)) = row else {
        return Ok(());
    };
    let template = if has_key {
        email_templates::recovery_with_key(
            state
                .config
                .public_base_url
                .as_deref()
                .unwrap_or("http://localhost:3000"),
            &handle,
            english,
        )
    } else {
        email_templates::recovery_without_key(&handle, english)
    };
    state
        .email_sender
        .send(EmailMessage {
            to: email,
            canonical,
            purpose: "recovery_request",
            subject: template.subject,
            html: template.html,
            text: template.text,
        })
        .await;
    Ok(())
}

/// Called only after a successful reset has committed. Delivery is best effort.
pub fn wants_english(headers: &HeaderMap) -> bool {
    headers
        .get("accept-language")
        .and_then(|v| v.to_str().ok())
        .is_some_and(|v| v.to_ascii_lowercase().starts_with("en"))
}

pub fn spawn_reset_notice(state: AppState, account_id: uuid::Uuid, english: bool) {
    tokio::spawn(async move {
        let row: Result<Option<(String, String)>, _> = sqlx::query_as(
            "SELECT email, email_canonical FROM account WHERE id = ? AND email_verified_at IS NOT NULL",
        )
        .bind(account_id.to_string())
        .fetch_optional(&state.pool)
        .await;
        match row {
            Ok(Some((email, canonical))) => {
                let template = email_templates::recovery_completed(english);
                state
                    .email_sender
                    .send(EmailMessage {
                        to: email,
                        canonical,
                        purpose: "password_reset_notice",
                        subject: template.subject,
                        html: template.html,
                        text: template.text,
                    })
                    .await;
            }
            Ok(None) => {}
            Err(_) => tracing::warn!("password reset notice lookup failed"),
        }
    });
}
