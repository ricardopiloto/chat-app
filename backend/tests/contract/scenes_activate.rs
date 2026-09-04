use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

#[tokio::test]
async fn activate_updates_grid_put_edits_active() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, me, _) = app.request("GET", "/api/auth/me", None, Some(&alice)).await;
    let alice_id = me["id"].as_str().unwrap();
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
    let channel_id = ch["id"].as_str().unwrap();
    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/voice/join"),
        None,
        Some(&alice),
    )
    .await;
    let (_, created, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes"),
            Some(json!({ "name": "Foco" })),
            Some(&alice),
        )
        .await;
    let foco_id = created["id"].as_str().unwrap();
    let layout = json!({
        "layout_key": "quad",
        "slot_count": 4,
        "assigned_by": "owner",
        "slots": [
            { "index": 0, "account_id": alice_id },
            { "index": 1, "account_id": null },
            { "index": 2, "account_id": null },
            { "index": 3, "account_id": null }
        ]
    });
    let (status, patched, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}/scenes/{foco_id}"),
            Some(json!({ "layout": layout })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{patched}");
    let (_, grid_before, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/grid"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(grid_before["slot_count"], 4);
    assert_eq!(grid_before["layout_key"], "quad");

    let (status, activated, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes/{foco_id}/activate"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{activated}");
    assert_eq!(activated["is_active"], true);
    let (_, grid, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/grid"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(grid["slot_count"], 4);
    assert_eq!(grid["layout_key"], "quad");
    assert_eq!(grid["slots"][0]["account_id"], alice_id);

    let (status, put, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/grid"),
            Some(json!({
                "layout_key": "mestre",
                "slot_count": 5,
                "assigned_by": "owner",
                "slots": [
                    { "index": 0, "account_id": alice_id },
                    { "index": 1, "account_id": null },
                    { "index": 2, "account_id": null },
                    { "index": 3, "account_id": null },
                    { "index": 4, "account_id": null }
                ]
            })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{put}");
    assert_eq!(put["slot_count"], 5);
    assert_eq!(put["layout_key"], "mestre");
}
