use crate::common::{create_server_body, must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

struct Setup {
    owner: String,
    member: String,
    member_id: String,
    third: String,
    third_id: String,
    server_id: String,
}

async fn setup_three(app: &TestApp) -> Setup {
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

    let (status, invite2, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{invite2}");
    let code2 = invite2["code"].as_str().unwrap();
    let (status, third_json, third_cookie) = app.register("carol", "password1", Some(code2)).await;
    assert_eq!(status, StatusCode::CREATED, "{third_json}");

    Setup {
        owner,
        member: must_cookie(member_cookie),
        member_id: member_json["id"].as_str().unwrap().to_string(),
        third: must_cookie(third_cookie),
        third_id: third_json["id"].as_str().unwrap().to_string(),
        server_id,
    }
}

async fn grant_create_channels(app: &TestApp, setup: &Setup, account_id: &str) {
    let (status, role, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/roles", setup.server_id),
            Some(json!({
                "name": "Criadores",
                "can_create_channels": true
            })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role}");
    let role_id = role["id"].as_str().unwrap();
    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{}/members/{account_id}/role", setup.server_id),
            Some(json!({ "role_id": role_id })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
}

#[tokio::test]
async fn channel_rename_creator_owner_manage_and_forbidden() {
    let app = TestApp::new().await;
    let setup = setup_three(&app).await;
    grant_create_channels(&app, &setup, &setup.member_id).await;

    let (status, channel, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/channels", setup.server_id),
            Some(json!({ "name": "geral", "type": "text" })),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{channel}");
    let channel_id = channel["id"].as_str().unwrap();

    // Creator renames own channel
    let (status, renamed, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}"),
            Some(json!({ "name": "avisos" })),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{renamed}");
    assert_eq!(renamed["name"], "avisos");

    // Unrelated member → 403
    let (status, denied, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}"),
            Some(json!({ "name": "hack" })),
            Some(&setup.third),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{denied}");

    // Owner renames any channel
    let (status, by_owner, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}"),
            Some(json!({ "name": "mesa" })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{by_owner}");
    assert_eq!(by_owner["name"], "mesa");

    // Empty / whitespace → 400
    let (status, bad, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}"),
            Some(json!({ "name": "   " })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{bad}");

    // Duplicate name allowed
    let (status, other, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/channels", setup.server_id),
            Some(json!({ "name": "dup", "type": "text" })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{other}");
    let (status, dup_ok, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}"),
            Some(json!({ "name": "dup" })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{dup_ok}");
    assert_eq!(dup_ok["name"], "dup");

    // Member with can_manage_channels above creator (hierarchy)
    let (status, role, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/roles", setup.server_id),
            Some(json!({
                "name": "Gestores",
                "capabilities": { "can_manage_channels": true }
            })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role}");
    let gestores_id = role["id"].as_str().unwrap();
    let gestores_pos = role["position"].as_i64().unwrap();

    let (status, roles_list, _) = app
        .request(
            "GET",
            &format!("/api/servers/{}/roles", setup.server_id),
            None,
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{roles_list}");
    let criadores = roles_list
        .as_array()
        .unwrap()
        .iter()
        .find(|r| r["name"] == "Criadores")
        .expect("Criadores");
    let criadores_id = criadores["id"].as_str().unwrap();
    let criadores_pos = criadores["position"].as_i64().unwrap();
    // Place Gestores strictly above Criadores
    let high = criadores_pos.max(gestores_pos) + 10;
    let (status, reordered, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{}/roles/positions", setup.server_id),
            Some(json!({
                "roles": [
                    { "id": gestores_id, "position": high },
                    { "id": criadores_id, "position": high - 1 }
                ]
            })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{reordered}");

    let (status, assigned, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{}/members/{}/role", setup.server_id, setup.third_id),
            Some(json!({ "role_id": gestores_id })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{assigned}");

    let (status, by_manager, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{channel_id}"),
            Some(json!({ "name": "gerido" })),
            Some(&setup.third),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{by_manager}");
    assert_eq!(by_manager["name"], "gerido");
}
