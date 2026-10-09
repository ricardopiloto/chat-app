use crate::common::{must_cookie, TestApp, CHANNEL_KEY_SEALED, PUBKEY};
use axum::http::StatusCode;
use base64::Engine;
use chrono::{Duration, Utc};
use futures_util::StreamExt;
use serde_json::json;
use tokio_tungstenite::tungstenite::client::IntoClientRequest;

async fn issue(app: &TestApp, account_id: &str, code: &str, expires: chrono::DateTime<Utc>) {
    let hash = chat_backend::api::auth::recovery::hash_code(code).unwrap();
    sqlx::query("INSERT OR REPLACE INTO password_reset (id, account_id, code_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, 0, ?)")
        .bind(uuid::Uuid::new_v4().to_string()).bind(account_id).bind(hash)
        .bind(expires.to_rfc3339()).bind(Utc::now().to_rfc3339()).execute(&app.pool).await.unwrap();
}

fn vault(pubkey_byte: u8) -> serde_json::Value {
    json!({"v":1,"publicKey":vec![pubkey_byte;32],"salt":[1],"iv":[2],"wrapped":[3]})
}

fn redeem_body(handle: &str, code: &str) -> serde_json::Value {
    json!({"handle":handle,"code":code,"password":"newpassword1","identity_pubkey":"QkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkI=","identity_vault":vault(66)})
}

