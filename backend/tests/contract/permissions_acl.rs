use crate::common::{create_server_body, must_cookie, TestApp};
use axum::http::StatusCode;
use base64::Engine;
use serde_json::{json, Value};

struct Setup {
    owner: String,
    member: String,
    member_id: String,
    server_id: String,
}

async fn setup_two_members(app: &TestApp) -> Setup {
    let (_, _, owner_cookie) = app.register("alice", "password1", None).await;
    let owner = must_cookie(owner_cookie);
    let (status, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(create_server_body("Mesa")),
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
    let (status, member_json, member_cookie) = app.register("bob", "password1", Some(code)).await;
    assert_eq!(status, StatusCode::CREATED, "{member_json}");
    Setup {
        owner,
        member: must_cookie(member_cookie),
        member_id: member_json["id"].as_str().unwrap().to_string(),
        server_id,
    }
}

async fn create_text(app: &TestApp, setup: &Setup, name: &str, visibility: &str) -> Value {
    let (status, channel, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/channels", setup.server_id),
            Some(json!({
                "name": name,
                "type": "text",
                "visibility": visibility
            })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{channel}");
    channel
}

#[tokio::test]
async fn permissions_kick_removes_server_access() {
    let app = TestApp::new().await;
    let setup = setup_two_members(&app).await;
    let owner_id: (String,) = sqlx::query_as("SELECT owner_account_id FROM server WHERE id = ?")
        .bind(&setup.server_id)
        .fetch_one(&app.pool)
        .await
        .unwrap();
    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/servers/{}/members/{}", setup.server_id, owner_id.0),
            None,
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CONFLICT);

    let (status, body, _) = app
        .request(
            "DELETE",
            &format!(
                "/api/servers/{}/members/{}",
                setup.server_id, setup.member_id
            ),
            None,
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT, "{body}");
    let (status, servers, _) = app
        .request("GET", "/api/servers", None, Some(&setup.member))
        .await;
    assert_eq!(status, StatusCode::OK, "{servers}");
    assert!(servers.as_array().unwrap().is_empty());
}

#[tokio::test]
async fn permissions_private_channel_is_filtered_and_hidden_as_404() {
    let app = TestApp::new().await;
    let setup = setup_two_members(&app).await;
    let channel = create_text(&app, &setup, "segredo", "private").await;
    let channel_id = channel["id"].as_str().unwrap();

    let (status, owner_channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{}/channels", setup.server_id),
            None,
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{owner_channels}");
    assert!(owner_channels
        .as_array()
        .unwrap()
        .iter()
        .any(|item| item["id"] == channel_id));

    let (status, member_channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{}/channels", setup.server_id),
            None,
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{member_channels}");
    assert!(!member_channels
        .as_array()
        .unwrap()
        .iter()
        .any(|item| item["id"] == channel_id));
    let (status, _, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/messages"),
            None,
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn permissions_read_only_member_cannot_post_message() {
    let app = TestApp::new().await;
    let setup = setup_two_members(&app).await;
    let channel = create_text(&app, &setup, "avisos", "public").await;
    let channel_id = channel["id"].as_str().unwrap();
    let (status, acl, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/acl"),
            Some(json!([{
                "subject_type": "account",
                "subject_id": setup.member_id,
                "level": "read"
            }])),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{acl}");

    let ciphertext = base64::engine::general_purpose::STANDARD.encode("blocked");
    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({ "content_ciphertext": ciphertext })),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{body}");
}

#[tokio::test]
async fn permissions_public_channels_always_visible_to_members() {
    // FR-008: public view is not gated by visible_to_new_members; hide via private + ACL.
    let app = TestApp::new().await;
    let (_, _, owner_cookie) = app.register("alice", "password1", None).await;
    let owner = must_cookie(owner_cookie);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(create_server_body("Mesa")),
            Some(&owner),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, archive, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "arquivo", "type": "text" })),
            Some(&owner),
        )
        .await;
    let archive_id = archive["id"].as_str().unwrap();
    let (status, _, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{archive_id}"),
            Some(json!({ "visible_to_new_members": false })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (_, private, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({
                "name": "privado",
                "type": "text",
                "visibility": "private"
            })),
            Some(&owner),
        )
        .await;
    let private_id = private["id"].as_str().unwrap();
    let (_, invite, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&owner),
        )
        .await;
    let (_, _, member_cookie) = app
        .register("bob", "password1", Some(invite["code"].as_str().unwrap()))
        .await;
    let member = must_cookie(member_cookie);
    let (status, channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&member),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{channels}");
    let ids: Vec<&str> = channels
        .as_array()
        .unwrap()
        .iter()
        .filter_map(|item| item["id"].as_str())
        .collect();
    assert!(
        ids.contains(&archive_id),
        "public channel stays visible even when visible_to_new_members=false"
    );
    assert!(!ids.contains(&private_id));
    assert!(
        !ids.is_empty(),
        "bootstrap public channels must remain visible"
    );
}

#[tokio::test]
async fn permissions_role_can_create_channels() {
    let app = TestApp::new().await;
    let setup = setup_two_members(&app).await;
    let (status, denied, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/channels", setup.server_id),
            Some(json!({ "name": "negado", "type": "text" })),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{denied}");

    let (status, role, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/roles", setup.server_id),
            Some(json!({
                "name": "Moderadores",
                "can_create_channels": true
            })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role}");
    let role_id = role["id"].as_str().unwrap();
    let (status, assigned, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{}/roles/{role_id}/members", setup.server_id),
            Some(json!({ "member_ids": [setup.member_id] })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{assigned}");
    let (status, channel, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/channels", setup.server_id),
            Some(json!({ "name": "dos-mods", "type": "text" })),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{channel}");

    let private = create_text(&app, &setup, "da-equipa", "private").await;
    let private_id = private["id"].as_str().unwrap();
    let (status, acl, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{private_id}/acl"),
            Some(json!([{
                "subject_type": "role",
                "subject_id": role_id,
                "level": "read"
            }])),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{acl}");
    let (status, visible, _) = app
        .request(
            "GET",
            &format!("/api/channels/{private_id}"),
            None,
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{visible}");
    assert_eq!(visible["my_permission"], "read");
}

#[tokio::test]
async fn permissions_listen_only_cannot_enable_mic_or_cam() {
    let app = TestApp::new().await;
    let setup = setup_two_members(&app).await;
    let (status, channel, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/channels", setup.server_id),
            Some(json!({
                "name": "plateia",
                "type": "voice_video",
                "visibility": "private",
                "custody_ack": true,
                "channel_key_sealed": "c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I="
            })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{channel}");
    let channel_id = channel["id"].as_str().unwrap();
    let (status, acl, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/acl"),
            Some(json!([{
                "subject_type": "account",
                "subject_id": setup.member_id,
                "level": "listen"
            }])),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{acl}");

    let (status, join_mic, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/voice/join"),
            Some(json!({ "mic_on": true, "cam_on": false })),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{join_mic}");

    let (status, join_ok, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/voice/join"),
            Some(json!({ "mic_on": false, "cam_on": false })),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{join_ok}");

    let (status, patch, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}/voice/media"),
            Some(json!({ "mic_on": true })),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{patch}");
}

#[tokio::test]
async fn permissions_role_capabilities_patch_and_invite_gate() {
    let app = TestApp::new().await;
    let setup = setup_two_members(&app).await;

    let (status, denied, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/invites", setup.server_id),
            Some(json!({})),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{denied}");

    let (status, role, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/roles", setup.server_id),
            Some(json!({
                "name": "Recrutadores",
                "capabilities": {
                    "can_view_channels": true,
                    "can_manage_channels": false,
                    "can_manage_roles": false,
                    "can_create_invites": true,
                    "can_send_messages": true,
                    "can_delete_messages": false,
                    "can_attach_files": true,
                    "can_remove_members": false,
                    "can_connect_voice": true,
                    "can_speak_voice": true
                }
            })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role}");
    assert_eq!(role["capabilities"]["can_create_invites"], true);
    let role_id = role["id"].as_str().unwrap();

    let (status, assigned, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{}/roles/{role_id}/members", setup.server_id),
            Some(json!({ "member_ids": [setup.member_id] })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{assigned}");

    let (status, invite, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/invites", setup.server_id),
            Some(json!({})),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{invite}");
}

#[tokio::test]
async fn permissions_role_can_delete_others_messages() {
    let app = TestApp::new().await;
    let setup = setup_two_members(&app).await;
    let channel = create_text(&app, &setup, "geral-mod", "public").await;
    let channel_id = channel["id"].as_str().unwrap();

    let ciphertext = base64::engine::general_purpose::STANDARD.encode("owner-msg");
    let (status, msg, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({ "content_ciphertext": ciphertext })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{msg}");
    let message_id = msg["id"].as_str().unwrap();

    let (status, forbidden, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{channel_id}/messages/{message_id}"),
            None,
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{forbidden}");

    let (status, role, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/roles", setup.server_id),
            Some(json!({
                "name": "Mods",
                "capabilities": {
                    "can_view_channels": true,
                    "can_manage_channels": false,
                    "can_manage_roles": false,
                    "can_create_invites": false,
                    "can_send_messages": true,
                    "can_delete_messages": true,
                    "can_attach_files": true,
                    "can_remove_members": false,
                    "can_connect_voice": true,
                    "can_speak_voice": true
                }
            })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role}");
    let role_id = role["id"].as_str().unwrap();
    let (status, assigned, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{}/roles/{role_id}/members", setup.server_id),
            Some(json!({ "member_ids": [setup.member_id] })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{assigned}");

    let (status, deleted, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{channel_id}/messages/{message_id}"),
            None,
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT, "{deleted}");
}
