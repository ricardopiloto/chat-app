use crate::common::{must_cookie, TestApp, PUBKEY};
use axum::http::StatusCode;
use futures_util::StreamExt;
use tokio_tungstenite::tungstenite::client::IntoClientRequest;

#[tokio::test]
async fn login_wrong_password_unauthorized() {
    let app = TestApp::new().await;
    let (status, _, _) = app.register("alice", "password1", None).await;
    assert_eq!(status, StatusCode::CREATED);
    let (status, _, _) = app.login("alice", "wrongpass").await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn login_issues_cookie_and_me_works() {
    let app = TestApp::new().await;
    app.register("alice", "password1", None).await;
    let (status, body, cookie) = app.login("alice", "password1").await;
    assert_eq!(status, StatusCode::OK, "{body}");
    let cookie = must_cookie(cookie);
    let (status, me, _) = app.request("GET", "/api/auth/me", None, Some(&cookie)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(me["handle"], "alice");
}

#[tokio::test]
async fn identity_vault_roundtrip() {
    let app = TestApp::new().await;
    let vault = serde_json::json!({
        "v": 1,
        "publicKey": [1],
        "salt": [2],
        "iv": [3],
        "wrapped": [4]
    });
    let (status, body, cookie) = app
        .request(
            "POST",
            "/api/auth/register",
            Some(serde_json::json!({
                "handle": "alice",
                "password": "password1",
                "identity_pubkey": PUBKEY,
                "identity_vault": vault,
            })),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    assert_eq!(body["identity_vault"]["v"], 1);
    let cookie = must_cookie(cookie);
    let (status, _, _) = app
        .request("POST", "/api/auth/logout", None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, login, _) = app.login("alice", "password1").await;
    assert_eq!(status, StatusCode::OK, "{login}");
    assert_eq!(login["identity_vault"]["wrapped"][0], 4);
}

#[tokio::test]
async fn replace_identity_updates_vault_and_marks_handoff_pending() {
    let app = TestApp::new().await;
    let (_, _, alice_cookie) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice_cookie);
    let (status, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("mesa")),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{server}");
    let server_id = server["id"].as_str().unwrap();

    let new_pubkey = "QkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkI=";
    let vault = serde_json::json!({
        "v": 1,
        "publicKey": [9],
        "salt": [8],
        "iv": [7],
        "wrapped": [6]
    });
    let (status, body, _) = app
        .request(
            "PUT",
            "/api/auth/identity",
            Some(serde_json::json!({
                "identity_pubkey": new_pubkey,
                "identity_vault": vault,
            })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["identity_vault"]["wrapped"][0], 6);

    let (handoff,): (String,) = sqlx::query_as(
        "SELECT key_handoff_status FROM membership WHERE server_id = ?",
    )
    .bind(server_id)
    .fetch_one(&app.pool)
    .await
    .unwrap();
    assert_eq!(handoff, "pending");

    let (status, login, _) = app.login("alice", "password1").await;
    assert_eq!(status, StatusCode::OK, "{login}");
    assert_eq!(login["identity_vault"]["wrapped"][0], 6);
}

#[tokio::test]
async fn logout_revokes_session() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let (status, _, _) = app
        .request("POST", "/api/auth/logout", None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, _, _) = app.request("GET", "/api/auth/me", None, Some(&cookie)).await;
    assert_eq!(status, StatusCode::NO_CONTENT);
}

#[tokio::test]
async fn revoke_all_for_account_can_preserve_one_session_or_none() {
    let app = TestApp::new().await;
    let (_, _, first_cookie) = app.register("alice", "password1", None).await;
    let first_cookie = must_cookie(first_cookie);
    let (_, _, second_cookie) = app.login("alice", "password1").await;
    let second_cookie = must_cookie(second_cookie);
    let (status, me, _) = app.request("GET", "/api/auth/me", None, Some(&first_cookie)).await;
    assert_eq!(status, StatusCode::OK);
    let account_id = uuid::Uuid::parse_str(me["id"].as_str().unwrap()).unwrap();
    let token = second_cookie.split(';').next().unwrap().split_once('=').unwrap().1;
    let second_id = chat_backend::db::session::find_by_token_hash(
        &app.pool,
        &chat_backend::api::auth::session::hash_token(token),
    )
    .await
    .unwrap()
    .unwrap()
    .id;

    let revoked = chat_backend::db::session::revoke_all_for_account(
        &app.pool,
        account_id,
        Some(second_id),
    )
    .await
    .unwrap();
    assert_eq!(revoked.len(), 1);
    let (status, _, _) = app.request("PATCH", "/api/auth/display-name", Some(serde_json::json!({"display_name":"A"})), Some(&first_cookie)).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    let (status, _, _) = app.request("PATCH", "/api/auth/display-name", Some(serde_json::json!({"display_name":"A"})), Some(&second_cookie)).await;
    assert_eq!(status, StatusCode::OK);

    let revoked = chat_backend::db::session::revoke_all_for_account(&app.pool, account_id, None)
        .await
        .unwrap();
    assert_eq!(revoked, vec![second_id]);
    let (status, _, _) = app.request("PATCH", "/api/auth/display-name", Some(serde_json::json!({"display_name":"B"})), Some(&second_cookie)).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn revoked_websocket_closes_and_revoked_handshake_is_rejected() {
    let app = TestApp::new().await;
    let (_, _, first_cookie) = app.register("alice", "password1", None).await;
    let first_cookie = must_cookie(first_cookie);
    let (_, _, second_cookie) = app.login("alice", "password1").await;
    let second_cookie = must_cookie(second_cookie);
    let (_, me, _) = app.request("GET", "/api/auth/me", None, Some(&first_cookie)).await;
    let account_id = uuid::Uuid::parse_str(me["id"].as_str().unwrap()).unwrap();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let router = app.router.clone();
    let server = tokio::spawn(async move { axum::serve(listener, router).await });
    let connect = |cookie: &str| {
        let mut request = format!("ws://{address}/ws").into_client_request().unwrap();
        request.headers_mut().insert("cookie", cookie.parse().unwrap());
        request
    };
    let (mut first, _) = tokio_tungstenite::connect_async(connect(&first_cookie)).await.unwrap();
    let (mut second, _) = tokio_tungstenite::connect_async(connect(&second_cookie)).await.unwrap();
    let token = first_cookie.split(';').next().unwrap().split_once('=').unwrap().1;
    let first_id = chat_backend::db::session::find_by_token_hash(
        &app.pool,
        &chat_backend::api::auth::session::hash_token(token),
    ).await.unwrap().unwrap().id;
    let revoked = chat_backend::db::session::revoke_all_for_account(&app.pool, account_id, Some(
        chat_backend::db::session::find_by_token_hash(
            &app.pool,
            &chat_backend::api::auth::session::hash_token(second_cookie.split(';').next().unwrap().split_once('=').unwrap().1),
        ).await.unwrap().unwrap().id,
    )).await.unwrap();
    assert_eq!(revoked, vec![first_id]);
    app.state.ws.close_sessions(account_id, &revoked);
    let closed = tokio::time::timeout(std::time::Duration::from_secs(2), async {
        loop {
            match first.next().await {
                Some(Ok(tokio_tungstenite::tungstenite::Message::Close(_))) | None => break true,
                Some(Err(_)) => break true,
                _ => {}
            }
        }
    }).await.unwrap();
    assert!(closed);
    assert!(app.state.ws.is_online(account_id)); // second session survives
    let rejected = tokio_tungstenite::connect_async(connect(&first_cookie)).await;
    assert!(rejected.is_err());
    let second_id = chat_backend::db::session::find_by_token_hash(
        &app.pool,
        &chat_backend::api::auth::session::hash_token(second_cookie.split(';').next().unwrap().split_once('=').unwrap().1),
    ).await.unwrap().unwrap().id;
    let racing_cookie = second_cookie.clone();
    let racing_request = connect(&racing_cookie);
    let racing = tokio::spawn(async move { tokio_tungstenite::connect_async(racing_request).await });
    tokio::task::yield_now().await;
    let revoked = chat_backend::db::session::revoke_all_for_account(&app.pool, account_id, None).await.unwrap();
    assert_eq!(revoked, vec![second_id]);
    app.state.ws.close_sessions(account_id, &revoked);
    if let Ok((mut raced_socket, _)) = racing.await.unwrap() {
        let closed = tokio::time::timeout(std::time::Duration::from_secs(2), async {
            loop {
                match raced_socket.next().await {
                    Some(Ok(tokio_tungstenite::tungstenite::Message::Close(_))) | None | Some(Err(_)) => break,
                    _ => {}
                }
            }
        }).await;
        assert!(closed.is_ok(), "handshake racing revocation left a live socket");
    }
    let _ = second.close(None).await;
    server.abort();
}

#[tokio::test]
async fn identity_replacement_clears_recovery_and_rolls_back_on_handoff_failure() {
    let app = TestApp::new().await;
    let (_, alice_body, alice_cookie) = app.register("alice", "password1", None).await;
    let alice_cookie = must_cookie(alice_cookie);
    let alice_id = alice_body["id"].as_str().unwrap();
    let (_, server, _) = app.request("POST", "/api/servers", Some(crate::common::create_server_body("mesa")), Some(&alice_cookie)).await;
    assert!(server["id"].is_string());
    let bob_id = uuid::Uuid::new_v4();
    sqlx::query("INSERT INTO account (id, handle, password_hash, identity_pubkey, created_at) VALUES (?, 'bob', 'unused', X'01', '2026-10-08T00:00:00Z')")
        .bind(bob_id.to_string()).execute(&app.pool).await.unwrap();
    sqlx::query("INSERT INTO membership (account_id, server_id, joined_at, key_handoff_status) VALUES (?, ?, '2026-10-08T00:00:00Z', 'synced')")
        .bind(bob_id.to_string()).bind(server["id"].as_str().unwrap()).execute(&app.pool).await.unwrap();
    let mut bob_ws = app.state.ws.subscribe(bob_id, uuid::Uuid::new_v4());
    sqlx::query("UPDATE account SET recovery_vault = X'01', recovery_verifier_pubkey = X'02', recovery_set_at = '2026-10-08T00:00:00Z' WHERE id = ?")
        .bind(alice_id).execute(&app.pool).await.unwrap();
    sqlx::query("INSERT INTO recovery_ticket (id, account_id, recovery_generation, ticket_hash, expires_at, created_at) VALUES (?, ?, 0, 'old', '2099-01-01T00:00:00Z', '2026-10-08T00:00:00Z')")
        .bind(uuid::Uuid::new_v4().to_string()).bind(alice_id).execute(&app.pool).await.unwrap();
    sqlx::query("CREATE TRIGGER fail_handoff BEFORE UPDATE OF key_handoff_status ON membership BEGIN SELECT RAISE(ABORT, 'test rollback'); END")
        .execute(&app.pool).await.unwrap();
    let new_pubkey = "QkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkI=";
    let vault = serde_json::json!({"v":1,"publicKey":[9],"salt":[8],"iv":[7],"wrapped":[6]});
    let (status, _, _) = app.request("PUT", "/api/auth/identity", Some(serde_json::json!({
        "identity_pubkey": new_pubkey, "identity_vault": vault,
    })), Some(&alice_cookie)).await;
    assert_eq!(status, StatusCode::INTERNAL_SERVER_ERROR);
    assert!(bob_ws.messages.try_recv().is_err());
    let (status, me, _) = app.request("GET", "/api/auth/me", None, Some(&alice_cookie)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(me["has_recovery_key"], true);
    let (old_key,): (Vec<u8>,) = sqlx::query_as("SELECT identity_pubkey FROM account WHERE id = ?")
        .bind(alice_id).fetch_one(&app.pool).await.unwrap();
    assert_eq!(old_key, vec![0; 32]);
    sqlx::query("DROP TRIGGER fail_handoff").execute(&app.pool).await.unwrap();
    let (status, body, _) = app.request("PUT", "/api/auth/identity", Some(serde_json::json!({
        "identity_pubkey": new_pubkey, "identity_vault": vault,
    })), Some(&alice_cookie)).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["has_recovery_key"], false);
    let event = bob_ws.messages.try_recv().unwrap();
    assert!(event.contains("key_handoff.requested"));
    let (vault_count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM account WHERE id = ? AND recovery_vault IS NOT NULL")
        .bind(alice_id).fetch_one(&app.pool).await.unwrap();
    assert_eq!(vault_count, 0);
    let (ticket_count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM recovery_ticket WHERE account_id = ?")
        .bind(alice_id).fetch_one(&app.pool).await.unwrap();
    assert_eq!(ticket_count, 0);
}
