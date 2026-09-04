use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use base64::Engine;
use serde_json::json;

fn b64(data: &str) -> String {
    base64::engine::general_purpose::STANDARD.encode(data.as_bytes())
}

async fn alice_text_channel(app: &TestApp) -> (String, String) {
    let (_, _, alice) = app.register("alice_att", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&alice),
        )
        .await;
    let channel_id = channels
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["type"] == "text")
        .unwrap()["id"]
        .as_str()
        .unwrap()
        .to_string();
    (alice, channel_id)
}

#[tokio::test]
async fn upload_rejects_bad_mime() {
    let app = TestApp::new().await;
    let (alice, channel_id) = alice_text_channel(&app).await;
    let (status, body, _) = app
        .request_bytes(
            "POST",
            &format!("/api/channels/{channel_id}/attachments"),
            vec![1, 2, 3, 4],
            &[
                ("content-type", "application/octet-stream"),
                ("x-mesa-media-type", "application/pdf"),
            ],
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
}

#[tokio::test]
async fn upload_rejects_oversize() {
    let app = TestApp::new().await;
    let (alice, channel_id) = alice_text_channel(&app).await;
    let big = vec![0u8; 8 * 1024 * 1024 + 1];
    let (status, body, _) = app
        .request_bytes(
            "POST",
            &format!("/api/channels/{channel_id}/attachments"),
            big,
            &[
                ("content-type", "application/octet-stream"),
                ("x-mesa-media-type", "image/png"),
            ],
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
}

#[tokio::test]
async fn upload_bind_and_get_member_ok_outsider_denied() {
    let app = TestApp::new().await;
    let (alice, channel_id) = alice_text_channel(&app).await;
    let (status, att, _) = app
        .request_bytes(
            "POST",
            &format!("/api/channels/{channel_id}/attachments"),
            vec![9, 9, 9, 9],
            &[
                ("content-type", "application/octet-stream"),
                ("x-mesa-media-type", "image/png"),
            ],
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{att}");
    let att_id = att["id"].as_str().unwrap();

    let (status, msg, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({
                "content_ciphertext": b64("hi"),
                "attachment_ids": [att_id],
            })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{msg}");
    assert_eq!(msg["attachment_ids"][0], att_id);

    let (status, _, _) = app
        .request_bytes(
            "GET",
            &format!("/api/attachments/{att_id}"),
            vec![],
            &[],
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    let (status, body, _) = app
        .request_bytes(
            "GET",
            &format!("/api/attachments/{att_id}"),
            vec![],
            &[],
            None,
        )
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED, "{body}");
}

#[tokio::test]
async fn unfurl_rejects_non_http() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice_unfurl", "password1", None).await;
    let alice = must_cookie(alice);
    let (status, body, _) = app
        .request(
            "POST",
            "/api/unfurl",
            Some(json!({ "url": "file:///etc/passwd" })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
}

#[tokio::test]
async fn unfurl_rejects_loopback() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice_unfurl2", "password1", None).await;
    let alice = must_cookie(alice);
    let (status, body, _) = app
        .request(
            "POST",
            "/api/unfurl",
            Some(json!({ "url": "http://127.0.0.1/" })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
}
