use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use chrono::{Duration, Utc};
use serde_json::json;
use uuid::Uuid;

async fn voice_channel(app: &TestApp, cookie: &str) -> (String, String) {
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(cookie),
        )
        .await;
    let server_id = server["id"].as_str().unwrap().to_string();
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({
                "name": "mesa",
                "type": "voice_video",
                "custody_ack": true,
                "channel_key_sealed": "c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I="
            })),
            Some(cookie),
        )
        .await;
    (server_id, ch["id"].as_str().unwrap().to_string())
}

async fn text_channel(app: &TestApp, cookie: &str, server_id: &str) -> String {
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "geral-2", "type": "text" })),
            Some(cookie),
        )
        .await;
    ch["id"].as_str().unwrap().to_string()
}

#[tokio::test]
async fn occupancy_requires_auth_and_membership() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (server_id, _) = voice_channel(&app, &alice).await;

    let (status, _, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            None,
        )
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);

    let missing = Uuid::nil();
    let (status, _, _) = app
        .request(
            "GET",
            &format!("/api/servers/{missing}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND);

    let (_, other, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Outro")),
            Some(&alice),
        )
        .await;
    let other_id = other["id"].as_str().unwrap();
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{other_id}/invites"),
            Some(json!({})),
            Some(&alice),
        )
        .await;
    let code = inv["code"].as_str().unwrap();
    let (_, _, bob) = app.register("bob", "password1", Some(code)).await;
    let bob = must_cookie(bob);
    let (status, _, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn join_creates_occupancy_and_leave_clears_session() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (server_id, channel_id) = voice_channel(&app, &alice).await;
    let (_, me, _) = app.request("GET", "/api/auth/me", None, Some(&alice)).await;
    let alice_id = me["id"].as_str().unwrap();

    let (status, _, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    let (status, join, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/voice/join"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{join}");
    assert!(join.get("token").is_some());

    let (_, snap, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    let channels = snap["channels"].as_array().unwrap();
    assert_eq!(channels.len(), 1);
    assert_eq!(channels[0]["channel_id"], channel_id);
    assert!(channels[0]["call_started_at"].as_str().is_some());
    let occ = channels[0]["occupants"].as_array().unwrap();
    assert_eq!(occ.len(), 1);
    assert_eq!(occ[0]["account_id"], alice_id);
    assert_eq!(occ[0]["handle"], "alice");
    assert_eq!(occ[0]["mic_on"], true);
    assert_eq!(occ[0]["cam_on"], true);
    assert_eq!(occ[0]["has_avatar"], false);
    let started = channels[0]["call_started_at"].as_str().unwrap().to_string();

    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/voice/join"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (_, snap2, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(snap2["channels"][0]["call_started_at"], started);

    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/voice/leave"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT, "{body}");

    let (_, snap3, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    assert!(snap3["channels"].as_array().unwrap().is_empty());

    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/voice/leave"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    tokio::time::sleep(std::time::Duration::from_millis(20)).await;
    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        None,
        Some(&alice),
    )
    .await;
    let (_, snap4, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    assert_ne!(snap4["channels"][0]["call_started_at"], started);
}

#[tokio::test]
async fn session_clock_is_shared_not_personal() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (server_id, channel_id) = voice_channel(&app, &alice).await;
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

    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        None,
        Some(&alice),
    )
    .await;
    let (_, snap, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    let started = snap["channels"][0]["call_started_at"].clone();

    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        None,
        Some(&bob),
    )
    .await;
    let (_, snap2, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&bob),
        )
        .await;
    assert_eq!(snap2["channels"][0]["call_started_at"], started);
    assert_eq!(snap2["channels"][0]["occupants"].as_array().unwrap().len(), 2);
}

#[tokio::test]
async fn media_patch_and_silent_occupant() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (server_id, channel_id) = voice_channel(&app, &alice).await;

    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        Some(json!({ "mic_on": false, "cam_on": false })),
        Some(&alice),
    )
    .await;
    let (_, snap, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(snap["channels"][0]["occupants"][0]["mic_on"], false);
    assert_eq!(snap["channels"][0]["occupants"][0]["cam_on"], false);
    assert!(snap["channels"][0]["call_started_at"].as_str().is_some());

    let (status, _, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}/voice/media"),
            Some(json!({ "mic_on": true })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (_, snap2, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(snap2["channels"][0]["occupants"][0]["mic_on"], true);
    assert_eq!(snap2["channels"][0]["occupants"][0]["cam_on"], false);

    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/leave"),
        None,
        Some(&alice),
    )
    .await;
    let (status, _, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}/voice/media"),
            Some(json!({ "mic_on": true })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn screen_on_patch_idempotent_and_cleared_on_leave() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice_ss", "password1", None).await;
    let alice = must_cookie(alice);
    let (server_id, channel_id) = voice_channel(&app, &alice).await;

    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        Some(json!({ "mic_on": true, "cam_on": false })),
        Some(&alice),
    )
    .await;
    let (_, snap0, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(snap0["channels"][0]["occupants"][0]["screen_on"], false);

    let (status, _, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}/voice/media"),
            Some(json!({ "screen_on": true })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (_, snap, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(snap["channels"][0]["occupants"][0]["screen_on"], true);

    let (status2, _, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}/voice/media"),
            Some(json!({ "screen_on": true })),
            Some(&alice),
        )
        .await;
    assert_eq!(status2, StatusCode::NO_CONTENT);

    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/leave"),
        None,
        Some(&alice),
    )
    .await;
    let (_, snap_leave, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    let channels = snap_leave["channels"].as_array().unwrap();
    assert!(
        channels.is_empty()
            || channels[0]["occupants"]
                .as_array()
                .map(|a| a.is_empty())
                .unwrap_or(true)
    );
}

#[tokio::test]
async fn leave_text_channel_is_bad_request() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (server_id, _) = voice_channel(&app, &alice).await;
    let text_id = text_channel(&app, &alice, &server_id).await;
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{text_id}/voice/leave"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
}

#[tokio::test]
async fn join_moves_between_voice_channels() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (server_id, a_id) = voice_channel(&app, &alice).await;
    let (_, b, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({
                "name": "outra",
                "type": "voice_video",
                "custody_ack": true,
                "channel_key_sealed": "c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I="
            })),
            Some(&alice),
        )
        .await;
    let b_id = b["id"].as_str().unwrap();

    app.request(
        "POST",
        &format!("/api/channels/{a_id}/voice/join"),
        None,
        Some(&alice),
    )
    .await;
    app.request(
        "POST",
        &format!("/api/channels/{b_id}/voice/join"),
        None,
        Some(&alice),
    )
    .await;

    let (_, snap, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    let channels = snap["channels"].as_array().unwrap();
    assert_eq!(channels.len(), 1);
    assert_eq!(channels[0]["channel_id"], b_id);
    assert_eq!(channels[0]["occupants"].as_array().unwrap().len(), 1);

    let (_, grid_a, _) = app
        .request(
            "GET",
            &format!("/api/channels/{a_id}/grid"),
            None,
            Some(&alice),
        )
        .await;
    let a_occupied = grid_a["slots"]
        .as_array()
        .unwrap()
        .iter()
        .any(|s| !s["account_id"].is_null());
    assert!(!a_occupied, "{grid_a}");
}

#[tokio::test]
async fn leave_frees_grid_slot() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, channel_id) = voice_channel(&app, &alice).await;
    let (_, me, _) = app.request("GET", "/api/auth/me", None, Some(&alice)).await;
    let alice_id = me["id"].as_str().unwrap();

    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        None,
        Some(&alice),
    )
    .await;
    let (_, grid, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/grid"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(grid["slots"][0]["account_id"], alice_id);

    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/leave"),
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
    assert!(grid2["slots"][0]["account_id"].is_null(), "{grid2}");
}

