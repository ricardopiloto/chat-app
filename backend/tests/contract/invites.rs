use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
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