#[tokio::test]
async fn code_redeem_rotates_identity_sessions_and_is_one_time() {
    let app = TestApp::new().await;
    let (_, alice, first_cookie) = app.register("alice", "password1", None).await;
    let first_cookie = must_cookie(first_cookie);
    let (_, _, second_cookie) = app.login("alice", "password1").await;
    let second_cookie = must_cookie(second_cookie);
    let code = chat_backend::api::auth::recovery::generate_code();
    issue(
        &app,
        alice["id"].as_str().unwrap(),
        &code,
        Utc::now() + Duration::minutes(30),
    )
    .await;
    let (status, updated, fresh_cookie) = app
        .request(
            "POST",
            "/api/auth/recovery/code/redeem",
            Some(redeem_body("alice", &code)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{updated}");
    assert_eq!(updated["identity_vault"]["publicKey"], json!(vec![66; 32]));
    let token = updated["session_token"].as_str().expect("session_token");
    let fresh_cookie = must_cookie(fresh_cookie);
    assert_eq!(fresh_cookie, format!("Session={token}"));
    for old in [&first_cookie, &second_cookie] {
        let (status, _, _) = app
            .request(
                "PATCH",
                "/api/auth/display-name",
                Some(json!({"display_name":"X"})),
                Some(old),
            )
            .await;
        assert_eq!(status, StatusCode::UNAUTHORIZED);
    }
    let (status, _, _) = app
        .request("GET", "/api/auth/me", None, Some(&fresh_cookie))
        .await;
    assert_eq!(status, StatusCode::OK);
    let (status, _, _) = app.login("alice", "password1").await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    let (status, _, _) = app.login("alice", "newpassword1").await;
    assert_eq!(status, StatusCode::OK);
    let (status, invalid, _) = app
        .request(
            "POST",
            "/api/auth/recovery/code/redeem",
            Some(redeem_body("alice", &code)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED, "{invalid}");
}

#[tokio::test]
async fn code_failures_are_uniform_and_fifth_invalidates() {
    let app = TestApp::new().await;
    let (_, alice, _) = app.register("alice", "password1", None).await;
    let code = chat_backend::api::auth::recovery::generate_code();
    issue(
        &app,
        alice["id"].as_str().unwrap(),
        &code,
        Utc::now() + Duration::minutes(30),
    )
    .await;
    let (status_unknown, body_unknown, _) = app
        .request(
            "POST",
            "/api/auth/recovery/code/redeem",
            Some(redeem_body("nobody", &code)),
            None,
        )
        .await;
    assert_eq!(status_unknown, StatusCode::UNAUTHORIZED);
    for _ in 0..5 {
        let (status, body, _) = app
            .request(
                "POST",
                "/api/auth/recovery/code/redeem",
                Some(redeem_body("alice", "00000000000000000000000000")),
                None,
            )
            .await;
        assert_eq!(status, status_unknown);
        assert_eq!(body, body_unknown);
    }
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/recovery/code/redeem",
            Some(redeem_body("alice", &code)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    issue(
        &app,
        alice["id"].as_str().unwrap(),
        &code,
        Utc::now() - Duration::minutes(1),
    )
    .await;
    let (status, body, _) = app
        .request(
            "POST",
            "/api/auth/recovery/code/redeem",
            Some(redeem_body("alice", &code)),
            None,
        )
        .await;
    assert_eq!(status, status_unknown);
    assert_eq!(body, body_unknown);
}

#[tokio::test]
async fn change_password_preserves_identity_and_current_session() {
    let app = TestApp::new().await;
    let (_, alice, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let (_, _, other) = app.login("alice", "password1").await;
    let other = must_cookie(other);
    let body = json!({"current_password":"password1","new_password":"newpassword1","identity_vault":vault(0)});
    let (status, _, _) = app
        .request("PUT", "/api/auth/password", Some(body), Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, current, _) = app
        .request("GET", "/api/auth/me", None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(current["id"], alice["id"]);
    assert_eq!(current["identity_vault"]["publicKey"], json!(vec![0; 32]));
    let (status, _, _) = app
        .request(
            "PATCH",
            "/api/auth/display-name",
            Some(json!({"display_name":"X"})),
            Some(&other),
        )
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    let (status, _, _) = app.login("alice", "newpassword1").await;
    assert_eq!(status, StatusCode::OK);
    let (status, _, _) = app.request(
        "PUT",
        "/api/auth/password",
        Some(json!({"current_password":"wrong-password","new_password":"otherpass1","identity_vault":vault(0)})),
        Some(&cookie),
    ).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    let (status, _, _) = app.request(
        "PUT",
        "/api/auth/password",
        Some(json!({"current_password":"newpassword1","new_password":"otherpass1","identity_vault":vault(9)})),
        Some(&cookie),
    ).await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    let (status, _, _) = app.login("alice", "newpassword1").await;
    assert_eq!(status, StatusCode::OK);
    let _ = PUBKEY;
}

#[tokio::test]
async fn change_password_keeps_this_socket_and_closes_the_other() {
    let app = TestApp::new().await;
    let (_, alice, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let alice_id = alice["id"].as_str().unwrap();
    let (_, _, other_cookie) = app.login("alice", "password1").await;
    let other_cookie = must_cookie(other_cookie);
    sqlx::query("UPDATE account SET recovery_vault = X'01', recovery_verifier_pubkey = X'02', recovery_set_at = '2026-10-08T00:00:00Z' WHERE id = ?")
        .bind(alice_id).execute(&app.pool).await.unwrap();
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("mesa")),
            Some(&cookie),
        )
        .await;
    let sealed = base64::engine::general_purpose::STANDARD
        .decode(CHANNEL_KEY_SEALED)
        .unwrap();
    sqlx::query("INSERT INTO key_envelope (server_id, account_id, sealed_key, sealed_by_account_id, created_at) VALUES (?, ?, ?, ?, ?)")
        .bind(server["id"].as_str().unwrap()).bind(alice_id).bind(sealed).bind(alice_id).bind(Utc::now().to_rfc3339())
        .execute(&app.pool).await.unwrap();

    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let address = listener.local_addr().unwrap();
    let router = app.router.clone();
    let server_task = tokio::spawn(async move { axum::serve(listener, router).await });
    let connect = |cookie: &str| {
        let mut request = format!("ws://{address}/ws").into_client_request().unwrap();
        request
            .headers_mut()
            .insert("cookie", cookie.parse().unwrap());
        request
    };
    let (mut current, _) = tokio_tungstenite::connect_async(connect(&cookie))
        .await
        .unwrap();
    let (mut other, _) = tokio_tungstenite::connect_async(connect(&other_cookie))
        .await
        .unwrap();

    let (status, _, _) = app.request(
        "PUT",
        "/api/auth/password",
        Some(json!({"current_password":"wrong-password","new_password":"otherpass1","identity_vault":vault(0)})),
        Some(&cookie),
    ).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    assert!(app
        .state
        .ws
        .is_online(uuid::Uuid::parse_str(alice_id).unwrap()));

    let (status, _, _) = app.request(
        "PUT",
        "/api/auth/password",
        Some(json!({"current_password":"password1","new_password":"newpassword1","identity_vault":vault(0)})),
        Some(&cookie),
    ).await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let closed = tokio::time::timeout(std::time::Duration::from_secs(2), async {
        loop {
            match other.next().await {
                Some(Ok(tokio_tungstenite::tungstenite::Message::Close(_)))
                | None
                | Some(Err(_)) => break true,
                _ => {}
            }
        }
    })
    .await
    .unwrap();
    assert!(closed);
    let (status, me, _) = app
        .request("GET", "/api/auth/me", None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(me["has_recovery_key"], true);
    assert_eq!(me["identity_vault"]["publicKey"], json!(vec![0; 32]));
    let (envelopes,): (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM key_envelope WHERE account_id = ?")
            .bind(alice_id)
            .fetch_one(&app.pool)
            .await
            .unwrap();
    assert_eq!(envelopes, 1);
    let _ = current.close(None).await;
    server_task.abort();
}

#[tokio::test]
async fn short_password_does_not_consume_the_operator_code() {
    let app = TestApp::new().await;
    let (_, alice, _) = app.register("alice", "password1", None).await;
    let code = chat_backend::api::auth::recovery::generate_code();
    issue(
        &app,
        alice["id"].as_str().unwrap(),
        &code,
        Utc::now() + Duration::minutes(30),
    )
    .await;
    let mut body = redeem_body("alice", &code);
    body["password"] = json!("short");
    let (status, _, _) = app
        .request("POST", "/api/auth/recovery/code/redeem", Some(body), None)
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/recovery/code/redeem",
            Some(redeem_body("alice", &code)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK);
}

#[tokio::test]
async fn operator_reset_clears_previous_recovery_material() {
    let app = TestApp::new().await;
    let (_, alice, _) = app.register("alice", "password1", None).await;
    let alice_id = alice["id"].as_str().unwrap();
    sqlx::query("UPDATE account SET recovery_vault = X'01', recovery_verifier_pubkey = X'02', recovery_set_at = '2026-10-08T00:00:00Z' WHERE id = ?")
        .bind(alice_id).execute(&app.pool).await.unwrap();
    let code = chat_backend::api::auth::recovery::generate_code();
    issue(&app, alice_id, &code, Utc::now() + Duration::minutes(30)).await;
    let (status, updated, _) = app
        .request(
            "POST",
            "/api/auth/recovery/code/redeem",
            Some(redeem_body("alice", &code)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{updated}");
    assert_eq!(updated["has_recovery_key"], false);
}

#[tokio::test]
async fn credential_change_rolls_back_when_session_insert_fails() {
    let app = TestApp::new().await;
    let (_, alice, cookie) = app.register("alice", "password1", None).await;
    let alice_id = alice["id"].as_str().unwrap();
    let cookie = must_cookie(cookie);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("mesa")),
            Some(&cookie),
        )
        .await;
    let bob_id = uuid::Uuid::new_v4();
    sqlx::query("INSERT INTO account (id, handle, password_hash, identity_pubkey, created_at) VALUES (?, 'bob', 'unused', X'01', '2026-10-08T00:00:00Z')")
        .bind(bob_id.to_string()).execute(&app.pool).await.unwrap();
    sqlx::query("INSERT INTO membership (account_id, server_id, joined_at, key_handoff_status) VALUES (?, ?, '2026-10-08T00:00:00Z', 'synced')")
        .bind(bob_id.to_string()).bind(server["id"].as_str().unwrap()).execute(&app.pool).await.unwrap();
    let mut bob_ws = app.state.ws.subscribe(bob_id, uuid::Uuid::new_v4());
    sqlx::query("UPDATE account SET recovery_vault = X'01', recovery_verifier_pubkey = X'02', recovery_set_at = '2026-10-08T00:00:00Z' WHERE id = ?")
        .bind(alice_id).execute(&app.pool).await.unwrap();
    let code = chat_backend::api::auth::recovery::generate_code();
    issue(&app, alice_id, &code, Utc::now() + Duration::minutes(30)).await;
    sqlx::query("CREATE TRIGGER fail_session BEFORE INSERT ON session BEGIN SELECT RAISE(ABORT, 'test rollback'); END")
        .execute(&app.pool).await.unwrap();
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/recovery/code/redeem",
            Some(redeem_body("alice", &code)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::INTERNAL_SERVER_ERROR);
    assert!(bob_ws.messages.try_recv().is_err());
    let (kept,): (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM account WHERE id = ? AND recovery_vault IS NOT NULL")
            .bind(alice_id)
            .fetch_one(&app.pool)
            .await
            .unwrap();
    assert_eq!(kept, 1);
    let (codes,): (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM password_reset WHERE account_id = ?")
            .bind(alice_id)
            .fetch_one(&app.pool)
            .await
            .unwrap();
    assert_eq!(codes, 1);
    sqlx::query("DROP TRIGGER fail_session")
        .execute(&app.pool)
        .await
        .unwrap();
    let (status, _, _) = app.login("alice", "password1").await;
    assert_eq!(status, StatusCode::OK);
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/recovery/code/redeem",
            Some(redeem_body("alice", &code)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK);
}

#[tokio::test]
async fn two_redeems_of_one_code_let_only_one_succeed() {
    let app = TestApp::new().await;
    let (_, alice, _) = app.register("alice", "password1", None).await;
    let code = chat_backend::api::auth::recovery::generate_code();
    issue(
        &app,
        alice["id"].as_str().unwrap(),
        &code,
        Utc::now() + Duration::minutes(30),
    )
    .await;
    let body = redeem_body("alice", &code);
    let first = app.request(
        "POST",
        "/api/auth/recovery/code/redeem",
        Some(body.clone()),
        None,
    );
    let second = app.request("POST", "/api/auth/recovery/code/redeem", Some(body), None);
    let ((left, _, _), (right, _, _)) = tokio::join!(first, second);
    let statuses = [left, right];
    assert_eq!(
        statuses
            .iter()
            .filter(|status| **status == StatusCode::OK)
            .count(),
        1
    );
    assert_eq!(
        statuses
            .iter()
            .filter(|status| **status == StatusCode::UNAUTHORIZED)
            .count(),
        1
    );
}

#[tokio::test]
async fn unknown_handles_share_a_bounded_failure_quota() {
    let app = TestApp::with_config(|config| config.rate_limit_disabled = false).await;
    let body = redeem_body("ghost", "00000000000000000000000000");
    for _ in 0..5 {
        let (status, _, _) = app
            .request(
                "POST",
                "/api/auth/recovery/code/redeem",
                Some(body.clone()),
                None,
            )
            .await;
        assert_eq!(status, StatusCode::UNAUTHORIZED);
    }
    let (status, _, _) = app
        .request("POST", "/api/auth/recovery/code/redeem", Some(body), None)
        .await;
    assert_eq!(status, StatusCode::TOO_MANY_REQUESTS);
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/recovery/code/redeem",
            Some(redeem_body("other-ghost", "00000000000000000000000000")),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}
