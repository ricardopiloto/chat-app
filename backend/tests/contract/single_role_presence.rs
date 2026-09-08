use crate::common::{create_server_body, must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

async fn setup_owner_member(app: &TestApp) -> (String, String, String, String) {
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
    (
        owner,
        must_cookie(member_cookie),
        member_json["id"].as_str().unwrap().to_string(),
        server_id,
    )
}

#[tokio::test]
async fn single_role_put_replaces_previous() {
    let app = TestApp::new().await;
    let (owner, _member, member_id, server_id) = setup_owner_member(&app).await;

    let (status, role_a, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/roles"),
            Some(json!({
                "name": "Adminish",
                "capabilities": { "can_manage_channels": true, "can_create_invites": true }
            })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role_a}");
    let role_a_id = role_a["id"].as_str().unwrap();

    let (status, role_b, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/roles"),
            Some(json!({ "name": "Reader" })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role_b}");
    let role_b_id = role_b["id"].as_str().unwrap();

    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{server_id}/members/{member_id}/role"),
            Some(json!({ "role_id": role_a_id })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");

    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{server_id}/members/{member_id}/role"),
            Some(json!({ "role_id": role_b_id })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");

    let (status, roles, _) = app
        .request("GET", &format!("/api/servers/{server_id}/roles"), None, Some(&owner))
        .await;
    assert_eq!(status, StatusCode::OK, "{roles}");
    let roles = roles.as_array().unwrap();
    let a = roles.iter().find(|r| r["id"] == role_a_id).unwrap();
    let b = roles.iter().find(|r| r["id"] == role_b_id).unwrap();
    assert!(
        !a["member_ids"]
            .as_array()
            .unwrap()
            .iter()
            .any(|id| id.as_str() == Some(member_id.as_str()))
    );
    assert!(b["member_ids"]
        .as_array()
        .unwrap()
        .iter()
        .any(|id| id.as_str() == Some(member_id.as_str())));

    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{server_id}/members/{member_id}/role"),
            Some(json!({ "role_id": null })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
}

#[tokio::test]
async fn presence_endpoint_lists_empty_without_ws() {
    let app = TestApp::new().await;
    let (owner, _member, _member_id, server_id) = setup_owner_member(&app).await;
    let (status, body, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/presence"),
            None,
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert!(body["online_account_ids"].as_array().unwrap().is_empty());
}

#[tokio::test]
async fn set_role_members_enforces_single_role() {
    let app = TestApp::new().await;
    let (owner, _member, member_id, server_id) = setup_owner_member(&app).await;
    let (status, role_a, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/roles"),
            Some(json!({ "name": "A" })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role_a}");
    let role_a_id = role_a["id"].as_str().unwrap();
    let (status, role_b, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/roles"),
            Some(json!({ "name": "B" })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role_b}");
    let role_b_id = role_b["id"].as_str().unwrap();

    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{server_id}/roles/{role_a_id}/members"),
            Some(json!({ "member_ids": [member_id] })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{server_id}/roles/{role_b_id}/members"),
            Some(json!({ "member_ids": [member_id] })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    let (status, roles, _) = app
        .request("GET", &format!("/api/servers/{server_id}/roles"), None, Some(&owner))
        .await;
    assert_eq!(status, StatusCode::OK, "{roles}");
    let roles = roles.as_array().unwrap();
    let in_a = roles
        .iter()
        .find(|r| r["id"] == role_a_id)
        .unwrap()["member_ids"]
        .as_array()
        .unwrap()
        .iter()
        .any(|id| id.as_str() == Some(member_id.as_str()));
    let in_b = roles
        .iter()
        .find(|r| r["id"] == role_b_id)
        .unwrap()["member_ids"]
        .as_array()
        .unwrap()
        .iter()
        .any(|id| id.as_str() == Some(member_id.as_str()));
    assert!(!in_a && in_b);
}
