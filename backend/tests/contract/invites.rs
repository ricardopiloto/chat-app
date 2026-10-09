use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use base64::Engine;
use chrono::{DateTime, Utc};
use serde_json::json;

async fn owner_and_server(app: &TestApp) -> (String, String) {
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
    (cookie, server["id"].as_str().unwrap().to_string())
}

#[tokio::test]
async fn invite_defaults_no_history_and_has_expiry() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let before = Utc::now();
    let (status, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{inv}");
    assert_eq!(inv["include_history"], false);
    assert!(!inv["expires_at"].is_null());
    let expires = DateTime::parse_from_rfc3339(inv["expires_at"].as_str().unwrap())
        .unwrap()
        .with_timezone(&Utc);
    let delta = (expires - before).num_seconds();
    assert!(
        (295..=305).contains(&delta),
        "expected ~300s TTL, got {delta}s (expires={expires})"
    );
    assert_eq!(inv["use_count"], 0);
}

#[tokio::test]
async fn permanent_invite_rejected() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let (status, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "expires_in_seconds": null, "include_history": true })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{inv}");
}

#[tokio::test]
async fn expired_or_revoked_invite_gone() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let (status, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{inv}");
    let code = inv["code"].as_str().unwrap().to_string();
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/invites/{code}/revoke"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, _, _) = app
        .request("GET", &format!("/api/invites/{code}"), None, None)
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    let (status, _, _) = app.register("bob", "password1", Some(&code)).await;
    assert!(status == StatusCode::FORBIDDEN || status == StatusCode::GONE);
}

#[tokio::test]
async fn zero_ttl_invite_not_usable() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let (status, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "expires_in_seconds": 0 })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{inv}");
    let code = inv["code"].as_str().unwrap();
    let (status, _, _) = app
        .request("GET", &format!("/api/invites/{code}"), None, None)
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    let (status, _, _) = app.register("bob", "password1", Some(code)).await;
    assert!(status == StatusCode::FORBIDDEN || status == StatusCode::GONE);
}

#[tokio::test]
async fn accept_invite_creates_membership() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    let code = inv["code"].as_str().unwrap();
    let (status, body, bob_cookie) = app.register("bob", "password1", Some(code)).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    let bob_cookie = must_cookie(bob_cookie);
    let (status, list, _) = app
        .request("GET", "/api/servers", None, Some(&bob_cookie))
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(list.as_array().unwrap().len(), 1);
    assert_eq!(list[0]["id"], server_id);
}

#[tokio::test]
async fn invite_use_cap_ten_then_reject() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let (status, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "expires_in_seconds": 600 })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{inv}");
    let code = inv["code"].as_str().unwrap().to_string();

    for i in 0..10 {
        let handle = format!("user{i:02}");
        let (status, body, _) = app.register(&handle, "password1", Some(&code)).await;
        assert_eq!(status, StatusCode::CREATED, "i={i} {body}");
    }

    let (status, body, _) = app.register("user11", "password1", Some(&code)).await;
    assert!(
        status == StatusCode::FORBIDDEN || status == StatusCode::GONE,
        "11th must fail: {status} {body}"
    );

    let (status, preview, _) = app
        .request("GET", &format!("/api/invites/{code}"), None, None)
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND, "{preview}");
}

#[tokio::test]
async fn already_member_accept_does_not_consume_use() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let (status, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "expires_in_seconds": 600 })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{inv}");
    let code = inv["code"].as_str().unwrap().to_string();

    let (status, _, bob_cookie) = app.register("bob", "password1", Some(&code)).await;
    assert_eq!(status, StatusCode::CREATED);
    let bob_cookie = must_cookie(bob_cookie);

    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/invites/{code}/accept"),
            Some(json!({})),
            Some(&bob_cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    let (status, listed, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/invites"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{listed}");
    let row = listed
        .as_array()
        .unwrap()
        .iter()
        .find(|i| i["code"] == code)
        .expect("invite");
    assert_eq!(row["use_count"], 1);
}