#[tokio::test]
async fn stale_occupant_is_removed_on_snapshot() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (server_id, channel_id) = voice_channel(&app, &alice).await;
    let (_, me, _) = app.request("GET", "/api/auth/me", None, Some(&alice)).await;
    let alice_id = me["id"].as_str().unwrap();

    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        None,
        Some(&alice),
    )
    .await;

    let stale = (Utc::now() - Duration::seconds(120)).to_rfc3339();
    sqlx::query("UPDATE voice_occupant SET last_seen_at = ? WHERE account_id = ?")
        .bind(&stale)
        .bind(alice_id)
        .execute(&app.pool)
        .await
        .unwrap();

    let (_, snap, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    assert!(snap["channels"].as_array().unwrap().is_empty(), "{snap}");
}

/// 087: sweeper uses the same `expire_stale` path without requiring a GET.
#[tokio::test]
async fn stale_occupant_cleared_by_expire_stale_direct() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (server_id, channel_id) = voice_channel(&app, &alice).await;
    let (_, me, _) = app.request("GET", "/api/auth/me", None, Some(&alice)).await;
    let alice_id = me["id"].as_str().unwrap();

    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        None,
        Some(&alice),
    )
    .await;

    let stale = (Utc::now() - Duration::seconds(120)).to_rfc3339();
    sqlx::query("UPDATE voice_occupant SET last_seen_at = ? WHERE account_id = ?")
        .bind(&stale)
        .bind(alice_id)
        .execute(&app.pool)
        .await
        .unwrap();

    chat_backend::api::voice::expire_stale(&app.state)
        .await
        .expect("expire_stale");

    let (_, snap, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    assert!(snap["channels"].as_array().unwrap().is_empty(), "{snap}");
}

