use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    routing::{get, post},
    Json, Router,
};
use spike_token::{mint_jwt, validate_request, AppState, ErrorBody, TokenRequest, TokenResponse};
use std::{net::SocketAddr, sync::Arc};
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;

async fn health() -> Json<serde_json::Value> {
    Json(serde_json::json!({ "ok": true }))
}

/// Phone/LAN clients must not get ws://127.0.0.1 — that is the phone itself.
fn signaling_url(state: &AppState, headers: &HeaderMap) -> String {
    let host = headers
        .get("x-forwarded-host")
        .or_else(|| headers.get("host"))
        .and_then(|v| v.to_str().ok())
        .unwrap_or("");
    let hostname = host.split(':').next().unwrap_or("");
    if hostname.is_empty() || hostname == "127.0.0.1" || hostname == "localhost" {
        return state.ws_url.clone();
    }
    format!("ws://{hostname}:7880")
}

async fn issue_token(
    State(state): State<Arc<AppState>>,
    headers: HeaderMap,
    Json(req): Json<TokenRequest>,
) -> Result<Json<TokenResponse>, (StatusCode, Json<ErrorBody>)> {
    validate_request(&req).map_err(|error| {
        (
            StatusCode::BAD_REQUEST,
            Json(ErrorBody {
                error: error.into(),
            }),
        )
    })?;
    let jwt = mint_jwt(&state, &req).map_err(|error| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ErrorBody { error }),
        )
    })?;
    Ok(Json(TokenResponse {
        token: jwt,
        url: signaling_url(&state, &headers),
    }))
}

#[tokio::main]
async fn main() {
    let state = Arc::new(AppState {
        api_key: std::env::var("LIVEKIT_API_KEY").unwrap_or_else(|_| "spikekey".into()),
        api_secret: std::env::var("LIVEKIT_API_SECRET")
            .unwrap_or_else(|_| "spikesecretspikesecretspikesecret".into()),
        ws_url: std::env::var("LIVEKIT_WS_URL")
            .unwrap_or_else(|_| "ws://127.0.0.1:7880".into()),
    });
    let bind: SocketAddr = std::env::var("BIND")
        .unwrap_or_else(|_| "0.0.0.0:8080".into())
        .parse()
        .expect("BIND must be host:port");

    let app = Router::new()
        .route("/health", get(health))
        .route("/token", post(issue_token))
        .layer(CorsLayer::permissive())
        .with_state(state);

    let listener = TcpListener::bind(bind).await.expect("bind");
    eprintln!("spike-token listening on {bind}");
    axum::serve(listener, app).await.expect("serve");
}
