use crate::api::auth::session::AuthUser;
use crate::api::avatars::{image_response, media_type_from_headers, validate_body_with_limit, write_file};
use crate::db;
use crate::domain::camera_background::{CameraBackground, MAX_CAMERA_BACKGROUND_BYTES, MAX_CAMERA_BACKGROUNDS_PER_ACCOUNT};
use crate::error::ApiError;
use crate::AppState;
use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::http::{HeaderMap, StatusCode};
use axum::response::Response;
use axum::Json;
use uuid::Uuid;

pub async fn list(State(state): State<AppState>, AuthUser(account): AuthUser) -> Result<Json<Vec<CameraBackground>>, ApiError> {
    Ok(Json(db::camera_background::list_by_account(&state.pool, account.id).await?))
}

pub async fn upload(State(state): State<AppState>, AuthUser(account): AuthUser, headers: HeaderMap, body: Bytes) -> Result<Json<CameraBackground>, ApiError> {
    validate_body_with_limit(&body, MAX_CAMERA_BACKGROUND_BYTES, "image exceeds 5 MiB limit")?;
    let content_type = media_type_from_headers(&headers)?;
    if db::camera_background::list_by_account(&state.pool, account.id).await?.len() as i64 >= MAX_CAMERA_BACKGROUNDS_PER_ACCOUNT {
        return Err(ApiError::bad_request("camera background limit reached (10 images)"));
    }
    let id = Uuid::new_v4();
    let filename = Uuid::new_v4().to_string();
    let path = state.config.camera_backgrounds_dir.join(&filename);
    write_file(&path, &body).await?;
    match db::camera_background::insert(&state.pool, id, account.id, &filename, &content_type, body.len() as i64).await {
        Ok(background) => Ok(Json(background)),
        Err(error) => { let _ = tokio::fs::remove_file(path).await; Err(error.into()) }
    }
}

pub async fn get(State(state): State<AppState>, AuthUser(account): AuthUser, Path(id): Path<Uuid>) -> Result<Response, ApiError> {
    let background = db::camera_background::find_by_id_and_account(&state.pool, id, account.id).await?
        .ok_or_else(|| ApiError::not_found("camera background not found"))?;
    image_response(&state.config.camera_backgrounds_dir.join(background.filename), &background.content_type).await
}

pub async fn delete(State(state): State<AppState>, AuthUser(account): AuthUser, Path(id): Path<Uuid>) -> Result<StatusCode, ApiError> {
    let background = db::camera_background::find_by_id_and_account(&state.pool, id, account.id).await?
        .ok_or_else(|| ApiError::not_found("camera background not found"))?;
    db::camera_background::delete(&state.pool, id, account.id).await?;
    let _ = tokio::fs::remove_file(state.config.camera_backgrounds_dir.join(background.filename)).await;
    Ok(StatusCode::NO_CONTENT)
}
