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
            Some(json!({ "name": "Mesa" })),
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
