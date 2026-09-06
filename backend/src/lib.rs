pub mod api;
pub mod config;
pub mod db;
pub mod domain;
pub mod error;
pub mod rate_limit;
pub mod security_headers;
pub mod token;
pub mod ws;

use crate::config::Config;
use crate::rate_limit::RateLimiter;
use crate::ws::WsHub;
use axum::Router;
use sqlx::SqlitePool;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    pub config: Arc<Config>,
    pub ws: WsHub,
    pub rate_limiter: Arc<RateLimiter>,
}

pub fn router(state: AppState) -> Router {
    let header_state = state.clone();
    api::router(state).layer(axum::middleware::from_fn_with_state(
        header_state,
        security_headers::attach,
    ))
}

pub async fn build_state(config: Config) -> Result<AppState, Box<dyn std::error::Error + Send + Sync>> {
    tokio::fs::create_dir_all(&config.attachments_dir).await?;
    tokio::fs::create_dir_all(&config.avatars_dir).await?;
    tokio::fs::create_dir_all(config.avatars_dir.join("servers")).await?;
    let pool = db::bootstrap(&config).await?;
    Ok(AppState {
        pool,
        config: Arc::new(config),
        ws: WsHub::new(),
        rate_limiter: Arc::new(RateLimiter::new()),
    })
}
