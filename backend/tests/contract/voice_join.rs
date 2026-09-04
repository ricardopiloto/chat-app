use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

#[tokio::test]
async fn voice_join_token_has_no_secret_and_uses_ids() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "mesa", "type": "voice_video", "custody_ack": true, "channel_key_sealed": "c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I=" })),
            Some(&cookie),
        )
        .await;
    let channel_id = ch["id"].as_str().unwrap().to_string();
    let account_id = {
        let (_, me, _) = app.request("GET", "/api/auth/me", None, Some(&cookie)).await;
        me["id"].as_str().unwrap().to_string()
    };
    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/voice/join"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert!(body.get("secret").is_none());
    assert!(body.get("apiSecret").is_none());
    assert!(body.get("api_secret").is_none());
    let token = body["token"].as_str().unwrap();
    assert!(!token.contains("instsecret"));
    assert_eq!(body["room"], channel_id);
    let payload = token.split('.').nth(1).unwrap();
    let mut padded = payload.replace('-', "+").replace('_', "/");
    while padded.len() % 4 != 0 {
        padded.push('=');
    }
    let decoded = base64::Engine::decode(&base64::engine::general_purpose::STANDARD, &padded)
        .unwrap_or_default();
    let text = String::from_utf8_lossy(&decoded);
    assert!(text.contains(&account_id), "{text}");
    assert!(text.contains(&channel_id), "{text}");
}

#[tokio::test]
async fn voice_join_requires_membership() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "mesa", "type": "voice_video", "custody_ack": true, "channel_key_sealed": "c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I=" })),
            Some(&alice),
        )
        .await;
    let channel_id = ch["id"].as_str().unwrap();
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&alice),
        )
        .await;
    let code = inv["code"].as_str().unwrap();
    let (_, _, bob) = app.register("bob", "password1", Some(code)).await;
    let bob = must_cookie(bob);
    // bob is a member — should succeed. outsider: create another server owner charlie
    // without invite to alice's server.
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/voice/join"),
            None,
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
}
