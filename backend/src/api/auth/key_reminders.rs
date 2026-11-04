use crate::api::auth::session::AuthUser;
use crate::db;
use crate::domain::account::AuthAccount;
use crate::email_sender::EmailMessage;
use crate::email_templates;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::State;
use axum::Json;
use chrono::{Duration, Utc};
use serde::Deserialize;
use uuid::Uuid;

#[derive(Deserialize)]
pub struct PreferenceBody {
    enabled: bool,
}

pub async fn patch_preference(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Json(body): Json<PreferenceBody>,
) -> Result<Json<AuthAccount>, ApiError> {
    sqlx::query("UPDATE account SET key_reminders = ? WHERE id = ?")
        .bind(i64::from(body.enabled))
        .bind(account.id.to_string())
        .execute(&state.pool)
        .await?;
    let updated = db::account::find_by_id(&state.pool, account.id)
        .await?
        .ok_or_else(ApiError::unauthorized)?;
    Ok(Json(updated.auth_view()))
}

/// Registration already committed before this is called. Delivery is best effort.
pub fn spawn_welcome(state: AppState, account_id: Uuid, english: bool) {
    tokio::spawn(async move {
        let Some(base_url) = state.config.public_base_url.as_deref() else {
            return;
        };
        let row: Result<Option<(String, String, bool)>, _> = sqlx::query_as(
            "SELECT email, email_canonical, (recovery_vault IS NOT NULL AND recovery_verifier_pubkey IS NOT NULL) FROM account WHERE id = ? AND email_verified_at IS NOT NULL"
        ).bind(account_id.to_string()).fetch_optional(&state.pool).await;
        match row {
            Ok(Some((to, canonical, has_key))) => {
                let template = email_templates::key_welcome(base_url, has_key, english);
                state
                    .email_sender
                    .send(EmailMessage {
                        to,
                        canonical,
                        purpose: "key_welcome",
                        subject: template.subject,
                        html: template.html,
                        text: template.text,
                    })
                    .await;
            }
            Ok(None) => {}
            Err(_) => tracing::warn!("key welcome lookup failed"),
        }
    });
}

/// Called only by the user-facing channel handler after channel provisioning succeeds.
pub fn spawn_channel_reminder(state: AppState, account_id: Uuid, english: bool) {
    if !state.config.key_reminders {
        return;
    }
    tokio::spawn(async move {
        if let Err(_) = send_channel_reminder(&state, account_id, english).await {
            tracing::warn!("channel key reminder failed");
        }
    });
}

async fn send_channel_reminder(
    state: &AppState,
    account_id: Uuid,
    english: bool,
) -> Result<(), sqlx::Error> {
    let Some(base_url) = state.config.public_base_url.as_deref() else {
        return Ok(());
    };
    let now = Utc::now();
    let cutoff = now - Duration::hours(24);
    let reserved = sqlx::query(
        "UPDATE account SET last_key_reminder_at = ?, key_reminder_count = key_reminder_count + 1 \
         WHERE id = ? AND key_reminders = 1 AND key_reminder_count < 3 \
         AND (last_key_reminder_at IS NULL OR last_key_reminder_at < ?) \
         AND email IS NOT NULL AND email_canonical IS NOT NULL AND email_verified_at IS NOT NULL \
         AND NOT (recovery_vault IS NOT NULL AND recovery_verifier_pubkey IS NOT NULL)",
    )
    .bind(now.to_rfc3339())
    .bind(account_id.to_string())
    .bind(cutoff.to_rfc3339())
    .execute(&state.pool)
    .await?;
    if reserved.rows_affected() != 1 {
        return Ok(());
    }
    let row: Option<(String, String)> = sqlx::query_as(
        "SELECT email, email_canonical FROM account WHERE id = ? AND email_verified_at IS NOT NULL",
    )
    .bind(account_id.to_string())
    .fetch_optional(&state.pool)
    .await?;
    if let Some((to, canonical)) = row {
        let template = email_templates::key_channel_reminder(base_url, english);
        state
            .email_sender
            .send(EmailMessage {
                to,
                canonical,
                purpose: "key_channel_reminder",
                subject: template.subject,
                html: template.html,
                text: template.text,
            })
            .await;
    }
    Ok(())
}