#[tokio::test]
async fn invite_membership_only_on_invite_server() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let (_, other, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Other")),
            Some(&cookie),
        )
        .await;
    let other_id = other["id"].as_str().unwrap();
    assert_ne!(server_id, other_id);

    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    let code = inv["code"].as_str().unwrap();
    let (status, _, bob_cookie) = app.register("bob", "password1", Some(code)).await;
    assert_eq!(status, StatusCode::CREATED);
    let bob_cookie = must_cookie(bob_cookie);
    let (status, list, _) = app
        .request("GET", "/api/servers", None, Some(&bob_cookie))
        .await;
    assert_eq!(status, StatusCode::OK);
    let ids: Vec<&str> = list
        .as_array()
        .unwrap()
        .iter()
        .map(|s| s["id"].as_str().unwrap())
        .collect();
    assert_eq!(ids, vec![server_id.as_str()]);
    assert!(!ids.contains(&other_id));
}

async fn invite_code(app: &TestApp, cookie: &str, server_id: &str) -> String {
    let (status, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{inv}");
    inv["code"].as_str().unwrap().to_string()
}

#[tokio::test]
async fn handle_available_reports_free_and_taken_handles() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let code = invite_code(&app, &cookie, &server_id).await;
    let url = |handle: &str| format!("/api/invites/{code}/handle-available?handle={handle}");

    let (status, body, _) = app.request("GET", &url("brand_new"), None, None).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["available"], true);

    // The owner registered as "alice" in owner_and_server; matching ignores case.
    let (_, owner, _) = app
        .request("GET", "/api/auth/me", None, Some(&cookie))
        .await;
    let taken = owner["handle"].as_str().unwrap().to_uppercase();
    let (status, body, _) = app.request("GET", &url(&taken), None, None).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["available"], false);
}

