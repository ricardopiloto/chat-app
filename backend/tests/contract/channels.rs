use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

const SEALED: &str = "c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I=";

fn voice_body(name: &str) -> serde_json::Value {
    json!({
        "name": name,
        "type": "voice_video",
        "custody_ack": true,
        "channel_key_sealed": SEALED,
    })
}

async fn setup(app: &TestApp) -> (String, String) {
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
async fn owner_creates_text_channel_member_lists() {
    let app = TestApp::new().await;
    let (cookie, server_id) = setup(&app).await;
    let (status, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "geral", "type": "text" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{ch}");
    assert_eq!(ch["type"], "text");
    assert!(ch["created_by_account_id"].as_str().is_some());
    assert_eq!(ch["has_channel_key"], false);
    let (status, list, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    // bootstrap text+voice + newly created text
    assert_eq!(list.as_array().unwrap().len(), 3);
}

#[tokio::test]
async fn voice_create_requires_custody() {
    let app = TestApp::new().await;
    let (cookie, server_id) = setup(&app).await;
    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "mesa", "type": "voice_video" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");

    let (status, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(voice_body("mesa")),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{ch}");
    assert_eq!(ch["has_channel_key"], true);
    assert_eq!(ch["e2ee_enabled"], true);
}
