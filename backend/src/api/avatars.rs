use crate::api::auth::session::AuthUser;
use crate::db;
use crate::domain::avatar::{normalize_avatar_type, MAX_AVATAR_BYTES};
use crate::error::ApiError;
use crate::AppState;
use axum::body::Bytes;
use axum::extract::{Path, State};
use axum::http::{header, HeaderMap, HeaderValue, StatusCode};
use axum::response::Response;
use axum::Json;
use std::path::{Path as FsPath, PathBuf};
use uuid::Uuid;

fn media_type_from_headers(headers: &HeaderMap) -> Result<String, ApiError> {
    let raw = headers
        .get("x-mesa-media-type")
        .and_then(|v| v.to_str().ok())
        .or_else(|| headers.get(header::CONTENT_TYPE).and_then(|v| v.to_str().ok()))
        .unwrap_or("")
        .trim();
    normalize_avatar_type(raw).ok_or_else(|| {
        ApiError::bad_request("content type must be image/jpeg, image/png, or image/webp")
    })
}

fn validate_body(body: &Bytes) -> Result<(), ApiError> {
    if body.is_empty() {
        return Err(ApiError::bad_request("empty image body"));
    }
    if body.len() > MAX_AVATAR_BYTES {
        return Err(ApiError::bad_request("image exceeds 1 MiB limit"));
    }
    Ok(())
}

async fn write_file(path: &FsPath, bytes: &[u8]) -> Result<(), ApiError> {
    if let Some(parent) = path.parent() {
        tokio::fs::create_dir_all(parent)
            .await
            .map_err(|_| ApiError::internal("failed to create avatars dir"))?;
    }
    tokio::fs::write(path, bytes)
        .await
        .map_err(|_| ApiError::internal("failed to store avatar"))
}

async fn remove_file(path: &FsPath) {
    let _ = tokio::fs::remove_file(path).await;
}

fn account_path(dir: &FsPath, filename: &str) -> PathBuf {
    dir.join(filename)
}

fn server_path(dir: &FsPath, filename: &str) -> PathBuf {
    dir.join("servers").join(filename)
}

async fn image_response(path: &FsPath, content_type: &str) -> Result<Response, ApiError> {
    let bytes = tokio::fs::read(path)
        .await
        .map_err(|_| ApiError::not_found("avatar not found"))?;
    let mut response = Response::new(bytes.into());
    *response.status_mut() = StatusCode::OK;
    let ct = HeaderValue::from_str(content_type)
        .unwrap_or_else(|_| HeaderValue::from_static("application/octet-stream"));
    response.headers_mut().insert(header::CONTENT_TYPE, ct);
    response.headers_mut().insert(
        header::CACHE_CONTROL,
        HeaderValue::from_static("private, no-store"),
    );
    Ok(response)
}

pub async fn put_own_avatar(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Json<crate::domain::account::AuthAccount>, ApiError> {
    validate_body(&body)?;
    let media_type = media_type_from_headers(&headers)?;
    let filename = Uuid::new_v4().to_string();
    let dest = account_path(&state.config.avatars_dir, &filename);
    write_file(&dest, &body).await?;
    let old = account.avatar_filename.clone();
    db::account::set_avatar(&state.pool, account.id, Some(&filename), Some(&media_type)).await?;
    if let Some(old) = old.as_deref() {
        if old != filename {
            remove_file(&account_path(&state.config.avatars_dir, old)).await;
        }
    }
    let updated = db::account::find_by_id(&state.pool, account.id)
        .await?
        .ok_or_else(ApiError::unauthorized)?;
    Ok(Json(updated.auth_view()))
}

pub async fn delete_own_avatar(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
) -> Result<StatusCode, ApiError> {
    if let Some(old) = account.avatar_filename.as_deref() {
        remove_file(&account_path(&state.config.avatars_dir, old)).await;
    }
    db::account::set_avatar(&state.pool, account.id, None, None).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_account_avatar(
    State(state): State<AppState>,
    AuthUser(_account): AuthUser,
    Path(account_id): Path<Uuid>,
) -> Result<Response, ApiError> {
    let target = db::account::find_by_id(&state.pool, account_id)
        .await?
        .ok_or_else(|| ApiError::not_found("account not found"))?;
    let (filename, content_type) = match (target.avatar_filename, target.avatar_content_type) {
        (Some(f), Some(ct)) => (f, ct),
        _ => return Err(ApiError::not_found("avatar not found")),
    };
    image_response(
        &account_path(&state.config.avatars_dir, &filename),
        &content_type,
    )
    .await
}

pub async fn put_server_image(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
    headers: HeaderMap,
    body: Bytes,
) -> Result<Json<crate::domain::server::Server>, ApiError> {
    let server = db::server::find_by_id(&state.pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    if account.id != server.owner_account_id {
        return Err(ApiError::forbidden("only the owner can change the server image"));
    }
    validate_body(&body)?;
    let media_type = media_type_from_headers(&headers)?;
    let filename = Uuid::new_v4().to_string();
    let dest = server_path(&state.config.avatars_dir, &filename);
    write_file(&dest, &body).await?;
    let old = server.image_filename.clone();
    db::server::set_image(&state.pool, server_id, Some(&filename), Some(&media_type)).await?;
    if let Some(old) = old.as_deref() {
        if old != filename {
            remove_file(&server_path(&state.config.avatars_dir, old)).await;
        }
    }
    let updated = db::server::find_by_id(&state.pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    Ok(Json(updated))
}

pub async fn delete_server_image(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
) -> Result<StatusCode, ApiError> {
    let server = db::server::find_by_id(&state.pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    if account.id != server.owner_account_id {
        return Err(ApiError::forbidden("only the owner can change the server image"));
    }
    if let Some(old) = server.image_filename.as_deref() {
        remove_file(&server_path(&state.config.avatars_dir, old)).await;
    }
    db::server::set_image(&state.pool, server_id, None, None).await?;
    Ok(StatusCode::NO_CONTENT)
}

pub async fn get_server_image(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
) -> Result<Response, ApiError> {
    let server = db::server::find_by_id(&state.pool, server_id)
        .await?
        .ok_or_else(|| ApiError::not_found("server not found"))?;
    crate::api::authz::require_member(&state.pool, account.id, server_id).await?;
    let (filename, content_type) = match (server.image_filename, server.image_content_type) {
        (Some(f), Some(ct)) => (f, ct),
        _ => return Err(ApiError::not_found("server image not found")),
    };
    image_response(
        &server_path(&state.config.avatars_dir, &filename),
        &content_type,
    )
    .await
}
