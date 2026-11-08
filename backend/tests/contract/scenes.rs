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
    sqlx::query(
        "UPDATE scene SET created_at = '2026-09-04 18:34:32', updated_at = '2026-09-04 18:34:32'",
    )
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

#[tokio::test]
async fn only_recorded_channel_creator_can_mutate_scenes() {
    let app = TestApp::new().await;
    let (_, _, owner_cookie) = app.register("scene_owner", "password1", None).await;
    let owner = must_cookie(owner_cookie);
    let (server_id, historical_channel) = voice_channel(&app, &owner).await;
    let (_, owner_account, _) = app.request("GET", "/api/auth/me", None, Some(&owner)).await;
    // Migration 0006 backfilled old channels with the server owner as recorded creator.
    sqlx::query("UPDATE channel SET created_by_account_id = (SELECT owner_account_id FROM server WHERE server.id = channel.server_id) WHERE id = ?")
        .bind(&historical_channel)
        .execute(&app.pool)
        .await
        .unwrap();
    let (_, historical, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&owner),
        )
        .await;
    assert_eq!(
        historical
            .as_array()
            .unwrap()
            .iter()
            .find(|c| c["id"] == historical_channel)
            .unwrap()["created_by_account_id"],
        owner_account["id"]
    );
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{historical_channel}/scenes"),
            Some(json!({"name":"Legacy"})),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED);

    let (_, invite, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&owner),
        )
        .await;
    let code = invite["code"].as_str().unwrap();
    let (_, creator_account, creator_cookie) =
        app.register("scene_creator", "password1", Some(code)).await;
    let creator = must_cookie(creator_cookie);
    let (_, manager_account, manager_cookie) =
        app.register("scene_manager", "password1", Some(code)).await;
    let manager = must_cookie(manager_cookie);
    let (_, _, member_cookie) = app.register("scene_member", "password1", Some(code)).await;
    let member = must_cookie(member_cookie);

    let (_, role, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/roles"),
            Some(json!({"name":"Scene managers", "capabilities":{"can_manage_channels":true}})),
            Some(&owner),
        )
        .await;
    let (status, _, _) = app
        .request(
            "PUT",
            &format!(
                "/api/servers/{server_id}/members/{}/role",
                manager_account["id"].as_str().unwrap()
            ),
            Some(json!({"role_id":role["id"]})),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (_, create_role, _) = app.request("POST", &format!("/api/servers/{server_id}/roles"), Some(json!({"name":"Scene creators", "can_create_channels":true, "capabilities":{"can_create_channels":true}})), Some(&owner)).await;
    let (status, _, _) = app
        .request(
            "PUT",
            &format!(
                "/api/servers/{server_id}/members/{}/role",
                creator_account["id"].as_str().unwrap()
            ),
            Some(json!({"role_id":create_role["id"]})),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    let (status, channel, _) = app.request("POST", &format!("/api/servers/{server_id}/channels"), Some(json!({"name":"Creator voice", "type":"voice_video", "custody_ack":true, "channel_key_sealed":"c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I="})), Some(&creator)).await;
    assert_eq!(status, StatusCode::CREATED, "{channel}");
    assert_eq!(channel["created_by_account_id"], creator_account["id"]);
    let channel_id = channel["id"].as_str().unwrap();
    let (_, list, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/scenes"),
            None,
            Some(&member),
        )
        .await;
    let active = list["active_scene_id"].as_str().unwrap();
    for (label, cookie) in [
        ("owner", &owner),
        ("manager", &manager),
        ("member", &member),
    ] {
        for (method, path, body) in [
            (
                "POST",
                format!("/api/channels/{channel_id}/scenes"),
                Some(json!({"name":"Denied"})),
            ),
            (
                "PATCH",
                format!("/api/channels/{channel_id}/scenes/{active}"),
                Some(json!({"name":"Denied"})),
            ),
            (
                "DELETE",
                format!("/api/channels/{channel_id}/scenes/{active}"),
                None,
            ),
            (
                "POST",
                format!("/api/channels/{channel_id}/scenes/{active}/duplicate"),
                Some(json!({"name":"Denied"})),
            ),
            (
                "POST",
                format!("/api/channels/{channel_id}/scenes/{active}/activate"),
                None,
            ),
        ] {
            let (status, response, _) = app.request(method, &path, body, Some(cookie)).await;
            assert_eq!(
                status,
                StatusCode::FORBIDDEN,
                "{label} {method} {path}: {response}"
            );
        }
        let (status, _, _) = app
            .request(
                "GET",
                &format!("/api/channels/{channel_id}/scenes/{active}"),
                None,
                Some(cookie),
            )
            .await;
        assert_eq!(status, StatusCode::OK, "{label} can read scenes");
    }
    let (status, created, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes"),
            Some(json!({"name":"Creator copy"})),
            Some(&creator),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{created}");
    let copy = created["id"].as_str().unwrap();
    let (status, _, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}/scenes/{copy}"),
            Some(json!({"name":"Renamed"})),
            Some(&creator),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes/{copy}/duplicate"),
            Some(json!({"name":"Duplicate"})),
            Some(&creator),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED);
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes/{copy}/activate"),
            None,
            Some(&creator),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{channel_id}/scenes/{active}"),
            None,
            Some(&creator),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
}
