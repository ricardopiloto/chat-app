use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

#[tokio::test]
async fn co_director_activate_only() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "mesa", "type": "voice_video", "custody_ack": true, "channel_key_sealed": "c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I=" })),
            Some(&alice),
        )
        .await;
    let channel_id = ch["id"].as_str().unwrap();
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
    let (_, bob_me, _) = app.request("GET", "/api/auth/me", None, Some(&bob)).await;
    let bob_id = bob_me["id"].as_str().unwrap();

    let (_, created, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes"),
            Some(json!({ "name": "Foco" })),
            Some(&alice),
        )
        .await;
    let foco_id = created["id"].as_str().unwrap();

    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes/{foco_id}/activate"),
            None,
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);

    let (status, roles, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/roles"),
            Some(json!({ "account_ids": [bob_id] })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{roles}");

    // Fase 005: co-diretor no longer may activate — owner only.
    let (status, act, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes/{foco_id}/activate"),
            None,
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{act}");

    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/scenes"),
            Some(json!({ "name": "Outra" })),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);

    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/roles"),
            Some(json!({ "account_ids": [] })),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);

    let (_, _, carol_cookie) = app
        .register("carol", "password1", Some(inv["code"].as_str().unwrap()))
        .await;
    let carol = must_cookie(carol_cookie);
    let (_, carol_me, _) = app.request("GET", "/api/auth/me", None, Some(&carol)).await;
    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/roles"),
            Some(json!({ "account_ids": [carol_me["id"].as_str().unwrap()] })),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
}