#[tokio::test]
async fn handle_available_requires_a_usable_invite() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let (status, _, _) = app
        .request(
            "GET",
            "/api/invites/not-a-code/handle-available?handle=anyone",
            None,
            None,
        )
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let code = invite_code(&app, &cookie, &server_id).await;
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/invites/{code}/revoke"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, _, _) = app
        .request(
            "GET",
            &format!("/api/invites/{code}/handle-available?handle=anyone"),
            None,
            None,
        )
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn handle_available_rejects_blank_handle() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let code = invite_code(&app, &cookie, &server_id).await;
    let (status, _, _) = app
        .request(
            "GET",
            &format!("/api/invites/{code}/handle-available?handle=%20"),
            None,
            None,
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn handle_available_is_rate_limited() {
    let app = TestApp::with_config(|c| {
        c.rate_limit_disabled = false;
    })
    .await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let code = invite_code(&app, &cookie, &server_id).await;
    let url = format!("/api/invites/{code}/handle-available?handle=someone");
    for i in 0..60 {
        let (status, body, _) = app.request("GET", &url, None, None).await;
        assert_eq!(status, StatusCode::OK, "i={i} {body}");
    }
    let (status, _, _) = app.request("GET", &url, None, None).await;
    assert_eq!(status, StatusCode::TOO_MANY_REQUESTS);
}

fn seed_blob() -> String {
    base64::engine::general_purpose::STANDARD.encode([7u8; 32])
}

#[tokio::test]
async fn key_seed_is_stored_hidden_and_returned_only_on_accept() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let seed = seed_blob();
    let (status, listed_shape, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "key_seed": seed })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{listed_shape}");
    assert!(listed_shape.get("key_seed").is_none(), "{listed_shape}");
    let expires = DateTime::parse_from_rfc3339(listed_shape["expires_at"].as_str().unwrap())
        .unwrap()
        .with_timezone(&Utc);
    let ttl = (expires - Utc::now()).num_seconds();
    assert!((86_390..=86_400).contains(&ttl), "seeded invite TTL {ttl}");
    let code = listed_shape["code"].as_str().unwrap();
    let (status, preview, _) = app
        .request("GET", &format!("/api/invites/{code}"), None, None)
        .await;
    assert_eq!(status, StatusCode::OK, "{preview}");
    assert!(preview.get("key_seed").is_none(), "{preview}");
    let (status, list, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/invites"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{list}");
    assert!(list.to_string().contains(code));
    assert!(!list.to_string().contains(&seed));
    let (stored,): (Option<String>,) = sqlx::query_as("SELECT key_seed FROM invite WHERE code = ?")
        .bind(code)
        .fetch_one(&app.pool)
        .await
        .unwrap();
    assert_eq!(stored.as_deref(), Some(seed.as_str()));

    let (status, plain, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{plain}");
    let plain_code = plain["code"].as_str().unwrap();
    let (empty,): (Option<String>,) = sqlx::query_as("SELECT key_seed FROM invite WHERE code = ?")
        .bind(plain_code)
        .fetch_one(&app.pool)
        .await
        .unwrap();
    assert!(empty.is_none());

    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(
                json!({ "key_seed": base64::engine::general_purpose::STANDARD.encode([9u8; 129]) }),
            ),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);

    let logs = install_accept_log();
    let mark = logs.lock().expect("log").len();
    let (status, joined, bob) = app
        .request(
            "POST",
            &format!("/api/invites/{code}/accept"),
            Some(json!({
                "handle": "bob_seed",
                "password": "password1",
                "identity_pubkey": crate::common::PUBKEY,
            })),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{joined}");
    assert_eq!(joined["key_seed"], seed);
    assert_eq!(joined["key_handoff_status"], "pending");
    let bob = must_cookie(bob);
    let (status, again, _) = app
        .request(
            "POST",
            &format!("/api/invites/{code}/accept"),
            Some(json!({})),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{again}");
    assert!(again.get("key_seed").is_none(), "{again}");

    let (_, server_two, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Outra")),
            Some(&cookie),
        )
        .await;
    let other = server_two["id"].as_str().unwrap();
    let (status, bridge, _) = app
        .request(
            "POST",
            &format!("/api/servers/{other}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{bridge}");
    let (_, _, carol) = app
        .register(
            "carol_seed",
            "password1",
            Some(bridge["code"].as_str().unwrap()),
        )
        .await;
    let carol = must_cookie(carol);
    let (status, session_join, _) = app
        .request(
            "POST",
            &format!("/api/invites/{code}/accept"),
            Some(json!({})),
            Some(&carol),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{session_join}");
    assert_eq!(session_join["key_seed"], seed);
    let (_, _, dave) = app
        .register(
            "dave_seed",
            "password1",
            Some(bridge["code"].as_str().unwrap()),
        )
        .await;
    let dave = must_cookie(dave);
    let (status, plain_join, _) = app
        .request(
            "POST",
            &format!("/api/invites/{plain_code}/accept"),
            Some(json!({})),
            Some(&dave),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{plain_join}");
    assert!(plain_join.get("key_seed").is_none(), "{plain_join}");

    let text = String::from_utf8_lossy(&logs.lock().expect("log")[mark..]).to_string();
    assert!(text.contains("invite accepted"), "{text}");
    assert!(text.contains("has_key_seed=true"), "{text}");
    assert!(text.contains("has_key_seed=false"), "{text}");
    assert!(!text.contains(&seed), "{text}");
}

fn install_accept_log() -> std::sync::Arc<std::sync::Mutex<Vec<u8>>> {
    use std::io::Write;
    use std::sync::{Arc, Mutex, Once, OnceLock};
    static ONCE: Once = Once::new();
    static BUF: OnceLock<Arc<Mutex<Vec<u8>>>> = OnceLock::new();
    let buf = BUF.get_or_init(|| Arc::new(Mutex::new(Vec::new()))).clone();
    ONCE.call_once(|| {
        let buf = buf.clone();
        struct Mem(Arc<Mutex<Vec<u8>>>);
        impl Write for Mem {
            fn write(&mut self, data: &[u8]) -> std::io::Result<usize> {
                self.0.lock().expect("log").extend_from_slice(data);
                Ok(data.len())
            }
            fn flush(&mut self) -> std::io::Result<()> {
                Ok(())
            }
        }
        let subscriber = tracing_subscriber::fmt()
            .with_max_level(tracing::Level::INFO)
            .with_ansi(false)
            .with_writer(move || Mem(buf.clone()))
            .finish();
        let _ = tracing::subscriber::set_global_default(subscriber);
    });
    buf
}
