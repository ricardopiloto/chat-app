pub mod api;
pub mod config;
pub mod db;
pub mod domain;
pub mod error;
pub mod token;
pub mod ws;

use crate::config::Config;
use crate::ws::WsHub;
use axum::Router;
use sqlx::SqlitePool;
use std::sync::Arc;

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    pub config: Arc<Config>,
    pub ws: WsHub,
}

pub fn router(state: AppState) -> Router {
    api::router(state)
}

pub async fn build_state(config: Config) -> Result<AppState, Box<dyn std::error::Error + Send + Sync>> {
    tokio::fs::create_dir_all(&config.attachments_dir).await?;
    let pool = db::bootstrap(&config).await?;
    Ok(AppState {
        pool,
        config: Arc::new(config),
        ws: WsHub::new(),
    })
}
