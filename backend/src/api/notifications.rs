use crate::api::auth::session::AuthUser;
use crate::db;
use crate::domain::notification::UserNotification;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, Query, State};
use axum::http::StatusCode;
use axum::Json;
use chrono::Utc;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct ListQuery {
    #[serde(default = "default_unread_only")]
    pub unread_only: bool,
    #[serde(default = "default_limit")]
    pub limit: i64,
}

fn default_unread_only() -> bool {
    true
}

fn default_limit() -> i64 {
    50
}

pub async fn list_notifications(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Query(query): Query<ListQuery>,
) -> Result<Json<Vec<UserNotification>>, ApiError> {
    let limit = query.limit.clamp(1, 100);
    Ok(Json(
        db::notification::list_for_account(&state.pool, account.id, query.unread_only, limit)
            .await?,
    ))
}

pub async fn mark_notification_read(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(notification_id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    let existing = db::notification::find_by_id(&state.pool, notification_id)
        .await?
        .ok_or_else(|| ApiError::not_found("notification not found"))?;
    if existing.account_id != account.id {
        return Err(ApiError::not_found("notification not found"));
    }
    let _ = db::notification::mark_read(&state.pool, notification_id, account.id, Utc::now()).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn mark_all_notifications_read(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
) -> Result<StatusCode, ApiError> {
    let _ = db::notification::mark_all_read_for_account(&state.pool, account.id, Utc::now()).await?;
    Ok(StatusCode::NO_CONTENT)
}
