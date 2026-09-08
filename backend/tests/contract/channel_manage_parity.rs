use crate::common::{create_server_body, must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

struct ParitySetup {
    owner: String,
    creator: String,
    creator_id: String,
    manager_high: String,
    manager_low: String,
    server_id: String,
    channel_id: String,
}

async fn setup_hierarchy_manage(app: &TestApp) -> ParitySetup {
    let (_, _, owner_cookie) = app.register("parity_alice", "password1", None).await;
    let owner = must_cookie(owner_cookie);
    let (status, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(create_server_body("Parity")),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{server}");
    let server_id = server["id"].as_str().unwrap().to_string();

    // High manage role first → higher position than later roles
    let (status, high_role, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/roles"),
            Some(json!({
                "name": "GestorAlto",
                "capabilities": { "can_manage_channels": true, "can_create_channels": true }
            })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{high_role}");
    let high_id = high_role["id"].as_str().unwrap().to_string();

    let (status, mid_role, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/roles"),
            Some(json!({
                "name": "Criador",
                "can_create_channels": true,
                "capabilities": { "can_create_channels": true }
            })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{mid_role}");
    let mid_id = mid_role["id"].as_str().unwrap().to_string();

    let (status, low_role, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/roles"),
            Some(json!({
                "name": "GestorBaixo",
                "capabilities": { "can_manage_channels": true }
            })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{low_role}");
    let low_id = low_role["id"].as_str().unwrap().to_string();

    assert!(
        high_role["position"].as_i64().unwrap() > mid_role["position"].as_i64().unwrap(),
        "high above mid"
    );
    assert!(
        mid_role["position"].as_i64().unwrap() > low_role["position"].as_i64().unwrap(),
        "mid above low"
    );

    async fn invite_and_join(app: &TestApp, owner: &str, server_id: &str, handle: &str) -> (String, String) {
        let (status, invite, _) = app
            .request(
                "POST",
                &format!("/api/servers/{server_id}/invites"),
                Some(json!({})),
                Some(owner),
            )
            .await;
        assert_eq!(status, StatusCode::CREATED, "{invite}");
        let (status, user, cookie) = app
            .register(handle, "password1", Some(invite["code"].as_str().unwrap()))
            .await;
        assert_eq!(status, StatusCode::CREATED, "{user}");
        (
            must_cookie(cookie),
            user["id"].as_str().unwrap().to_string(),
        )
    }

    let (creator, creator_id) = invite_and_join(app, &owner, &server_id, "parity_bob").await;
    let (manager_high, high_uid) = invite_and_join(app, &owner, &server_id, "parity_carol").await;
    let (manager_low, low_uid) = invite_and_join(app, &owner, &server_id, "parity_dave").await;

    for (uid, role) in [
        (&creator_id, &mid_id),
        (&high_uid, &high_id),
        (&low_uid, &low_id),
    ] {
        let (status, body, _) = app
            .request(
                "PUT",
                &format!("/api/servers/{server_id}/members/{uid}/role"),
                Some(json!({ "role_id": role })),
                Some(&owner),
            )
            .await;
        assert_eq!(status, StatusCode::OK, "{body}");
    }

    let (status, channel, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "privado-acl", "type": "text" })),
            Some(&creator),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{channel}");

    ParitySetup {
        owner,
        creator,
        creator_id,
        manager_high,
        manager_low,
        server_id,
        channel_id: channel["id"].as_str().unwrap().to_string(),
    }
}

#[tokio::test]
async fn channel_manage_acl_hierarchy_gate() {
    let app = TestApp::new().await;
    let setup = setup_hierarchy_manage(&app).await;
    let path = format!("/api/channels/{}/acl", setup.channel_id);

    let (status, _, _) = app.request("GET", &path, None, Some(&setup.manager_high)).await;
    assert_eq!(status, StatusCode::OK);

    let (status, denied, _) = app.request("GET", &path, None, Some(&setup.manager_low)).await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{denied}");

    let everyone = json!([{
        "subject_type": "everyone",
        "level": "write",
        "effect": "allow"
    }]);
    let (status, ok, _) = app
        .request("PUT", &path, Some(everyone.clone()), Some(&setup.manager_high))
        .await;
    assert_eq!(status, StatusCode::OK, "{ok}");

    let (status, denied, _) = app
        .request("PUT", &path, Some(everyone), Some(&setup.manager_low))
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{denied}");

    // Creator still manages own channel
    let (status, _, _) = app.request("GET", &path, None, Some(&setup.creator)).await;
    assert_eq!(status, StatusCode::OK);

    // Owner always
    let (status, _, _) = app.request("GET", &path, None, Some(&setup.owner)).await;
    assert_eq!(status, StatusCode::OK);
}

#[tokio::test]
async fn channel_manage_acl_subject_hierarchy() {
    let app = TestApp::new().await;
    let setup = setup_hierarchy_manage(&app).await;
    let path = format!("/api/channels/{}/acl", setup.channel_id);

    // Target creator (mid) — manager_high is above → OK
    let (status, ok, _) = app
        .request(
            "PUT",
            &path,
            Some(json!([{
                "subject_type": "account",
                "subject_id": setup.creator_id,
                "level": "write",
                "effect": "allow"
            }])),
            Some(&setup.manager_high),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{ok}");

    // Target high manager role via role entry — need role id of GestorAlto
    let (status, roles, _) = app
        .request(
            "GET",
            &format!("/api/servers/{}/roles", setup.server_id),
            None,
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{roles}");
    let high_role = roles
        .as_array()
        .unwrap()
        .iter()
        .find(|r| r["name"] == "GestorAlto")
        .unwrap();
    let high_role_id = high_role["id"].as_str().unwrap();

    // Creator cannot overwrite GestorAlto (above them) — creator bypasses subject hierarchy!
    // Spec: creator ignores FR-010(b) on own channel. So creator CAN target high role.
    let (status, by_creator, _) = app
        .request(
            "PUT",
            &path,
            Some(json!([{
                "subject_type": "role",
                "subject_id": high_role_id,
                "level": "read",
                "effect": "allow"
            }])),
            Some(&setup.creator),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{by_creator}");

    // Manager low cannot manage channel at all — already 403 on PUT
    let (status, denied, _) = app
        .request(
            "PUT",
            &path,
            Some(json!([{
                "subject_type": "role",
                "subject_id": high_role_id,
                "level": "read",
                "effect": "allow"
            }])),
            Some(&setup.manager_low),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{denied}");
}

#[tokio::test]
async fn channel_manage_delete_and_inspect_hierarchy() {
    let app = TestApp::new().await;
    let setup = setup_hierarchy_manage(&app).await;

    // Extra channel so delete is allowed
    let (status, extra, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/channels", setup.server_id),
            Some(json!({ "name": "extra", "type": "text" })),
            Some(&setup.creator),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{extra}");
    let extra_id = extra["id"].as_str().unwrap();

    let (status, denied, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{extra_id}"),
            None,
            Some(&setup.manager_low),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{denied}");

    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{extra_id}"),
            None,
            Some(&setup.manager_high),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let inspect = format!(
        "/api/channels/{}/access/{}",
        setup.channel_id, setup.creator_id
    );
    let (status, _, _) = app
        .request("GET", &inspect, None, Some(&setup.manager_high))
        .await;
    assert_eq!(status, StatusCode::OK);
    let (status, denied, _) = app
        .request("GET", &inspect, None, Some(&setup.manager_low))
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{denied}");
}
