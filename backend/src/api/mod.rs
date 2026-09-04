use crate::api::auth::session::OptionalAuth;
use crate::ws;
use crate::AppState;
use axum::extract::ws::{Message, WebSocket};
use axum::extract::{State, WebSocketUpgrade};
use axum::response::IntoResponse;
use axum::routing::{get, post};
use axum::Router;
use futures_util::{SinkExt, StreamExt};

pub mod auth;
pub mod channels;
pub mod grid;
pub mod invites;
pub mod key_envelopes;
pub mod messages;
pub mod servers;
pub mod voice;

pub fn router(state: AppState) -> axum::Router {
    Router::new()
        .route("/health", get(health))
        .route("/ws", get(ws_handler))
        .nest(
            "/api",
            Router::new()
                .merge(auth::router())
                .route("/servers", post(servers::create_server).get(servers::list_servers))
                .route(
                    "/servers/{server_id}/channels",
                    post(channels::create_channel).get(channels::list_channels),
                )
                .route(
                    "/servers/{server_id}/invites",
                    post(invites::create_invite).get(invites::list_invites),
                )
                .route("/invites/{code}", get(invites::preview_invite))
                .route("/invites/{code}/revoke", post(invites::revoke_invite))
                .route("/invites/{code}/accept", post(invites::accept_invite))
                .route(
                    "/channels/{channel_id}/messages",
                    get(messages::list_messages).post(messages::post_message),
                )
                .route("/channels/{channel_id}", get(channels::get_channel))
                .route("/channels/{channel_id}/voice/join", post(voice::join))
                .route(
                    "/channels/{channel_id}/grid",
                    get(grid::get_grid).put(grid::put_grid),
                )
                .route(
                    "/servers/{server_id}/key-envelopes",
                    post(key_envelopes::post_envelope),
                )
                .route(
                    "/servers/{server_id}/key-envelopes/me",
                    get(key_envelopes::get_my_envelope),
                ),
        )
        .with_state(state)
}

async fn health() -> axum::Json<serde_json::Value> {
    axum::Json(serde_json::json!({ "ok": true }))
}

async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    OptionalAuth(user): OptionalAuth,
) -> Result<impl IntoResponse, crate::error::ApiError> {
    let account = user.ok_or_else(crate::error::ApiError::unauthorized)?;
    Ok(ws.on_upgrade(move |socket| handle_socket(state, account.id, socket)))
}

async fn handle_socket(state: AppState, account_id: uuid::Uuid, socket: WebSocket) {
    let mut rx = state.ws.subscribe(account_id);
    ws::replay_pending_handoffs(&state, account_id).await;
    let (mut sender, mut receiver) = socket.split();
    let send_task = tokio::spawn(async move {
        while let Some(msg) = rx.recv().await {
            if sender.send(Message::Text(msg.into())).await.is_err() {
                break;
            }
        }
    });
    while let Some(Ok(msg)) = receiver.next().await {
        match msg {
            Message::Text(t) if t == "ping" => {}
            Message::Close(_) => break,
            _ => {}
        }
    }
    send_task.abort();
    state.ws.unsubscribe(account_id, false);
}
