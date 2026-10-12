use crate::common::{create_server_body, must_cookie, TestApp, CHANNEL_KEY_SEALED};
use axum::http::StatusCode;
use futures_util::StreamExt;
use serde_json::json;
use tokio_tungstenite::tungstenite::client::IntoClientRequest;

fn jwt_claims(token: &str) -> serde_json::Value {
    let payload = token.split('.').nth(1).unwrap();
    let mut padded = payload.replace('-', "+").replace('_', "/");
    while padded.len() % 4 != 0 {
        padded.push('=');
    }
    let decoded =
        base64::Engine::decode(&base64::engine::general_purpose::STANDARD, &padded).unwrap();
    serde_json::from_slice(&decoded).unwrap()
}

async fn voice_channel(app: &TestApp, cookie: &str, server_id: &str, name: &str) -> String {
    let (_, channel, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({
                "name": name,
                "type": "voice_video",
                "custody_ack": true,
                "channel_key_sealed": CHANNEL_KEY_SEALED,
            })),
            Some(cookie),
        )
        .await;
    channel["id"].as_str().unwrap().to_string()
}

#[tokio::test]
async fn popout_token_is_hidden_and_does_not_emit_grid_updated() {
    let app = TestApp::new().await;
    let (_, body, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let account_id = body["id"].as_str().unwrap().to_string();
    let (_, server, _) = app
        .request("POST", "/api/servers", Some(create_server_body("Mesa")), Some(&cookie))
        .await;
    let server_id = server["id"].as_str().unwrap();
    let channel_id = voice_channel(&app, &cookie, server_id, "mesa").await;
    let other_id = voice_channel(&app, &cookie, server_id, "outra").await;

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let router = app.router.clone();
    let server = tokio::spawn(async move { axum::serve(listener, router).await });
    let mut handshake = format!("ws://{address}/ws").into_client_request().unwrap();
    handshake
        .headers_mut()
        .insert("cookie", cookie.parse().unwrap());
    let (mut socket, _) = tokio_tungstenite::connect_async(handshake).await.unwrap();

    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/voice/join"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let joined = tokio::time::timeout(std::time::Duration::from_secs(2), async {
        loop {
            let message = socket.next().await.unwrap().unwrap();
            if message.to_string().contains("grid.updated") {
                break;
            }
        }
    })
    .await;
    assert!(joined.is_ok(), "join did not emit grid.updated");

    let (status, denied, _) = app
        .request(
            "POST",
            &format!("/api/channels/{other_id}/voice/popout-token"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{denied}");
    assert!(denied.get("token").is_none());

    let (status, granted, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/voice/popout-token"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{granted}");
    let claims = jwt_claims(granted["token"].as_str().unwrap());
    assert_eq!(claims["sub"], format!("{account_id}:popout"));
    assert_eq!(claims["video"]["hidden"], true);
    assert_eq!(claims["video"]["canPublish"], false);
    assert_eq!(claims["video"]["room"], channel_id);

    let extra = tokio::time::timeout(std::time::Duration::from_millis(400), async {
        loop {
            let message = socket.next().await.unwrap().unwrap();
            if message.to_string().contains("grid.updated") {
                break true;
            }
        }
    })
    .await;
    assert!(extra.is_err(), "popout-token emitted grid.updated");
    server.abort();
}
