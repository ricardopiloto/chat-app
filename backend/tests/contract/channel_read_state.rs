use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use base64::Engine;
use serde_json::json;

fn b64(data: &str) -> String {
    base64::engine::general_purpose::STANDARD.encode(data.as_bytes())
}

#[tokio::test]
async fn unread_flag_clears_after_mark_read() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap().to_string();
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

    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "include_history": true })),
            Some(&alice),
        )
        .await;
    let code = inv["code"].as_str().unwrap().to_string();
    let (_, _, bob) = app.register("bob", "password1", Some(&code)).await;
    let bob = must_cookie(bob);

    // Bob caught up initially (no messages yet beyond join).
    let (status, list, _) = app
        .request("GET", "/api/servers", None, Some(&bob))
        .await;
    assert_eq!(status, StatusCode::OK, "{list}");
    let _bob_server = list
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == server_id)
        .unwrap();
    let _ = _bob_server;
    let _ = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/read"),
            Some(json!({})),
            Some(&bob),
        )
        .await;

    let (status, list, _) = app
        .request("GET", "/api/servers", None, Some(&bob))
        .await;
    assert_eq!(status, StatusCode::OK, "{list}");
    let bob_server = list
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == server_id)
        .unwrap();
    assert_eq!(bob_server["has_unread"], false, "{bob_server}");

    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/messages"),
        Some(json!({ "content_ciphertext": b64("hello-bob") })),
        Some(&alice),
    )
    .await;

    let (status, list, _) = app
        .request("GET", "/api/servers", None, Some(&bob))
        .await;
    assert_eq!(status, StatusCode::OK, "{list}");
    let bob_server = list
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == server_id)
        .unwrap();
    assert_eq!(bob_server["has_unread"], true, "{bob_server}");
    assert!(bob_server.get("has_voice").is_some());

    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/read"),
            Some(json!({})),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let (status, list, _) = app
        .request("GET", "/api/servers", None, Some(&bob))
        .await;
    assert_eq!(status, StatusCode::OK, "{list}");
    let bob_server = list
        .as_array()
        .unwrap()
        .iter()
        .find(|s| s["id"] == server_id)
        .unwrap();
    assert_eq!(bob_server["has_unread"], false, "{bob_server}");
}

#[tokio::test]
async fn has_voice_when_occupant_present() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap().to_string();
    let (_, channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&alice),
        )
        .await;
    let voice_id = channels
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["type"] == "voice_video")
        .unwrap()["id"]
        .as_str()
        .unwrap()
        .to_string();

    let (status, list, _) = app
        .request("GET", "/api/servers", None, Some(&alice))
        .await;
    assert_eq!(status, StatusCode::OK, "{list}");
    assert_eq!(
        list.as_array().unwrap()[0]["has_voice"],
        false,
        "{list}"
    );

    let (status, join, _) = app
        .request(
            "POST",
            &format!("/api/channels/{voice_id}/voice/join"),
            Some(json!({ "mic_on": true, "cam_on": false })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{join}");

    let (status, list, _) = app
        .request("GET", "/api/servers", None, Some(&alice))
        .await;
    assert_eq!(status, StatusCode::OK, "{list}");
    assert_eq!(list.as_array().unwrap()[0]["has_voice"], true, "{list}");
}
