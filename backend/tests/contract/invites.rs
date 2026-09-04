use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

async fn owner_and_server(app: &TestApp) -> (String, String) {
    let (_, _, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(json!({ "name": "Mesa" })),
            Some(&cookie),
        )
        .await;
    (cookie, server["id"].as_str().unwrap().to_string())
}

#[tokio::test]
async fn invite_defaults_no_history_and_has_expiry() {
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
    assert_eq!(inv["include_history"], false);
    assert!(!inv["expires_at"].is_null());
}

#[tokio::test]
async fn permanent_invite_null_expiry() {
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
    assert_eq!(status, StatusCode::CREATED, "{inv}");
    assert!(inv["expires_at"].is_null());
    assert_eq!(inv["include_history"], true);
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
}
