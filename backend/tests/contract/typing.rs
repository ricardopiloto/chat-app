use std::time::Duration;

use crate::common::{create_server_body, TestApp};
use axum::http::StatusCode;
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use tokio_tungstenite::tungstenite::client::IntoClientRequest;
use tokio_tungstenite::tungstenite::Message;

fn bearer(token: &str) -> String {
    format!("Bearer {token}")
}

struct People {
    alice_token: String,
    alice_id: String,
    bob_token: String,
    bob_id: String,
    server_id: String,
    channel_a: String,
    channel_b: String,
}

async fn people(app: &TestApp) -> People {
    let (status, alice, _) = app.register("typ_alice", "password1", None).await;
    assert_eq!(status, StatusCode::CREATED, "{alice}");
    let alice_token = alice["session_token"].as_str().unwrap().to_string();
    let alice_id = alice["id"].as_str().unwrap().to_string();
    let auth = bearer(&alice_token);
    let (status, server, _) = app
        .request_with(
            "POST",
            "/api/servers",
            Some(create_server_body("Mesa")),
            None,
            &[("authorization", &auth)],
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{server}");
    let server_id = server["id"].as_str().unwrap().to_string();
    let channel_a = text_channel(app, &auth, &server_id, "geral").await;
    let channel_b = text_channel(app, &auth, &server_id, "outro").await;
    let (status, invite, _) = app
        .request_with(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            None,
            &[("authorization", &auth)],
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{invite}");
    let (status, bob, _) = app
        .register("typ_bob", "password1", Some(invite["code"].as_str().unwrap()))
        .await;
    assert_eq!(status, StatusCode::CREATED, "{bob}");
    People {
        alice_token,
        alice_id,
        bob_token: bob["session_token"].as_str().unwrap().to_string(),
        bob_id: bob["id"].as_str().unwrap().to_string(),
        server_id,
        channel_a,
        channel_b,
    }
}

async fn text_channel(app: &TestApp, auth: &str, server_id: &str, name: &str) -> String {
    let (status, channel, _) = app
        .request_with(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": name, "type": "text" })),
            None,
            &[("authorization", auth)],
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{channel}");
    channel["id"].as_str().unwrap().to_string()
}

async fn serve(app: &TestApp) -> (String, tokio::task::JoinHandle<()>) {
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap().to_string();
    let router = app.router.clone();
    let server = tokio::spawn(async move { axum::serve(listener, router).await.unwrap() });
    (address, server)
}

async fn connect(address: &str, token: &str) -> tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>> {
    let mut request = format!("ws://{address}/ws").into_client_request().unwrap();
    request.headers_mut().insert("authorization", bearer(token).parse().unwrap());
    let (socket, _) = tokio_tungstenite::connect_async(request).await.unwrap();
    socket
}

async fn wait_typing(socket: &mut tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>, wait: Duration) -> Option<Value> {
    let deadline = tokio::time::Instant::now() + wait;
    while tokio::time::Instant::now() < deadline {
        let left = deadline.saturating_duration_since(tokio::time::Instant::now());
        let Ok(Some(Ok(message))) = tokio::time::timeout(left, socket.next()).await else {
            break;
        };
        let Message::Text(text) = message else { continue };
        let Ok(value) = serde_json::from_str::<Value>(&text.to_string()) else { continue };
        if value["event"] == "typing.updated" {
            return Some(value);
        }
    }
    None
}

async fn drain(socket: &mut tokio_tungstenite::WebSocketStream<tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>>, quiet: Duration) {
    loop {
        match tokio::time::timeout(quiet, socket.next()).await {
            Ok(Some(Ok(_))) => continue,
            _ => break,
        }
    }
}

fn frame(channel_id: &str, active: bool) -> String {
    json!({ "type": "typing", "channel_id": channel_id, "active": active }).to_string()
}

#[tokio::test]
async fn typing_reaches_readers_of_that_channel_only() {
    let app = TestApp::new().await;
    let people = people(&app).await;
    let (address, server) = serve(&app).await;
    let mut alice = connect(&address, &people.alice_token).await;
    let mut bob = connect(&address, &people.bob_token).await;

    alice.send(Message::Text(frame(&people.channel_a, true).into())).await.unwrap();
    let event = wait_typing(&mut bob, Duration::from_secs(2)).await.expect("bob sees channel A");
    assert_eq!(event["payload"]["channel_id"], people.channel_a);
    assert_eq!(event["payload"]["account_id"], people.alice_id);
    assert_eq!(event["payload"]["active"], true);
    assert!(event["payload"].get("text").is_none());

    alice.send(Message::Text(frame(&people.channel_b, true).into())).await.unwrap();
    let event = wait_typing(&mut bob, Duration::from_secs(2)).await.expect("bob sees channel B");
    assert_eq!(event["payload"]["channel_id"], people.channel_b);

    let auth = bearer(&people.alice_token);
    let (status, role, _) = app
        .request_with(
            "POST",
            &format!("/api/servers/{}/roles", people.server_id),
            Some(json!({ "name": "Jogador", "capabilities": { "can_send_messages": true, "can_view_channels": true } })),
            None,
            &[("authorization", &auth)],
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role}");
    let role_id = role["id"].as_str().unwrap();
    let (status, _, _) = app
        .request_with(
            "PUT",
            &format!("/api/servers/{}/members/{}/role", people.server_id, people.bob_id),
            Some(json!({ "role_id": role_id })),
            None,
            &[("authorization", &auth)],
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (status, private, _) = app
        .request_with(
            "POST",
            &format!("/api/servers/{}/channels", people.server_id),
            Some(json!({ "name": "segredo", "type": "text", "visibility": "private" })),
            None,
            &[("authorization", &auth)],
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{private}");
    let private_id = private["id"].as_str().unwrap();
    let (status, _, _) = app
        .request_with(
            "PUT",
            &format!("/api/channels/{private_id}/acl"),
            Some(json!([{ "subject_type": "role", "subject_id": role_id, "level": "read", "effect": "deny" }])),
            None,
            &[("authorization", &auth)],
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    alice.send(Message::Text(frame(private_id, true).into())).await.unwrap();
    assert!(wait_typing(&mut bob, Duration::from_millis(400)).await.is_none(), "bob cannot read the private channel");

    alice.send(Message::Text(json!({ "type": "typing", "channel_id": people.channel_a, "active": true, "account_id": people.bob_id }).to_string().into())).await.unwrap();
    assert!(wait_typing(&mut bob, Duration::from_millis(400)).await.is_none(), "a supplied account id is not accepted");
    server.abort();
}

#[tokio::test]
async fn typing_ignores_invalid_frames_and_blocked_accounts() {
    let app = TestApp::new().await;
    let people = people(&app).await;
    let (address, server) = serve(&app).await;
    let mut alice = connect(&address, &people.alice_token).await;
    let mut bob = connect(&address, &people.bob_token).await;
    let auth = bearer(&people.alice_token);

    alice.send(Message::Text("ping".into())).await.unwrap();
    alice.send(Message::Text("not-json".into())).await.unwrap();
    alice.send(Message::Text(format!("{{{} \"type\":\"typing\"}}", "x".repeat(600)).into())).await.unwrap();
    alice.send(Message::Text(json!({ "type": "typing", "channel_id": people.channel_a, "active": true, "text": "segredo" }).to_string().into())).await.unwrap();
    let (status, voice, _) = app
        .request_with(
            "POST",
            &format!("/api/servers/{}/channels", people.server_id),
            Some(json!({ "name": "mesa", "type": "voice_video", "custody_ack": true, "channel_key_sealed": "c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I=" })),
            None,
            &[("authorization", &auth)],
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{voice}");
    alice.send(Message::Text(frame(voice["id"].as_str().unwrap(), true).into())).await.unwrap();
    assert!(wait_typing(&mut bob, Duration::from_millis(400)).await.is_none());

    alice.send(Message::Text(frame(&people.channel_a, true).into())).await.unwrap();
    alice.send(Message::Text(frame(&people.channel_a, true).into())).await.unwrap();
    let first = wait_typing(&mut bob, Duration::from_secs(2)).await.expect("first start");
    assert_eq!(first["payload"]["active"], true);
    assert!(wait_typing(&mut bob, Duration::from_millis(300)).await.is_none(), "a second start inside the gap is dropped");

    alice.send(Message::Text(frame(&people.channel_a, false).into())).await.unwrap();
    let stop = wait_typing(&mut bob, Duration::from_secs(2)).await.expect("stop follows a start");
    assert_eq!(stop["payload"]["active"], false);
    assert_eq!(stop["payload"]["account_id"], people.alice_id);

    drain(&mut alice, Duration::from_millis(150)).await;
    let (status, _, _) = app
        .request_with(
            "PUT",
            &format!("/api/channels/{}/mutes/{}", people.channel_a, people.bob_id),
            Some(json!({ "duration_minutes": 5 })),
            None,
            &[("authorization", &auth)],
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    bob.send(Message::Text(frame(&people.channel_a, true).into())).await.unwrap();
    assert!(wait_typing(&mut alice, Duration::from_millis(400)).await.is_none(), "a muted member does not announce typing");

    let (status, quiet, _) = app
        .request_with(
            "POST",
            &format!("/api/servers/{}/roles", people.server_id),
            Some(json!({ "name": "Leitor", "capabilities": { "can_send_messages": false, "can_view_channels": true } })),
            None,
            &[("authorization", &auth)],
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{quiet}");
    let (status, _, _) = app
        .request_with(
            "DELETE",
            &format!("/api/channels/{}/mutes/{}", people.channel_a, people.bob_id),
            None,
            None,
            &[("authorization", &auth)],
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, _, _) = app
        .request_with(
            "PUT",
            &format!("/api/servers/{}/members/{}/role", people.server_id, people.bob_id),
            Some(json!({ "role_id": quiet["id"] })),
            None,
            &[("authorization", &auth)],
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    bob.send(Message::Text(frame(&people.channel_b, true).into())).await.unwrap();
    assert!(wait_typing(&mut alice, Duration::from_millis(400)).await.is_none(), "without write permission there is no event");
    server.abort();
}
