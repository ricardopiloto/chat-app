use crate::common::{create_server_body, must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

#[tokio::test]
async fn create_server_bootstraps_system_dono() {
    let app = TestApp::new().await;
    let (_, account, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let owner_id = account["id"].as_str().unwrap();

    let (status, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{server}");
    let server_id = server["id"].as_str().unwrap();

    let (status, roles, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/roles"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{roles}");
    let list = roles.as_array().unwrap();
    let dono = list
        .iter()
        .find(|r| r["name"] == "Dono")
        .expect("Dono role");
    assert_eq!(dono["is_system"], true);
    assert_eq!(dono["capabilities"]["can_manage_roles"], true);
    assert_eq!(dono["capabilities"]["can_mute_members"], true);
    let members = dono["member_ids"].as_array().unwrap();
    assert!(members.iter().any(|id| id.as_str() == Some(owner_id)));
}

#[tokio::test]
async fn system_dono_is_protected() {
    let app = TestApp::new().await;
    let (_, account, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let owner_id = account["id"].as_str().unwrap().to_string();

    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();

    let (_, roles, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/roles"),
            None,
            Some(&cookie),
        )
        .await;
    let dono = roles
        .as_array()
        .unwrap()
        .iter()
        .find(|r| r["is_system"] == true)
        .unwrap();
    let dono_id = dono["id"].as_str().unwrap();

    let (status, body, _) = app
        .request(
            "DELETE",
            &format!("/api/servers/{server_id}/roles/{dono_id}"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{body}");

    let (status, body, _) = app
        .request(
            "PATCH",
            &format!("/api/servers/{server_id}/roles/{dono_id}"),
            Some(json!({ "capabilities": { "can_manage_roles": false } })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{body}");

    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/roles"),
            Some(json!({ "name": "Dono" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");

    let (status, invite, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{invite}");
    let (status, bob, bob_cookie) = app
        .register("bob", "password1", Some(invite["code"].as_str().unwrap()))
        .await;
    assert_eq!(status, StatusCode::CREATED, "{bob}");
    let bob_id = bob["id"].as_str().unwrap();
    let _bob = must_cookie(bob_cookie);

    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{server_id}/members/{bob_id}/role"),
            Some(json!({ "role_id": dono_id })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{body}");

    let (status, custom, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/roles"),
            Some(json!({ "name": "Mod" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{custom}");
    let mod_id = custom["id"].as_str().unwrap();

    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{server_id}/members/{owner_id}/role"),
            Some(json!({ "role_id": mod_id })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{body}");

    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{server_id}/members/{owner_id}/role"),
            Some(json!({ "role_id": null })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{body}");
}

#[tokio::test]
async fn backfill_assigns_dono_on_existing_server() {
    let app = TestApp::new().await;
    let (_, account, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let owner_id = account["id"].as_str().unwrap();

    // Simulate pre-feature server: create then strip roles
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(create_server_body("Old")),
            Some(&cookie),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();

    // Create another role and assign owner to it, then delete Dono membership by
    // ensuring via SQL that we can re-run ensure after wiping system flag path.
    let (status, custom, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/roles"),
            Some(json!({ "name": "LegacyAdmin" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{custom}");
    let legacy_id = custom["id"].as_str().unwrap();

    // Force owner onto legacy via SQL (bypass owner lock) then clear Dono, then backfill
    sqlx::query("DELETE FROM server_role_member WHERE server_id = ?")
        .bind(server_id)
        .execute(&app.pool)
        .await
        .unwrap();
    sqlx::query("DELETE FROM server_role WHERE server_id = ? AND is_system = 1")
        .bind(server_id)
        .execute(&app.pool)
        .await
        .unwrap();
    sqlx::query(
        "INSERT INTO server_role_member (role_id, account_id, server_id) VALUES (?, ?, ?)",
    )
    .bind(legacy_id)
    .bind(owner_id)
    .bind(server_id)
    .execute(&app.pool)
    .await
    .unwrap();

    chat_backend::db::server_role::backfill_dono_for_all_servers(&app.pool)
        .await
        .unwrap();

    let (status, roles, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/roles"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{roles}");
    let dono = roles
        .as_array()
        .unwrap()
        .iter()
        .find(|r| r["name"] == "Dono" && r["is_system"] == true)
        .expect("system Dono");
    assert!(dono["member_ids"]
        .as_array()
        .unwrap()
        .iter()
        .any(|id| id.as_str() == Some(owner_id)));
    let legacy = roles
        .as_array()
        .unwrap()
        .iter()
        .find(|r| r["name"] == "LegacyAdmin")
        .expect("legacy remains");
    assert!(!legacy["member_ids"]
        .as_array()
        .unwrap()
        .iter()
        .any(|id| id.as_str() == Some(owner_id)));
}
