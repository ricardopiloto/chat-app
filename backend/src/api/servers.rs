use crate::api::auth::session::AuthUser;
use crate::db;
use crate::domain::membership::{KeyHandoffStatus, Membership};
use crate::domain::server::Server;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::State;
use axum::http::StatusCode;
use axum::response::IntoResponse;
use axum::Json;
use chrono::Utc;
use serde::Deserialize;
use uuid::Uuid;

#[derive(Debug, Deserialize)]
pub struct CreateServerBody {
    pub name: String,
}

pub async fn create_server(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
    Json(body): Json<CreateServerBody>,
) -> Result<impl IntoResponse, ApiError> {
    let name = body.name.trim().to_string();
    if name.is_empty() {
        return Err(ApiError::bad_request("name required"));
    }
    let server = Server {
        id: Uuid::new_v4(),
        name,
        owner_account_id: account.id,
    };
    db::server::create(&state.pool, &server).await?;
    db::membership::create(
        &state.pool,
        &Membership {
            account_id: account.id,
            server_id: server.id,
            joined_at: Utc::now(),
            joined_via_invite_id: None,
            key_handoff_status: KeyHandoffStatus::Synced,
        },
    )
    .await?;
    Ok((StatusCode::CREATED, Json(server)))
}

pub async fn list_servers(
    State(state): State<AppState>,
    AuthUser(account): AuthUser,
) -> Result<Json<Vec<Server>>, ApiError> {
    Ok(Json(
        db::server::list_for_account(&state.pool, account.id).await?,
    ))
}
