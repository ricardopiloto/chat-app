use crate::common::{create_server_body, must_cookie, TestApp};
use axum::http::StatusCode;
use base64::Engine;
use serde_json::json;

struct Setup {
    owner: String,
    member: String,
    member_id: String,
    server_id: String,
}

async fn setup(app: &TestApp) -> Setup {
    let (_, _, owner_cookie) = app.register("ow_alice", "password1", None).await;
    let owner = must_cookie(owner_cookie);
    let (status, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(create_server_body("OW")),
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
    let (status, member_json, member_cookie) = app
        .register("ow_bob", "password1", Some(invite["code"].as_str().unwrap()))
        .await;
    assert_eq!(status, StatusCode::CREATED, "{member_json}");
    Setup {
        owner,
        member: must_cookie(member_cookie),
        member_id: member_json["id"].as_str().unwrap().to_string(),
        server_id,
    }
}

#[tokio::test]
async fn overwrite_deny_view_hides_private_channel() {
    let app = TestApp::new().await;
    let setup = setup(&app).await;
    let (status, role, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/roles", setup.server_id),
            Some(json!({ "name": "Jogador" })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role}");
    let role_id = role["id"].as_str().unwrap();
    let (status, _, _) = app
        .request(
            "PUT",
            &format!(
                "/api/servers/{}/members/{}/role",
                setup.server_id, setup.member_id
            ),
            Some(json!({ "role_id": role_id })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    let (status, channel, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/channels", setup.server_id),
            Some(json!({ "name": "gm", "type": "text", "visibility": "private" })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{channel}");
    let channel_id = channel["id"].as_str().unwrap();

    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/acl"),
            Some(json!([
                {
                    "subject_type": "role",
                    "subject_id": role_id,
                    "level": "read",
                    "effect": "deny"
                }
            ])),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    let (status, list, _) = app
        .request(
            "GET",
            &format!("/api/servers/{}/channels", setup.server_id),
            None,
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{list}");
    assert!(!list
        .as_array()
        .unwrap()
        .iter()
        .any(|c| c["id"] == channel_id));
}

#[tokio::test]
async fn overwrite_public_deny_view_rejected() {
    let app = TestApp::new().await;
    let setup = setup(&app).await;
    let (status, channel, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/channels", setup.server_id),
            Some(json!({ "name": "geral", "type": "text", "visibility": "public" })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{channel}");
    let channel_id = channel["id"].as_str().unwrap();
    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/acl"),
            Some(json!([{
                "subject_type": "everyone",
                "subject_id": "00000000-0000-0000-0000-000000000000",
                "level": "read",
                "effect": "deny"
            }])),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
}

#[tokio::test]
async fn overwrite_everyone_deny_write_role_allow() {
    let app = TestApp::new().await;
    let setup = setup(&app).await;
    let (status, role, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/roles", setup.server_id),
            Some(json!({ "name": "Mestre" })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role}");
    let role_id = role["id"].as_str().unwrap();
    let (status, _, _) = app
        .request(
            "PUT",
            &format!(
                "/api/servers/{}/members/{}/role",
                setup.server_id, setup.member_id
            ),
            Some(json!({ "role_id": role_id })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    let (status, channel, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/channels", setup.server_id),
            Some(json!({ "name": "mesa", "type": "text", "visibility": "public" })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{channel}");
    let channel_id = channel["id"].as_str().unwrap();

    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/acl"),
            Some(json!([
                {
                    "subject_type": "everyone",
                    "subject_id": "00000000-0000-0000-0000-000000000000",
                    "level": "write",
                    "effect": "deny"
                },
                {
                    "subject_type": "role",
                    "subject_id": role_id,
                    "level": "write",
                    "effect": "allow"
                }
            ])),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    let ct = base64::engine::general_purpose::STANDARD.encode(b"hi");
    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({ "content_ciphertext": ct })),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
}

#[tokio::test]
async fn access_inspect_returns_factors() {
    let app = TestApp::new().await;
    let setup = setup(&app).await;
    let (status, channel, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/channels", setup.server_id),
            Some(json!({ "name": "insp", "type": "text", "visibility": "public" })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{channel}");
    let channel_id = channel["id"].as_str().unwrap();
    let (status, body, _) = app
        .request(
            "GET",
            &format!(
                "/api/channels/{}/access/{}",
                channel_id, setup.member_id
            ),
            None,
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["view"], true);
    assert!(body["factors"].as_array().unwrap().len() >= 1);
}
