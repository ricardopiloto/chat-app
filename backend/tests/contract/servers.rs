use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

async fn owner_cookie(app: &TestApp) -> String {
    let (_, _, cookie) = app.register("alice", "password1", None).await;
    must_cookie(cookie)
}

#[tokio::test]
async fn create_server_sets_owner_and_lists_only_membership() {
    let app = TestApp::new().await;
    let cookie = owner_cookie(&app).await;
    let (status, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{server}");
    assert_eq!(server["name"], "Mesa");
    let (status, list, _) = app
        .request("GET", "/api/servers", None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(list.as_array().unwrap().len(), 1);
}

#[tokio::test]
async fn create_server_requires_custody_and_bootstraps_text_and_voice() {
    let app = TestApp::new().await;
    let cookie = owner_cookie(&app).await;

    let (status, err, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(json!({ "name": "NoKey" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{err}");

    let (status, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{server}");
    let server_id = server["id"].as_str().unwrap();

    let (status, channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{channels}");
    let arr = channels.as_array().unwrap();
    assert_eq!(arr.len(), 2);
    let types: Vec<&str> = arr.iter().map(|c| c["type"].as_str().unwrap()).collect();
    assert!(types.contains(&"text"));
    assert!(types.contains(&"voice_video"));
    let voice = arr.iter().find(|c| c["type"] == "voice_video").unwrap();
    assert_eq!(voice["has_channel_key"], true);
    assert_eq!(voice["name"], "mesa");
}
