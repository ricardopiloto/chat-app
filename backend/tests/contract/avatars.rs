use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

const JPEG: &[u8] = b"\xff\xd8\xff\xdb fake-jpeg";
const PNG: &[u8] = &[
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44,
    0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, 0x08, 0x02, 0x00, 0x00, 0x00, 0x90,
    0x77, 0x53, 0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, 0x08, 0xD7, 0x63, 0xF8,
    0xCF, 0xC0, 0x00, 0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xFE, 0xD4, 0xEF, 0x00, 0x00,
    0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82,
];

async fn register_owner(app: &TestApp, handle: &str) -> (String, String) {
    let (_, body, cookie) = app.register(handle, "password1", None).await;
    let cookie = must_cookie(cookie);
    let id = body["id"].as_str().unwrap().to_string();
    (cookie, id)
}

#[tokio::test]
async fn put_avatar_jpeg_then_get() {
    let app = TestApp::new().await;
    let (cookie, account_id) = register_owner(&app, "alice_av").await;
    let (status, body, _) = app
        .request_bytes(
            "PUT",
            "/api/auth/avatar",
            JPEG.to_vec(),
            &[("content-type", "image/jpeg")],
            Some(&cookie),
        )
        .await;
    assert!(status.is_success(), "{body}");
    assert_eq!(body["has_avatar"], true);

    let (status, bytes, headers) = app
        .request_raw(
            "GET",
            &format!("/api/accounts/{account_id}/avatar"),
            None,
            &[],
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        headers.get("content-type").unwrap().to_str().unwrap(),
        "image/jpeg"
    );
    assert_eq!(bytes, JPEG);
}

#[tokio::test]
async fn put_oversize_keeps_previous_avatar() {
    let app = TestApp::new().await;
    let (cookie, account_id) = register_owner(&app, "alice_big").await;
    let (status, _, _) = app
        .request_bytes(
            "PUT",
            "/api/auth/avatar",
            JPEG.to_vec(),
            &[("content-type", "image/jpeg")],
            Some(&cookie),
        )
        .await;
    assert!(status.is_success());

    let big = vec![0u8; 1 * 1024 * 1024 + 1];
    let (status, body, _) = app
        .request_bytes(
            "PUT",
            "/api/auth/avatar",
            big,
            &[("content-type", "image/jpeg")],
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");

    let (status, bytes, _) = app
        .request_raw(
            "GET",
            &format!("/api/accounts/{account_id}/avatar"),
            None,
            &[],
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(bytes, JPEG);
}

#[tokio::test]
async fn put_rejects_gif_and_octet_stream() {
    let app = TestApp::new().await;
    let (cookie, _) = register_owner(&app, "alice_mime").await;

    let (status, body, _) = app
        .request_bytes(
            "PUT",
            "/api/auth/avatar",
            PNG.to_vec(),
            &[
                ("content-type", "application/octet-stream"),
                ("x-mesa-media-type", "image/gif"),
            ],
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");

    let (status, body, _) = app
        .request_bytes(
            "PUT",
            "/api/auth/avatar",
            PNG.to_vec(),
            &[("content-type", "application/octet-stream")],
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
}

#[tokio::test]
async fn delete_avatar_then_get_404_and_me_false() {
    let app = TestApp::new().await;
    let (cookie, account_id) = register_owner(&app, "alice_del").await;
    let (status, _, _) = app
        .request_bytes(
            "PUT",
            "/api/auth/avatar",
            JPEG.to_vec(),
            &[("content-type", "image/jpeg")],
            Some(&cookie),
        )
        .await;
    assert!(status.is_success());

    let (status, _, _) = app
        .request("DELETE", "/api/auth/avatar", None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let (status, _, _) = app
        .request_raw(
            "GET",
            &format!("/api/accounts/{account_id}/avatar"),
            None,
            &[],
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let (status, me, _) = app.request("GET", "/api/auth/me", None, Some(&cookie)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(me["has_avatar"], false);
}

#[tokio::test]
async fn owner_put_get_server_image_member_sees_has_image() {
    let app = TestApp::new().await;
    let (alice, _) = register_owner(&app, "alice_srv").await;
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();

    let (status, body, _) = app
        .request_bytes(
            "PUT",
            &format!("/api/servers/{server_id}/image"),
            PNG.to_vec(),
            &[("content-type", "image/png")],
            Some(&alice),
        )
        .await;
    assert!(status.is_success(), "{body}");
    assert_eq!(body["has_image"], true);

    let (status, bytes, headers) = app
        .request_raw(
            "GET",
            &format!("/api/servers/{server_id}/image"),
            None,
            &[],
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        headers.get("content-type").unwrap().to_str().unwrap(),
        "image/png"
    );
    assert_eq!(bytes, PNG);

    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&alice),
        )
        .await;
    let code = inv["code"].as_str().unwrap();
    let (_, _, bob) = app.register("bob_srv", "password1", Some(code)).await;
    let bob = must_cookie(bob);
    let (status, list, _) = app.request("GET", "/api/servers", None, Some(&bob)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(list[0]["has_image"], true);
}

#[tokio::test]
async fn non_owner_cannot_put_server_image() {
    let app = TestApp::new().await;
    let (alice, _) = register_owner(&app, "alice_own").await;
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&alice),
        )
        .await;
    let code = inv["code"].as_str().unwrap();
    let (_, _, bob) = app.register("bob_own", "password1", Some(code)).await;
    let bob = must_cookie(bob);

    let (status, body, _) = app
        .request_bytes(
            "PUT",
            &format!("/api/servers/{server_id}/image"),
            PNG.to_vec(),
            &[("content-type", "image/png")],
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{body}");
}

#[tokio::test]
async fn non_member_cannot_get_server_image() {
    let app = TestApp::new().await;
    let (alice, _) = register_owner(&app, "alice_out").await;
    let (_, server_a, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Alpha")),
            Some(&alice),
        )
        .await;
    let server_a_id = server_a["id"].as_str().unwrap();
    let (status, _, _) = app
        .request_bytes(
            "PUT",
            &format!("/api/servers/{server_a_id}/image"),
            PNG.to_vec(),
            &[("content-type", "image/png")],
            Some(&alice),
        )
        .await;
    assert!(status.is_success());

    let (_, server_b, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Beta")),
            Some(&alice),
        )
        .await;
    let server_b_id = server_b["id"].as_str().unwrap();
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_b_id}/invites"),
            Some(json!({})),
            Some(&alice),
        )
        .await;
    let code = inv["code"].as_str().unwrap();
    let (_, _, charlie) = app.register("charlie_out", "password1", Some(code)).await;
    let charlie = must_cookie(charlie);

    let (status, _, _) = app
        .request_raw(
            "GET",
            &format!("/api/servers/{server_a_id}/image"),
            None,
            &[],
            Some(&charlie),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn delete_server_image_clears_has_image() {
    let app = TestApp::new().await;
    let (alice, _) = register_owner(&app, "alice_clr").await;
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (status, _, _) = app
        .request_bytes(
            "PUT",
            &format!("/api/servers/{server_id}/image"),
            PNG.to_vec(),
            &[("content-type", "image/png")],
            Some(&alice),
        )
        .await;
    assert!(status.is_success());

    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/servers/{server_id}/image"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let (status, list, _) = app.request("GET", "/api/servers", None, Some(&alice)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(list[0]["has_image"], false);

    let (status, _, _) = app
        .request_raw(
            "GET",
            &format!("/api/servers/{server_id}/image"),
            None,
            &[],
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND);
}
