use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

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
            Some(json!({ "name": "mesa", "type": "voice_video", "custody_ack": true, "channel_key_sealed": "c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I=" })),
            Some(cookie),
        )
        .await;
    (server_id, ch["id"].as_str().unwrap().to_string())
}

#[tokio::test]
async fn copy_and_duplicate_do_not_activate() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_server_id, channel_id) = voice_channel(&app, &alice).await;
    let (status, list, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/scenes"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{list}");
    let active = list["active_scene_id"].as_str().unwrap().to_string();
    assert_eq!(list["scenes"].as_array().unwrap().len(), 1);

    let (status, created, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes"),
            Some(json!({ "name": "Foco no mestre" })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{created}");
    assert_eq!(created["is_active"], false);
    let (_, list2, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/scenes"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(list2["active_scene_id"], active);
    assert_eq!(list2["scenes"].as_array().unwrap().len(), 2);

    let (status, dup, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes/{active}/duplicate"),
            Some(json!({ "name": "Mesa cópia" })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{dup}");
    assert_eq!(dup["is_active"], false);
    let (_, list3, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/scenes"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(list3["active_scene_id"], active);

    let (status, conflict, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes"),
            Some(json!({ "name": "Foco no mestre" })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::CONFLICT, "{conflict}");

    let (status, del_active, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{channel_id}/scenes/{active}"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::CONFLICT, "{del_active}");

    let copy_id = created["id"].as_str().unwrap();
    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{channel_id}/scenes/{copy_id}"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
}

#[tokio::test]
async fn member_cannot_create_scene() {
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
    let (_, _, bob) = app
        .register("bob", "password1", Some(inv["code"].as_str().unwrap()))
        .await;
    let bob = must_cookie(bob);
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes"),
            Some(json!({ "name": "Nope" })),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
}

#[tokio::test]
async fn sqlite_datetime_from_migration_can_copy_scene() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_server_id, channel_id) = voice_channel(&app, &alice).await;
    sqlx::query("UPDATE scene SET created_at = '2026-09-04 18:34:32', updated_at = '2026-09-04 18:34:32'")
        .execute(&app.pool)
        .await
        .unwrap();
    let (status, created, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes"),
            Some(json!({ "name": "Foco" })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{created}");
}
