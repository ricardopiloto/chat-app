use crate::common::{create_server_body, must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

struct Setup {
    owner: String,
    member: String,
    member_id: String,
    server_id: String,
}

async fn setup(app: &TestApp) -> Setup {
    let (_, _, owner_cookie) = app.register("hier_alice", "password1", None).await;
    let owner = must_cookie(owner_cookie);
    let (status, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(create_server_body("Hier")),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{server}");
    let server_id = server["id"].as_str().unwrap().to_string();
    let (status, invite, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{invite}");
    let code = invite["code"].as_str().unwrap();
    let (status, member_json, member_cookie) =
        app.register("hier_bob", "password1", Some(code)).await;
    assert_eq!(status, StatusCode::CREATED, "{member_json}");
    Setup {
        owner,
        member: must_cookie(member_cookie),
        member_id: member_json["id"].as_str().unwrap().to_string(),
        server_id,
    }
}

#[tokio::test]
async fn hierarchy_lower_cannot_kick_higher() {
    let app = TestApp::new().await;
    let setup = setup(&app).await;

    let (status, mestre, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/roles", setup.server_id),
            Some(json!({
                "name": "Mestre",
                "capabilities": {
                    "can_view_channels": true,
                    "can_manage_channels": false,
                    "can_manage_roles": true,
                    "can_create_invites": false,
                    "can_send_messages": true,
                    "can_delete_messages": false,
                    "can_attach_files": true,
                    "can_remove_members": true,
                    "can_mute_members": true,
                    "can_connect_voice": true,
                    "can_speak_voice": true
                }
            })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{mestre}");
    let mestre_id = mestre["id"].as_str().unwrap();

    let (status, moder, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/roles", setup.server_id),
            Some(json!({
                "name": "Moderador",
                "capabilities": {
                    "can_view_channels": true,
                    "can_manage_channels": false,
                    "can_manage_roles": false,
                    "can_create_invites": false,
                    "can_send_messages": true,
                    "can_delete_messages": false,
                    "can_attach_files": true,
                    "can_remove_members": true,
                    "can_mute_members": true,
                    "can_connect_voice": true,
                    "can_speak_voice": true
                }
            })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{moder}");
    let moder_id = moder["id"].as_str().unwrap().to_string();
    assert!(
        moder["position"].as_i64().unwrap() < mestre["position"].as_i64().unwrap(),
        "new role at bottom"
    );

    // Invite carol as Mestre, bob as Moderador
    let (status, invite, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/invites", setup.server_id),
            Some(json!({})),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{invite}");
    let (status, carol_json, carol_cookie) = app
        .register("hier_carol", "password1", Some(invite["code"].as_str().unwrap()))
        .await;
    assert_eq!(status, StatusCode::CREATED, "{carol_json}");
    let carol = must_cookie(carol_cookie);
    let carol_id = carol_json["id"].as_str().unwrap();

    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{}/members/{}/role", setup.server_id, carol_id),
            Some(json!({ "role_id": mestre_id })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (status, _, _) = app
        .request(
            "PUT",
            &format!(
                "/api/servers/{}/members/{}/role",
                setup.server_id, setup.member_id
            ),
            Some(json!({ "role_id": moder_id })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    let (status, body, _) = app
        .request(
            "DELETE",
            &format!("/api/servers/{}/members/{}", setup.server_id, carol_id),
            None,
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{body}");
    assert_eq!(body["error"], "hierarchy_denied");

    // Moder can kick member with no role — invite dave then kick
    let (status, invite2, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/invites", setup.server_id),
            Some(json!({})),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{invite2}");
    let (status, dave_json, _) = app
        .register("hier_dave", "password1", Some(invite2["code"].as_str().unwrap()))
        .await;
    assert_eq!(status, StatusCode::CREATED, "{dave_json}");
    let dave_id = dave_json["id"].as_str().unwrap();
    let (status, body, _) = app
        .request(
            "DELETE",
            &format!("/api/servers/{}/members/{}", setup.server_id, dave_id),
            None,
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT, "{body}");

    let _ = carol;
}

#[tokio::test]
async fn hierarchy_new_role_at_bottom() {
    let app = TestApp::new().await;
    let setup = setup(&app).await;
    let (status, r1, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/roles", setup.server_id),
            Some(json!({ "name": "Alpha" })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{r1}");
    let (status, r2, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/roles", setup.server_id),
            Some(json!({ "name": "Beta" })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{r2}");
    assert!(r2["position"].as_i64().unwrap() < r1["position"].as_i64().unwrap());
}
