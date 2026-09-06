use crate::common::{must_cookie, TestApp, CHANNEL_KEY_SEALED};
use axum::http::StatusCode;
use serde_json::json;

#[tokio::test]
async fn owner_can_upsert_own_envelope() {
    let app = TestApp::new().await;
    let (_, alice_body, cookie) = app.register("alice_env", "password1", None).await;
    let cookie = must_cookie(cookie);
    let alice_id = alice_body["id"].as_str().unwrap();
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/key-envelopes"),
            Some(json!({ "account_id": alice_id, "sealed_key": CHANNEL_KEY_SEALED })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
}

#[tokio::test]
async fn owner_cannot_overwrite_synced_member_envelope() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice_env2", "password1", None).await;
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
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&alice),
        )
        .await;
    let code = inv["code"].as_str().unwrap();
    let (_, bob_body, _) = app.register("bob_env2", "password1", Some(code)).await;
    let bob_id = bob_body["id"].as_str().unwrap();
    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/key-envelopes"),
            Some(json!({ "account_id": bob_id, "sealed_key": CHANNEL_KEY_SEALED })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/key-envelopes"),
            Some(json!({ "account_id": bob_id, "sealed_key": CHANNEL_KEY_SEALED })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{body}");
}
