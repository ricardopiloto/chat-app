use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

#[tokio::test]
async fn dice_toolbar_default_put_and_auth() {
    let app = TestApp::new().await;
    let (status, _, _) = app
        .request("GET", "/api/auth/dice-toolbar", None, None)
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);

    let (_, _, cookie) = app.register("toolbaruser", "password1", None).await;
    let cookie = must_cookie(cookie);

    let (status, body, _) = app
        .request("GET", "/api/auth/dice-toolbar", None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(
        body["visible_sides"],
        json!([4, 6, 8, 10, 12, 20, 100])
    );

    let (status, body, _) = app
        .request(
            "PUT",
            "/api/auth/dice-toolbar",
            Some(json!({"visible_sides": [20, 6]})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["visible_sides"], json!([6, 20]));

    let (status, body, _) = app
        .request("GET", "/api/auth/dice-toolbar", None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["visible_sides"], json!([6, 20]));

    let (status, body, _) = app
        .request(
            "PUT",
            "/api/auth/dice-toolbar",
            Some(json!({"visible_sides": [7]})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
    assert_eq!(body["error"], "invalid_dice_toolbar_sides");

    let (status, body, _) = app
        .request(
            "PUT",
            "/api/auth/dice-toolbar",
            Some(json!({"visible_sides": [6, 6]})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
    assert_eq!(body["error"], "invalid_dice_toolbar_sides");

    let (status, body, _) = app
        .request(
            "PUT",
            "/api/auth/dice-toolbar",
            Some(json!({"visible_sides": []})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["visible_sides"], json!([]));
}
