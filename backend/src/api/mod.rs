use crate::api::auth::session::OptionalAuth;
use crate::domain::avatar::MAX_AVATAR_BYTES;
use crate::ws;
use crate::{db, AppState};
use axum::extract::ws::{Message, WebSocket};
use axum::extract::{DefaultBodyLimit, State, WebSocketUpgrade};
use axum::response::IntoResponse;
use axum::routing::{delete, get, patch, post, put};
use axum::Router;
use futures_util::{SinkExt, StreamExt};

pub mod attachments;
pub mod auth;
pub mod authz;
pub mod avatars;
pub mod channel_provision;
pub mod channel_roles;
pub mod channels;
pub mod grid;
pub mod invites;
pub mod key_envelopes;
pub mod messages;
pub mod mute;
pub mod notifications;
pub mod roles;
pub mod scenes;
pub mod servers;
pub mod unfurl;
pub mod voice;

pub fn router(state: AppState) -> axum::Router {
    Router::new()
        .route("/health", get(health))
        .route("/ws", get(ws_handler))
        .nest(
            "/api",
            Router::new()
                .merge(auth::router())
                .route(
                    "/accounts/{account_id}/avatar",
                    get(avatars::get_account_avatar),
                )
                .route(
                    "/servers/{server_id}/image",
                    get(avatars::get_server_image)
                        .put(avatars::put_server_image)
                        .delete(avatars::delete_server_image)
                        .layer(DefaultBodyLimit::max(MAX_AVATAR_BYTES + 64 * 1024)),
                )
                .route(
                    "/servers",
                    post(servers::create_server).get(servers::list_servers),
                )
                .route("/servers/{server_id}", delete(servers::delete_server))
                .route(
                    "/servers/{server_id}/roles",
                    get(roles::list_roles).post(roles::create_role),
                )
                .route(
                    "/servers/{server_id}/roles/positions",
                    put(roles::put_role_positions),
                )
                .route(
                    "/servers/{server_id}/roles/{role_id}",
                    patch(roles::patch_role).delete(roles::delete_role),
                )
                .route(
                    "/servers/{server_id}/roles/{role_id}/members",
                    put(roles::set_role_members),
                )
                .route(
                    "/servers/{server_id}/members/{account_id}/role",
                    put(roles::put_member_role),
                )
                .route(
                    "/servers/{server_id}/presence",
                    get(roles::get_presence),
                )
                .route(
                    "/servers/{server_id}/members/{account_id}",
                    delete(roles::delete_member),
                )
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
                .route(
                    "/channels/{channel_id}/mutes/me",
                    get(mute::get_my_mute),
                )
                .route(
                    "/channels/{channel_id}/mutes",
                    get(mute::list_mutes),
                )
                .route(
                    "/channels/{channel_id}/mutes/{account_id}",
                    put(mute::put_mute).delete(mute::delete_mute),
                )
                .route(
                    "/channels/{channel_id}/read",
                    put(messages::mark_channel_read),
                )
                .route(
                    "/channels/{channel_id}/messages/{message_id}",
                    delete(messages::delete_message),
                )
                .route(
                    "/notifications",
                    get(notifications::list_notifications),
                )
                .route(
                    "/notifications/read-all",
                    post(notifications::mark_all_notifications_read),
                )
                .route(
                    "/notifications/{notification_id}/read",
                    post(notifications::mark_notification_read),
                )
                .route(
                    "/channels/{channel_id}/attachments",
                    post(attachments::upload_attachment)
                        .layer(DefaultBodyLimit::max(5 * 1024 * 1024 + 64 * 1024)),
                )
                .route(
                    "/attachments/{attachment_id}",
                    get(attachments::get_attachment),
                )
                .route("/unfurl", post(unfurl::unfurl))
                .route(
                    "/channels/{channel_id}",
                    get(channels::get_channel)
                        .patch(channels::patch_channel)
                        .delete(channels::delete_channel),
                )
                .route(
                    "/channels/{channel_id}/acl",
                    get(channels::get_acl).put(channels::put_acl),
                )
                .route(
                    "/channels/{channel_id}/access/{account_id}",
                    get(channels::get_channel_access),
                )
                .route(
                    "/channels/{channel_id}/mentionables",
                    get(channels::list_mentionables),
                )
                .route("/channels/{channel_id}/voice/join", post(voice::join))
                .route("/channels/{channel_id}/voice/leave", post(voice::leave))
                .route(
                    "/channels/{channel_id}/voice/media",
                    patch(voice::patch_media),
                )
                .route(
                    "/servers/{server_id}/voice-occupancy",
                    get(voice::occupancy),
                )
                .route("/channels/{channel_id}/voice/e2ee", post(voice::set_e2ee))
                .route(
                    "/channels/{channel_id}/egress/start",
                    post(voice::egress_start),
                )
                .route(
                    "/channels/{channel_id}/egress/stop",
                    post(voice::egress_stop),
                )
                .route(
                    "/channels/{channel_id}/grid",
                    get(grid::get_grid).put(grid::put_grid),
                )
                .route(
                    "/channels/{channel_id}/scenes",
                    get(scenes::list_scenes).post(scenes::create_scene),
                )
                .route(
                    "/channels/{channel_id}/scenes/{scene_id}",
                    get(scenes::get_scene)
                        .patch(scenes::patch_scene)
                        .delete(scenes::delete_scene),
                )
                .route(
                    "/channels/{channel_id}/scenes/{scene_id}/duplicate",
                    post(scenes::duplicate_scene),
                )
                .route(
                    "/channels/{channel_id}/scenes/{scene_id}/activate",
                    post(scenes::activate_scene),
                )
                .route(
                    "/channels/{channel_id}/roles",
                    get(channel_roles::list_roles).put(channel_roles::put_roles),
                )
                .route(
                    "/servers/{server_id}/members",
                    get(channel_roles::list_members),
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
    broadcast_presence_for_account(&state, account_id).await;
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
    broadcast_presence_for_account(&state, account_id).await;
}

async fn broadcast_presence_for_account(state: &AppState, account_id: uuid::Uuid) {
    let Ok(server_ids) = db::membership::list_server_ids_for_account(&state.pool, account_id).await
    else {
        return;
    };
    for server_id in server_ids {
        let Ok(members) = db::membership::list_by_server(&state.pool, server_id).await else {
            continue;
        };
        let online: Vec<_> = members
            .iter()
            .map(|m| m.account_id)
            .filter(|id| state.ws.is_online(*id))
            .collect();
        state
            .ws
            .send_to_server_members(
                &state.pool,
                server_id,
                "presence",
                &serde_json::json!({ "online_account_ids": online }),
            )
            .await;
    }
}
