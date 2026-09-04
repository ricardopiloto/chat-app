use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;

#[tokio::test]
async fn first_account_open_signup() {
    let app = TestApp::new().await;
    let (status, body, cookie) = app.register("alice", "password1", None).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    assert_eq!(body["handle"], "alice");
    assert_eq!(body["is_initial_operator"], true);
    assert!(must_cookie(cookie).starts_with("Session="));
}

#[tokio::test]
async fn second_open_signup_forbidden() {
    let app = TestApp::new().await;
    let (status, _, _) = app.register("alice", "password1", None).await;
    assert_eq!(status, StatusCode::CREATED);
    let (status, body, _) = app.register("bob", "password1", None).await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{body}");
}

#[tokio::test]
async fn duplicate_handle_conflict() {
    let app = TestApp::new().await;
    let (status, alice, cookie) = app.register("alice", "password1", None).await;
    assert_eq!(status, StatusCode::CREATED);
    let cookie = must_cookie(cookie);
    let (status, body, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(serde_json::json!({ "name": "Mesa" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    let server_id = body["id"].as_str().unwrap();
    let (status, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(serde_json::json!({ "include_history": false })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{inv}");
    let code = inv["code"].as_str().unwrap();
    let (status, body, _) = app.register("alice", "password1", Some(code)).await;
    assert_eq!(status, StatusCode::CONFLICT, "{body}");
    assert_eq!(alice["handle"], "alice");
}
