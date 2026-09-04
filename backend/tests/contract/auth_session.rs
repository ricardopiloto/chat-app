use crate::common::{must_cookie, TestApp, PUBKEY};
use axum::http::StatusCode;

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
async fn logout_revokes_session() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let (status, _, _) = app
        .request("POST", "/api/auth/logout", None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, _, _) = app.request("GET", "/api/auth/me", None, Some(&cookie)).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}
