use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use chat_backend::db::camera_background;
use chat_backend::domain::camera_background::{
    MAX_CAMERA_BACKGROUNDS_PER_ACCOUNT, MAX_CAMERA_BACKGROUND_BYTES,
};
use uuid::Uuid;

const PATH: &str = "/api/auth/camera-backgrounds";
const PNG: &[u8] = b"\x89PNG\r\n\x1a\n camera-background";

async fn register(app: &TestApp, handle: &str, invite: Option<&str>) -> (String, Uuid) {
    let (status, body, cookie) = app.register(handle, "password1", invite).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    (
        must_cookie(cookie),
        Uuid::parse_str(body["id"].as_str().unwrap()).unwrap(),
    )
}

async fn upload(app: &TestApp, cookie: &str) -> String {
    let (status, body, _) = app
        .request_bytes(
            "POST",
            PATH,
            PNG.to_vec(),
            &[("content-type", "image/png")],
            Some(cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    body["id"].as_str().unwrap().to_string()
}

#[tokio::test]
async fn camera_background_upload_list_get_delete_round_trip() {
    let app = TestApp::new().await;
    let (cookie, account_id) = register(&app, "camera_round_trip", None).await;
    let id = upload(&app, &cookie).await;
    let parsed_id = Uuid::parse_str(&id).unwrap();

    let (status, list, _) = app.request("GET", PATH, None, Some(&cookie)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(list.as_array().unwrap().len(), 1);
    assert_eq!(list[0]["id"], id);
    assert_eq!(list[0]["contentType"], "image/png");
    assert_eq!(list[0]["sizeBytes"], PNG.len());
    assert!(
        camera_background::find_by_id_and_account(&app.pool, parsed_id, account_id)
            .await
            .unwrap()
            .is_some()
    );

    let resource = format!("{PATH}/{id}");
    let (status, bytes, headers) = app
        .request_raw("GET", &resource, None, &[], Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(headers.get("content-type").unwrap(), "image/png");
    assert_eq!(bytes, PNG);

    let (status, _, _) = app.request("DELETE", &resource, None, Some(&cookie)).await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    assert!(
        camera_background::find_by_id_and_account(&app.pool, parsed_id, account_id)
            .await
            .unwrap()
            .is_none()
    );
    let (_, list, _) = app.request("GET", PATH, None, Some(&cookie)).await;
    assert!(list.as_array().unwrap().is_empty());
    for method in ["GET", "DELETE"] {
        let (status, _, _) = app.request(method, &resource, None, Some(&cookie)).await;
        assert_eq!(status, StatusCode::NOT_FOUND, "{method}");
    }
}

#[tokio::test]
async fn camera_background_upload_over_size_limit_is_rejected() {
    let app = TestApp::new().await;
    let (cookie, _) = register(&app, "camera_oversize", None).await;
    let (status, _, _) = app
        .request_bytes(
            "POST",
            PATH,
            vec![0; MAX_CAMERA_BACKGROUND_BYTES + 1],
            &[("content-type", "image/png")],
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::PAYLOAD_TOO_LARGE);
    let (_, list, _) = app.request("GET", PATH, None, Some(&cookie)).await;
    assert!(list.as_array().unwrap().is_empty());
}

#[tokio::test]
async fn camera_background_upload_at_count_limit_is_rejected() {
    let app = TestApp::new().await;
    let (cookie, account_id) = register(&app, "camera_count", None).await;
    for _ in 0..MAX_CAMERA_BACKGROUNDS_PER_ACCOUNT {
        let id = Uuid::new_v4();
        camera_background::insert(&app.pool, id, account_id, &id.to_string(), "image/png", 1)
            .await
            .unwrap();
    }
    let (status, body, _) = app
        .request_bytes(
            "POST",
            PATH,
            PNG.to_vec(),
            &[("content-type", "image/png")],
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
    let (_, list, _) = app.request("GET", PATH, None, Some(&cookie)).await;
    assert_eq!(
        list.as_array().unwrap().len() as i64,
        MAX_CAMERA_BACKGROUNDS_PER_ACCOUNT
    );
}

#[tokio::test]
async fn camera_background_other_account_cannot_list_get_or_delete() {
    let app = TestApp::new().await;
    let (owner, owner_id) = register(&app, "camera_owner", None).await;
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Camera")),
            Some(&owner),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, invite, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(serde_json::json!({})),
            Some(&owner),
        )
        .await;
    let (other, other_id) = register(&app, "camera_other", invite["code"].as_str()).await;
    let id = upload(&app, &owner).await;
    let parsed_id = Uuid::parse_str(&id).unwrap();
    let (status, list, _) = app.request("GET", PATH, None, Some(&other)).await;
    assert_eq!(status, StatusCode::OK);
    assert!(list.as_array().unwrap().is_empty());
    assert!(
        camera_background::find_by_id_and_account(&app.pool, parsed_id, other_id)
            .await
            .unwrap()
            .is_none()
    );
    let resource = format!("{PATH}/{id}");
    for method in ["GET", "DELETE"] {
        let (status, _, _) = app.request(method, &resource, None, Some(&other)).await;
        assert_eq!(status, StatusCode::NOT_FOUND, "{method}");
    }
    assert!(
        camera_background::find_by_id_and_account(&app.pool, parsed_id, owner_id)
            .await
            .unwrap()
            .is_some()
    );
    let (status, bytes, _) = app
        .request_raw("GET", &resource, None, &[], Some(&owner))
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(bytes, PNG);
}

#[tokio::test]
async fn camera_background_endpoints_require_session() {
    let app = TestApp::new().await;
    let id = Uuid::new_v4();
    for (method, path) in [
        ("GET", PATH.to_string()),
        ("POST", PATH.to_string()),
        ("GET", format!("{PATH}/{id}")),
        ("DELETE", format!("{PATH}/{id}")),
    ] {
        let (status, _, _) = app.request(&method, &path, None, None).await;
        assert_eq!(status, StatusCode::UNAUTHORIZED, "{method} {path}");
    }
}
