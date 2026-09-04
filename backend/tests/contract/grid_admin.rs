use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

#[tokio::test]
async fn owner_overrides_grid_member_forbidden() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(json!({ "name": "Mesa" })),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "mesa", "type": "voice_video" })),
            Some(&alice),
        )
        .await;
    let channel_id = ch["id"].as_str().unwrap();
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
    let bob_id = bob_me["id"].as_str().unwrap();
    let layout = json!({
        "slot_count": 2,
        "assigned_by": "owner",
        "slots": [
            { "index": 0, "account_id": bob_id },
            { "index": 1, "account_id": null }
        ]
    });
    let (status, grid, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/grid"),
            Some(layout.clone()),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{grid}");
    assert_eq!(grid["slot_count"], 2);
    assert_eq!(grid["assigned_by"], "owner");
    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/grid"),
            Some(layout),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    let (_, grid2, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/grid"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(grid2["slot_count"], 2);
    assert_eq!(grid2["slots"][0]["account_id"], bob_id);
}