#[tokio::test]
async fn join_cam_off_stays_off_grid_bank() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, me, _) = app.request("GET", "/api/auth/me", None, Some(&alice)).await;
    let alice_id = me["id"].as_str().unwrap().to_string();
    let (server_id, channel_id) = voice_channel(&app, &alice).await;

    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/voice/join"),
            Some(json!({ "mic_on": true, "cam_on": false })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    let (_, snap, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(snap["channels"][0]["occupants"][0]["cam_on"], false);

    let (_, grid, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/grid"),
            None,
            Some(&alice),
        )
        .await;
    let slots = grid["slots"].as_array().unwrap();
    assert!(
        slots.iter().all(|s| s["account_id"].as_str() != Some(alice_id.as_str())),
        "cam_on false must not auto-assign a slot: {grid}"
    );
}

#[tokio::test]
async fn join_cam_on_still_auto_assigns_slot() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, me, _) = app.request("GET", "/api/auth/me", None, Some(&alice)).await;
    let alice_id = me["id"].as_str().unwrap().to_string();
    let (_, channel_id) = voice_channel(&app, &alice).await;

    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        Some(json!({ "mic_on": true, "cam_on": true })),
        Some(&alice),
    )
    .await;

    let (_, grid, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/grid"),
            None,
            Some(&alice),
        )
        .await;
    let slots = grid["slots"].as_array().unwrap();
    assert_eq!(slots[0]["account_id"], alice_id);
}

#[tokio::test]
async fn patch_cam_on_auto_assigns_when_auto_scene() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, me, _) = app.request("GET", "/api/auth/me", None, Some(&alice)).await;
    let alice_id = me["id"].as_str().unwrap().to_string();
    let (_, channel_id) = voice_channel(&app, &alice).await;

    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        Some(json!({ "cam_on": false })),
        Some(&alice),
    )
    .await;

    let (status, _, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}/voice/media"),
            Some(json!({ "cam_on": true })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let (_, grid, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/grid"),
            None,
            Some(&alice),
        )
        .await;
    let slots = grid["slots"].as_array().unwrap();
    assert!(
        slots.iter().any(|s| s["account_id"].as_str() == Some(alice_id.as_str())),
        "turning cam on with auto scene must assign a slot: {grid}"
    );
}

#[tokio::test]
async fn patch_cam_on_stays_bank_when_owner_locked() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, me, _) = app.request("GET", "/api/auth/me", None, Some(&alice)).await;
    let alice_id = me["id"].as_str().unwrap().to_string();
    let (server_id, channel_id) = voice_channel(&app, &alice).await;

    let (_, scenes, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/scenes"),
            None,
            Some(&alice),
        )
        .await;
    let scene_id = scenes["active_scene_id"].as_str().unwrap();

    let layout = json!({
        "layout_key": "quad",
        "slot_count": 4,
        "assigned_by": "owner",
        "slots": [
            { "index": 0, "account_id": null },
            { "index": 1, "account_id": null },
            { "index": 2, "account_id": null },
            { "index": 3, "account_id": null }
        ]
    });
    let (status, patched, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}/scenes/{scene_id}"),
            Some(json!({ "layout": layout })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "owner lock scene: {patched}");

    let (_, grid0, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/grid"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(grid0["assigned_by"], "owner", "{grid0}");

    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        Some(json!({ "cam_on": false })),
        Some(&alice),
    )
    .await;

    app.request(
        "PATCH",
        &format!("/api/channels/{channel_id}/voice/media"),
        Some(json!({ "cam_on": true })),
        Some(&alice),
    )
    .await;

    let (_, grid, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/grid"),
            None,
            Some(&alice),
        )
        .await;
    let slots = grid["slots"].as_array().unwrap();
    assert!(
        slots.iter().all(|s| s["account_id"].as_str() != Some(alice_id.as_str())),
        "owner-locked scene must keep bank on cam on: {grid}"
    );
    let _ = server_id;
}

#[tokio::test]
async fn occupancy_has_avatar_follows_account_photo() {
    const JPEG: &[u8] = b"\xff\xd8\xff\xdb fake-jpeg";
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice_photo", "password1", None).await;
    let alice = must_cookie(alice);
    let (status, _, _) = app
        .request_bytes(
            "PUT",
            "/api/auth/avatar",
            JPEG.to_vec(),
            &[("content-type", "image/jpeg")],
            Some(&alice),
        )
        .await;
    assert!(status.is_success());

    let (server_id, channel_id) = voice_channel(&app, &alice).await;
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/voice/join"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    let (_, snap, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/voice-occupancy"),
            None,
            Some(&alice),
        )
        .await;
    let occ = snap["channels"][0]["occupants"].as_array().unwrap();
    assert_eq!(occ.len(), 1);
    assert_eq!(occ[0]["handle"], "alice_photo");
    assert_eq!(occ[0]["has_avatar"], true);
    assert_eq!(occ[0]["mic_on"], true);
}
