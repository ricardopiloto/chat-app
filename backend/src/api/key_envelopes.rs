use crate::api::auth::session::AuthUser;
use crate::api::authz::require_member;
use crate::db;
use crate::domain::membership::KeyHandoffStatus;
use crate::domain::permissions;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use base64::Engine;
use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::Connection;
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
    let mut conn = state.pool.acquire().await?;
    let mut tx = conn.begin_with("BEGIN IMMEDIATE").await?;
    let own = body.account_id == account.id;
    let existing: Option<(Vec<u8>,)> = sqlx::query_as(
        "SELECT sealed_key FROM key_envelope WHERE server_id = ? AND account_id = ?",
    )
    .bind(server_id.to_string())
    .bind(body.account_id.to_string())
    .fetch_optional(&mut *tx)
    .await?;
    let seed_eligible = if own && existing.is_none() {
        pending_seed_member(&mut *tx, account.id, server_id).await?
    } else {
        false
    };
    let mut announce = true;
    let mut rewrite = true;
    if own {
        if let Some((current,)) = existing {
            if current == sealed {
                announce = false;
                rewrite = false;
            } else {
                return Err(ApiError::conflict("key already exists"));
            }
        } else {
            let (others,): (i64,) = sqlx::query_as(
                "SELECT COUNT(*) FROM key_envelope WHERE server_id = ? AND account_id != ?",
            )
            .bind(server_id.to_string())
            .bind(account.id.to_string())
            .fetch_one(&mut *tx)
            .await?;
            if others > 0 && !seed_eligible {
                return Err(ApiError::conflict("key already exists"));
            }
        }
    } else {
        let target = db::membership::find(&mut *tx, body.account_id, server_id)
            .await?
            .ok_or_else(|| ApiError::bad_request("target is not a member"))?;
        if target.key_handoff_status != KeyHandoffStatus::Pending {
            return Err(ApiError::forbidden(
                "cannot overwrite a synced key envelope",
            ));
        }
        let (owner_id,): (String,) =
            sqlx::query_as("SELECT owner_account_id FROM server WHERE id = ?")
                .bind(server_id.to_string())
                .fetch_optional(&mut *tx)
                .await?
                .ok_or_else(|| ApiError::not_found("server not found"))?;
        let caller = db::membership::find(&mut *tx, account.id, server_id)
            .await?
            .ok_or_else(|| ApiError::forbidden("not a member of this server"))?;
        let owner = permissions::is_server_owner(
            Uuid::parse_str(&owner_id).map_err(|e| ApiError::internal(e.to_string()))?,
            account.id,
        );
        let synced = caller.key_handoff_status == KeyHandoffStatus::Synced;
        if !owner && !synced {
            return Err(ApiError::forbidden(
                "only the owner or a synced member can complete handoff",
            ));
        }
    }
    if rewrite {
        sqlx::query(
        "INSERT INTO key_envelope (server_id, account_id, sealed_key, sealed_by_account_id, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(server_id, account_id) DO UPDATE SET
           sealed_key = excluded.sealed_key,
           sealed_by_account_id = excluded.sealed_by_account_id,
           created_at = excluded.created_at",
    )
    .bind(server_id.to_string())
    .bind(body.account_id.to_string())
    .bind(&sealed)
    .bind(account.id.to_string())
    .bind(Utc::now().to_rfc3339())
    .execute(&mut *tx)
    .await?;
    }
    sqlx::query("UPDATE membership SET key_handoff_status = 'synced' WHERE account_id = ? AND server_id = ?")
        .bind(body.account_id.to_string())
        .bind(server_id.to_string())
        .execute(&mut *tx)
        .await?;
    tx.commit().await?;
    if announce {
        state.ws.send_to_accounts(
            &[body.account_id],
            "key_handoff.completed",
            server_id,
            &serde_json::json!({ "account_id": body.account_id }),
        );
    }
    Ok(StatusCode::CREATED)
}

async fn pending_seed_member<'e, E>(
    executor: E,
    account_id: Uuid,
    server_id: Uuid,
) -> Result<bool, ApiError>
where
    E: sqlx::Executor<'e, Database = sqlx::Sqlite>,
{
    let row: Option<(Option<String>,)> = sqlx::query_as(
        "SELECT i.key_seed FROM membership m
         JOIN invite i ON i.id = m.joined_via_invite_id
         WHERE m.account_id = ? AND m.server_id = ? AND m.key_handoff_status = 'pending'",
    )
    .bind(account_id.to_string())
    .bind(server_id.to_string())
    .fetch_optional(executor)
    .await?;
    Ok(row.is_some_and(|(seed,)| seed.is_some_and(|value| !value.is_empty())))
}

pub async fn envelope_exists(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Path(server_id): Path<Uuid>,
) -> Result<Json<serde_json::Value>, ApiError> {
    require_member(&state.pool, account.id, server_id).await?;
    let exists = db::key_envelope::server_has_envelope(&state.pool, server_id).await?;
    Ok(Json(serde_json::json!({ "exists": exists })))
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
