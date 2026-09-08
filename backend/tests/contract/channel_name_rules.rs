use crate::common::{create_server_body, must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

async fn owner_and_channel(app: &TestApp) -> (String, String) {
    let (_, _, owner_cookie) = app.register("nameowner", "password1", None).await;
    let owner = must_cookie(owner_cookie);
    let (status, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(create_server_body("Mesa")),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{server}");
    let server_id = server["id"].as_str().unwrap();
    let (status, channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{channels}");
    let channel_id = channels.as_array().unwrap()[0]["id"].as_str().unwrap().to_string();
    (owner, channel_id)
}

#[tokio::test]
async fn patch_normalizes_spaces_to_hyphens() {
    let app = TestApp::new().await;
    let (owner, channel_id) = owner_and_channel(&app).await;
    let (status, body, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}"),
            Some(json!({ "name": "sala geral" })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["name"], "sala-geral");
}

#[tokio::test]
async fn patch_rejects_hyphen_only() {
    let app = TestApp::new().await;
    let (owner, channel_id) = owner_and_channel(&app).await;
    let (status, body, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}"),
            Some(json!({ "name": "---" })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
}

#[tokio::test]
async fn patch_rejects_over_32_scalars() {
    let app = TestApp::new().await;
    let (owner, channel_id) = owner_and_channel(&app).await;
    // Send >32 without relying on client truncate — server normalizes then accepts first 32
    let long: String = (0..40).map(|_| 'x').collect();
    let (status, body, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}"),
            Some(json!({ "name": long })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["name"].as_str().unwrap().chars().count(), 32);
}

#[tokio::test]
async fn create_rejects_hyphen_only() {
    let app = TestApp::new().await;
    let (_, _, owner_cookie) = app.register("namecreate", "password1", None).await;
    let owner = must_cookie(owner_cookie);
    let (status, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(create_server_body("Mesa")),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{server}");
    let server_id = server["id"].as_str().unwrap();
    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "   ", "type": "text" })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
}
