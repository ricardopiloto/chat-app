use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use base64::Engine;
use serde_json::json;

fn b64(data: &str) -> String {
    base64::engine::general_purpose::STANDARD.encode(data.as_bytes())
}

async fn two_members(app: &TestApp, include_history: bool) -> (String, String, String) {
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(json!({ "name": "Mesa" })),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap().to_string();
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "geral", "type": "text" })),
            Some(&alice),
        )
        .await;
    let channel_id = ch["id"].as_str().unwrap().to_string();
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "include_history": include_history })),
            Some(&alice),
        )
        .await;
    let code = inv["code"].as_str().unwrap().to_string();
    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/messages"),
        Some(json!({ "content_ciphertext": b64("secret-hello") })),
        Some(&alice),
    )
    .await;
    let (_, _, bob) = app.register("bob", "password1", Some(&code)).await;
    (alice, must_cookie(bob), channel_id)
}

#[tokio::test]
async fn history_hidden_when_invite_excludes_it() {
    let app = TestApp::new().await;
    let (_alice, bob, channel_id) = two_members(&app, false).await;
    let (status, list, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/messages"),
            None,
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{list}");
    assert!(list.as_array().unwrap().is_empty());
}

#[tokio::test]
async fn history_visible_when_invite_includes_it() {
    let app = TestApp::new().await;
    let (_alice, bob, channel_id) = two_members(&app, true).await;
    let (status, list, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/messages"),
            None,
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{list}");
    assert_eq!(list.as_array().unwrap().len(), 1);
}
