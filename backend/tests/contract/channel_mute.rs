use crate::common::{create_server_body, must_cookie, TestApp};
use axum::http::StatusCode;
use base64::Engine;
use serde_json::json;

fn b64(data: &str) -> String {
    base64::engine::general_purpose::STANDARD.encode(data.as_bytes())
}

struct Setup {
    owner: String,
    member: String,
    member_id: String,
    server_id: String,
    channel_a: String,
    channel_b: String,
}

async fn setup(app: &TestApp) -> Setup {
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

    let (status, ch_a, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "geral", "type": "text" })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{ch_a}");
    let (status, ch_b, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "outro", "type": "text" })),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{ch_b}");

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
        channel_a: ch_a["id"].as_str().unwrap().to_string(),
        channel_b: ch_b["id"].as_str().unwrap().to_string(),
    }
}

#[tokio::test]
async fn kick_retains_account_and_login() {
    let app = TestApp::new().await;
    let setup = setup(&app).await;

    let (count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM account WHERE id = ?")
        .bind(&setup.member_id)
        .fetch_one(&app.pool)
        .await
        .unwrap();
    assert_eq!(count, 1);

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

    let (count,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM account WHERE id = ?")
        .bind(&setup.member_id)
        .fetch_one(&app.pool)
        .await
        .unwrap();
    assert_eq!(count, 1);

    let (status, servers, _) = app
        .request("GET", "/api/servers", None, Some(&setup.member))
        .await;
    assert_eq!(status, StatusCode::OK, "{servers}");
    assert!(servers.as_array().unwrap().is_empty());

    let (status, login, _) = app.login("bob", "password1").await;
    assert_eq!(status, StatusCode::OK, "{login}");
    assert_eq!(login["id"].as_str().unwrap(), setup.member_id);
}

#[tokio::test]
async fn mute_blocks_send_in_channel_only() {
    let app = TestApp::new().await;
    let setup = setup(&app).await;

    let (status, mute, _) = app
        .request(
            "PUT",
            &format!(
                "/api/channels/{}/mutes/{}",
                setup.channel_a, setup.member_id
            ),
            Some(json!({ "duration_minutes": 5 })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{mute}");
    assert!(mute["ends_at"].as_str().is_some());

    let (status, denied, _) = app
        .request(
            "POST",
            &format!("/api/channels/{}/messages", setup.channel_a),
            Some(json!({ "content_ciphertext": b64("blocked") })),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{denied}");

    let (status, ok_other, _) = app
        .request(
            "POST",
            &format!("/api/channels/{}/messages", setup.channel_b),
            Some(json!({ "content_ciphertext": b64("ok") })),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{ok_other}");

    let (status, me, _) = app
        .request(
            "GET",
            &format!("/api/channels/{}/mutes/me", setup.channel_a),
            None,
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{me}");
    assert_eq!(me["muted"], true);

    let (status, _, _) = app
        .request(
            "DELETE",
            &format!(
                "/api/channels/{}/mutes/{}",
                setup.channel_a, setup.member_id
            ),
            None,
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let (status, after, _) = app
        .request(
            "POST",
            &format!("/api/channels/{}/messages", setup.channel_a),
            Some(json!({ "content_ciphertext": b64("again") })),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{after}");
}

#[tokio::test]
async fn mute_requires_cap_and_valid_duration() {
    let app = TestApp::new().await;
    let setup = setup(&app).await;

    let (status, denied, _) = app
        .request(
            "PUT",
            &format!(
                "/api/channels/{}/mutes/{}",
                setup.channel_a, setup.member_id
            ),
            Some(json!({ "duration_minutes": 10 })),
            Some(&setup.member),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{denied}");

    let (status, role, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/roles", setup.server_id),
            Some(json!({
                "name": "Mods",
                "capabilities": { "can_mute_members": true }
            })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role}");
    let role_id = role["id"].as_str().unwrap();
    assert_eq!(role["capabilities"]["can_mute_members"], true);

    // Register carol as moderator
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
        .register("carol", "password1", Some(invite["code"].as_str().unwrap()))
        .await;
    assert_eq!(status, StatusCode::CREATED, "{carol_json}");
    let carol = must_cookie(carol_cookie);
    let carol_id = carol_json["id"].as_str().unwrap();

    let (status, _, _) = app
        .request(
            "PUT",
            &format!(
                "/api/servers/{}/members/{}/role",
                setup.server_id, carol_id
            ),
            Some(json!({ "role_id": role_id })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    let (status, mute, _) = app
        .request(
            "PUT",
            &format!(
                "/api/channels/{}/mutes/{}",
                setup.channel_a, setup.member_id
            ),
            Some(json!({ "duration_minutes": 120 })),
            Some(&carol),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{mute}");

    for bad in [0_i64, 1441] {
        let (status, err, _) = app
            .request(
                "PUT",
                &format!(
                    "/api/channels/{}/mutes/{}",
                    setup.channel_a, setup.member_id
                ),
                Some(json!({ "duration_minutes": bad })),
                Some(&setup.owner),
            )
            .await;
        assert_eq!(status, StatusCode::BAD_REQUEST, "{err}");
    }

    let owner_id: (String,) = sqlx::query_as("SELECT owner_account_id FROM server WHERE id = ?")
        .bind(&setup.server_id)
        .fetch_one(&app.pool)
        .await
        .unwrap();
    let (status, err, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{}/mutes/{}", setup.channel_a, owner_id.0),
            Some(json!({ "duration_minutes": 5 })),
            Some(&carol),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{err}");

    let (status, err, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{}/mutes/{}", setup.channel_a, carol_id),
            Some(json!({ "duration_minutes": 5 })),
            Some(&carol),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{err}");
}
