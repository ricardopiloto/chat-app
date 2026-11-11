pub mod api;
pub mod config;
pub mod db;
pub mod domain;
pub mod email_address;
pub mod email_sender;
pub mod email_templates;
pub mod error;
pub mod rate_limit;
pub mod security_headers;
pub mod token;
pub mod ws;

use crate::api::typing::TypingLimiter;
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
    pub typing: TypingLimiter,
    pub email_sender: Arc<dyn email_sender::EmailSender>,
}

pub fn router(state: AppState) -> Router {
    let header_state = state.clone();
    api::router(state).layer(axum::middleware::from_fn_with_state(
        header_state,
        security_headers::attach,
    ))
}

pub async fn build_state(
    config: Config,
) -> Result<AppState, Box<dyn std::error::Error + Send + Sync>> {
    config.validate().map_err(std::io::Error::other)?;
    tokio::fs::create_dir_all(&config.attachments_dir).await?;
    tokio::fs::create_dir_all(&config.avatars_dir).await?;
    tokio::fs::create_dir_all(&config.camera_backgrounds_dir).await?;
    tokio::fs::create_dir_all(config.avatars_dir.join("servers")).await?;
    let pool = db::bootstrap(&config).await?;
    let email_sender: Arc<dyn email_sender::EmailSender> = if config.email_api_key.is_empty() {
        Arc::new(email_sender::LogSender {
            file: config.email_log_file.clone(),
        })
    } else {
        Arc::new(email_sender::ResendSender::new(
            config.email_api_key.clone(),
            config.email_from.clone().unwrap_or_default(),
            "https://api.resend.com".into(),
        ))
    };
    Ok(AppState {
        pool,
        config: Arc::new(config),
        ws: WsHub::new(),
        rate_limiter: Arc::new(RateLimiter::new()),
        typing: TypingLimiter::default(),
        email_sender,
    })
}
