use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

async fn setup(app: &TestApp) -> (String, String) {
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
    let (status, list, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(list.as_array().unwrap().len(), 1);
}
