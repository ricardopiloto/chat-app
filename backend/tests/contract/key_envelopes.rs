use crate::common::{must_cookie, TestApp, CHANNEL_KEY_SEALED};
use base64::Engine;
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

fn seed_blob() -> String {
    base64::engine::general_purpose::STANDARD.encode([7u8; 32])
}

async fn server_with_owner_envelope(app: &TestApp) -> (String, String, String) {
    let (_, alice_body, cookie) = app.register("alice_seed", "password1", None).await;
    let cookie = must_cookie(cookie);
    let alice_id = alice_body["id"].as_str().unwrap().to_string();
    let (_, server, _) = app
        .request("POST", "/api/servers", Some(crate::common::create_server_body("Mesa")), Some(&cookie))
        .await;
    let server_id = server["id"].as_str().unwrap().to_string();
    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/key-envelopes"),
            Some(json!({ "account_id": alice_id, "sealed_key": CHANNEL_KEY_SEALED })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    (cookie, server_id, alice_id)
}

async fn invite(app: &TestApp, cookie: &str, server_id: &str, seed: Option<&str>) -> String {
    let body = match seed {
        Some(value) => json!({ "key_seed": value, "expires_in_seconds": 600 }),
        None => json!({ "expires_in_seconds": 600 }),
    };
    let (status, inv, _) = app
        .request("POST", &format!("/api/servers/{server_id}/invites"), Some(body), Some(cookie))
        .await;
    assert_eq!(status, StatusCode::CREATED, "{inv}");
    inv["code"].as_str().unwrap().to_string()
}

#[tokio::test]
async fn pending_member_with_seed_can_publish_own_envelope() {
    let app = TestApp::new().await;
    let (cookie, server_id, _) = server_with_owner_envelope(&app).await;
    let code = invite(&app, &cookie, &server_id, Some(&seed_blob())).await;
    let (status, joined, bob) = app
        .request(
            "POST",
            &format!("/api/invites/{code}/accept"),
            Some(json!({ "handle": "bob_env", "password": "password1", "identity_pubkey": crate::common::PUBKEY })),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{joined}");
    let bob = must_cookie(bob);
    let bob_id = joined["account_id"].as_str().unwrap();
    let path = format!("/api/servers/{server_id}/key-envelopes");
    let (status, body, _) = app
        .request(
            "POST",
            &path,
            Some(json!({ "account_id": bob_id, "sealed_key": "c2VlZC1lbnZlbG9wZS1ibG9iLW9r" })),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    let (status, body, _) = app
        .request(
            "POST",
            &path,
            Some(json!({ "account_id": bob_id, "sealed_key": "c2VlZC1lbnZlbG9wZS1vdGhlcg==" })),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::CONFLICT, "{body}");
}

#[tokio::test]
async fn pending_member_without_seed_cannot_publish_over_existing_key() {
    let app = TestApp::new().await;
    let (cookie, server_id, _) = server_with_owner_envelope(&app).await;
    let code = invite(&app, &cookie, &server_id, None).await;
    let (status, joined, bob) = app
        .request(
            "POST",
            &format!("/api/invites/{code}/accept"),
            Some(json!({ "handle": "bob_noseed", "password": "password1", "identity_pubkey": crate::common::PUBKEY })),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{joined}");
    let bob = must_cookie(bob);
    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/key-envelopes"),
            Some(json!({ "account_id": joined["account_id"], "sealed_key": "c2VlZC1lbnZlbG9wZS1ibG9iLW9r" })),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::CONFLICT, "{body}");
}

#[tokio::test]
async fn revoked_seed_invite_still_allows_the_accepted_member_to_publish() {
    let app = TestApp::new().await;
    let (cookie, server_id, _) = server_with_owner_envelope(&app).await;
    let code = invite(&app, &cookie, &server_id, Some(&seed_blob())).await;
    let (status, joined, bob) = app
        .request(
            "POST",
            &format!("/api/invites/{code}/accept"),
            Some(json!({ "handle": "bob_revoked", "password": "password1", "identity_pubkey": crate::common::PUBKEY })),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{joined}");
    let (status, _, _) = app
        .request("POST", &format!("/api/invites/{code}/revoke"), None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/invites/{code}/accept"),
            Some(json!({ "handle": "late", "password": "password1", "identity_pubkey": crate::common::PUBKEY })),
            None,
        )
        .await;
    assert!(status == StatusCode::GONE || status == StatusCode::NOT_FOUND);
    let bob = must_cookie(bob);
    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/key-envelopes"),
            Some(json!({ "account_id": joined["account_id"], "sealed_key": "c2VlZC1lbnZlbG9wZS1ibG9iLW9r" })),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
}

#[tokio::test]
async fn connecting_member_receives_every_pending_handoff() {
    use futures_util::StreamExt;
    use tokio_tungstenite::tungstenite::client::IntoClientRequest;
    let app = TestApp::new().await;
    let (cookie, server_id, _) = server_with_owner_envelope(&app).await;
    for index in 0..3 {
        let id = uuid::Uuid::new_v4();
        sqlx::query("INSERT INTO account (id, handle, password_hash, identity_pubkey, created_at) VALUES (?, ?, 'unused', X'01', '2026-10-08T00:00:00Z')")
            .bind(id.to_string())
            .bind(format!("pending{index}"))
            .execute(&app.pool)
            .await
            .unwrap();
        sqlx::query("INSERT INTO membership (account_id, server_id, joined_at, key_handoff_status) VALUES (?, ?, '2026-10-08T00:00:00Z', 'pending')")
            .bind(id.to_string())
            .bind(&server_id)
            .execute(&app.pool)
            .await
            .unwrap();
    }
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let router = app.router.clone();
    let server = tokio::spawn(async move { axum::serve(listener, router).await });
    let mut request = format!("ws://{address}/ws").into_client_request().unwrap();
    request.headers_mut().insert("cookie", cookie.parse().unwrap());
    let (mut socket, _) = tokio_tungstenite::connect_async(request).await.unwrap();
    let mut requested = 0;
    let done = tokio::time::timeout(std::time::Duration::from_secs(3), async {
        while let Some(message) = socket.next().await {
            if message.unwrap().to_text().unwrap_or("").contains("key_handoff.requested") {
                requested += 1;
                if requested == 3 {
                    break;
                }
            }
        }
    })
    .await;
    assert!(done.is_ok(), "timed out with {requested} handoff requests");
    assert_eq!(requested, 3);
    server.abort();
}
