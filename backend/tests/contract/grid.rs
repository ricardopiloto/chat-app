use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

#[tokio::test]
async fn first_empty_slot_and_rejoin_keeps_index() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, me, _) = app.request("GET", "/api/auth/me", None, Some(&alice)).await;
    let alice_id = me["id"].as_str().unwrap().to_string();
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "mesa", "type": "voice_video", "custody_ack": true, "channel_key_sealed": "c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I=" })),
            Some(&alice),
        )
        .await;
    assert_eq!(ch["grid_slot_count"], 4);
    let channel_id = ch["id"].as_str().unwrap();
    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        None,
        Some(&alice),
    )
    .await;
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&alice),
        )
        .await;
    let code = inv["code"].as_str().unwrap();
    let (_, _, bob) = app.register("bob", "password1", Some(code)).await;
    let bob = must_cookie(bob);
    let (_, bob_me, _) = app.request("GET", "/api/auth/me", None, Some(&bob)).await;
    let bob_id = bob_me["id"].as_str().unwrap().to_string();
    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        None,
        Some(&bob),
    )
    .await;
    let (status, grid, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/grid"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{grid}");
    assert_eq!(grid["slot_count"], 4);
    let slots = grid["slots"].as_array().unwrap();
    assert_eq!(slots[0]["account_id"], alice_id);
    assert_eq!(slots[1]["account_id"], bob_id);
    assert!(slots[2]["account_id"].is_null());
    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        None,
        Some(&alice),
    )
    .await;
    let (_, grid2, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/grid"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(grid2["slots"][0]["account_id"], alice_id);
    assert_eq!(grid2["slots"][1]["account_id"], bob_id);
}
