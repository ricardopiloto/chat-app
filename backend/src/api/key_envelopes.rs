use crate::api::auth::session::AuthUser;
use crate::api::channels::require_member;
use crate::db;
use crate::domain::key_envelope::KeyEnvelope;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use base64::Engine;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct PostEnvelopeBody {
    pub account_id: Uuid,
    pub sealed_key: String,
}

#[derive(Debug, Serialize)]
pub struct EnvelopeView {
    pub server_id: Uuid,
    pub account_id: Uuid,
    pub sealed_key: String,
}

pub async fn post_envelope(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
    Json(body): Json<PostEnvelopeBody>,
) -> Result<impl IntoResponse, ApiError> {
    require_member(&state.pool, account.id, server_id).await?;
    let sealed = base64::engine::general_purpose::STANDARD
        .decode(body.sealed_key.trim())
        .map_err(|_| ApiError::bad_request("sealed_key must be base64"))?;
    if !db::membership::exists(&state.pool, body.account_id, server_id).await? {
        return Err(ApiError::bad_request("target is not a member"));
    }
    db::key_envelope::upsert(
        &state.pool,
        &KeyEnvelope {
            server_id,
            account_id: body.account_id,
            sealed_key: sealed,
            sealed_by_account_id: account.id,
        },
    )
    .await?;
    db::membership::set_handoff_synced(&state.pool, body.account_id, server_id).await?;
    state.ws.send_to_accounts(
        &[body.account_id],
        "key_handoff.completed",
        server_id,
        &serde_json::json!({ "account_id": body.account_id }),
    );
    Ok(StatusCode::CREATED)
}

pub async fn get_my_envelope(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
) -> Result<Json<EnvelopeView>, ApiError> {
    require_member(&state.pool, account.id, server_id).await?;
    let env = db::key_envelope::get_for_account(&state.pool, server_id, account.id)
        .await?
        .ok_or_else(|| ApiError::not_found("key envelope not ready"))?;
    Ok(Json(EnvelopeView {
        server_id: env.server_id,
        account_id: env.account_id,
        sealed_key: base64::engine::general_purpose::STANDARD.encode(&env.sealed_key),
    }))
}
