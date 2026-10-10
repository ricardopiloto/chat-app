use crate::api::auth::session::OptionalAuth;
use crate::domain::avatar::MAX_AVATAR_BYTES;
use crate::ws;
use crate::{db, AppState};
use axum::extract::ws::{Message, WebSocket};
use axum::extract::{DefaultBodyLimit, State, WebSocketUpgrade};
use axum::http::{HeaderMap, HeaderValue};
use axum::response::IntoResponse;
use axum::routing::{delete, get, patch, post, put};
use axum::Router;
use axum_extra::extract::cookie::CookieJar;
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
pub mod welcome;

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
                    "/servers/{server_id}/welcome",
                    get(servers::get_welcome).patch(servers::patch_welcome),
                )
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
                .route("/servers/{server_id}/presence", get(roles::get_presence))
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
                .route(
                    "/invites/{code}/handle-available",
                    get(invites::handle_available),
                )
                .route("/invites/{code}/revoke", post(invites::revoke_invite))
                .route("/invites/{code}/accept", post(invites::accept_invite))
                .route(
                    "/channels/{channel_id}/messages",
                    get(messages::list_messages).post(messages::post_message),
                )
                .route("/channels/{channel_id}/mutes/me", get(mute::get_my_mute))
                .route("/channels/{channel_id}/mutes", get(mute::list_mutes))
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
                    "/channels/{channel_id}/messages/{message_id}/reactions",
                    post(messages::add_reaction),
                )
                .route(
                    "/channels/{channel_id}/messages/{message_id}/reactions/{emoji_code}",
                    delete(messages::remove_reaction),
                )
                .route("/notifications", get(notifications::list_notifications))
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
                    "/channels/{channel_id}/voice/channel-key",
                    get(voice::channel_key),
                )
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
                )
                .route(
                    "/servers/{server_id}/key-envelopes/exists",
                    get(key_envelopes::envelope_exists),
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
    jar: CookieJar,
    headers: HeaderMap,
) -> Result<impl IntoResponse, crate::error::ApiError> {
    let account = user.ok_or_else(crate::error::ApiError::unauthorized)?;
    let session_id = auth::session::current_session_id(&state, &jar, &headers)
        .await?
        .ok_or_else(crate::error::ApiError::unauthorized)?;
    // Chromium and handshake clients fail the upgrade when the request offered a
    // subprotocol and the 101 does not select one. Echo the first offered name so
    // the socket opens; the session is still chosen by cookie, then bearer, then
    // the protocol value — not by which name is echoed.
    let offered = auth::session::subprotocol_tokens(&headers);
    let mut response =
        ws.on_upgrade(move |socket| handle_socket(state, account.id, session_id, socket));
    if let Some(protocol) = offered.first() {
        if let Ok(value) = HeaderValue::from_str(protocol) {
            response
                .headers_mut()
                .insert(axum::http::header::SEC_WEBSOCKET_PROTOCOL, value);
        }
    }
    Ok(response)
}

async fn handle_socket(
    state: AppState,
    account_id: uuid::Uuid,
    session_id: uuid::Uuid,
    mut socket: WebSocket,
) {
    let subscription = state.ws.subscribe(account_id, session_id);
    let session_valid = db::session::find_by_id(&state.pool, session_id)
        .await
        .ok()
        .flatten()
        .is_some_and(|session| {
            session.account_id == account_id && session.is_valid(chrono::Utc::now())
        });
    if !session_valid || *subscription.cancel.borrow() {
        state.ws.unsubscribe(account_id, subscription.id);
        let _ = socket.send(Message::Close(None)).await;
        return;
    }
    let mut rx = subscription.messages;
    let mut cancelled = subscription.cancel;
    ws::replay_pending_handoffs(&state, account_id).await;
    broadcast_presence_for_account(&state, account_id).await;
    let (mut sender, mut receiver) = socket.split();
    let mut send_cancelled = cancelled.clone();
    let send_task = tokio::spawn(async move {
        loop {
            tokio::select! {
                _ = send_cancelled.changed() => {
                    if *send_cancelled.borrow() {
                        let _ = sender.send(Message::Close(None)).await;
                        break;
                    }
                }
                msg = rx.recv() => {
                    let Some(msg) = msg else { break; };
                    if sender.send(Message::Text(msg.into())).await.is_err() { break; }
                }
            }
        }
    });
    let mut was_cancelled = false;
    loop {
        tokio::select! {
            _ = cancelled.changed() => {
                if *cancelled.borrow() { was_cancelled = true; break; }
            }
            msg = receiver.next() => {
                match msg {
                    Some(Ok(Message::Text(t))) if t == "ping" => {}
                    Some(Ok(Message::Close(_))) | None | Some(Err(_)) => break,
                    _ => {}
                }
            }
        }
    }
    state.ws.unsubscribe(account_id, subscription.id);
    if was_cancelled {
        let _ = send_task.await;
    } else {
        send_task.abort();
    }
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
