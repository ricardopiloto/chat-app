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

#[tokio::test]
async fn own_envelope_is_idempotent_and_a_different_key_conflicts() {
    let app = TestApp::new().await;
    let (_, alice_body, cookie) = app.register("alice_guard", "password1", None).await;
    let cookie = must_cookie(cookie);
    let alice_id = alice_body["id"].as_str().unwrap();
    let (_, server, _) = app.request("POST", "/api/servers", Some(crate::common::create_server_body("Mesa")), Some(&cookie)).await;
    let server_id = server["id"].as_str().unwrap();
    let path = format!("/api/servers/{server_id}/key-envelopes");
    let (status, missing, _) = app.request("GET", &format!("{path}/exists"), None, Some(&cookie)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(missing["exists"], false);
    let mut socket = app.state.ws.subscribe(uuid::Uuid::parse_str(alice_id).unwrap(), uuid::Uuid::new_v4());
    let first = json!({ "account_id": alice_id, "sealed_key": CHANNEL_KEY_SEALED });
    let (status, _, _) = app.request("POST", &path, Some(first.clone()), Some(&cookie)).await;
    assert_eq!(status, StatusCode::CREATED);
    let completed = socket.messages.try_recv().unwrap();
    assert!(completed.contains("key_handoff.completed"), "{completed}");
    let (status, exists, _) = app.request("GET", &format!("{path}/exists"), None, Some(&cookie)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(exists["exists"], true);
    let (status, _, _) = app.request("POST", &path, Some(first), Some(&cookie)).await;
    assert_eq!(status, StatusCode::CREATED);
    assert!(socket.messages.try_recv().is_err());
    let (status, _, _) = app.request(
        "POST",
        &path,
        Some(json!({ "account_id": alice_id, "sealed_key": "bm90LXRoZS1zYW1lLWtleS1ibG9i" })),
        Some(&cookie),
    ).await;
    assert_eq!(status, StatusCode::CONFLICT);
}

#[tokio::test]
async fn two_devices_cannot_create_two_server_keys() {
    let app = TestApp::new().await;
    let (_, alice_body, cookie) = app.register("alice_race", "password1", None).await;
    let cookie = must_cookie(cookie);
    let alice_id = alice_body["id"].as_str().unwrap();
    let (_, server, _) = app.request("POST", "/api/servers", Some(crate::common::create_server_body("Mesa")), Some(&cookie)).await;
    let path = format!("/api/servers/{}/key-envelopes", server["id"].as_str().unwrap());
    let one = app.request("POST", &path, Some(json!({ "account_id": alice_id, "sealed_key": CHANNEL_KEY_SEALED })), Some(&cookie));
    let two = app.request("POST", &path, Some(json!({ "account_id": alice_id, "sealed_key": "bm90LXRoZS1zYW1lLWtleS1ibG9i" })), Some(&cookie));
    let ((left, _, _), (right, _, _)) = tokio::join!(one, two);
    let statuses = [left, right];
    assert_eq!(statuses.iter().filter(|status| **status == StatusCode::CREATED).count(), 1);
    assert_eq!(statuses.iter().filter(|status| **status == StatusCode::CONFLICT).count(), 1);
    let (n,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM key_envelope WHERE server_id = ?")
        .bind(server["id"].as_str().unwrap()).fetch_one(&app.pool).await.unwrap();
    assert_eq!(n, 1);
}
