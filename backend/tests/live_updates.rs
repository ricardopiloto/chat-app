mod common;

use axum::http::StatusCode;
use common::{create_server_body, must_cookie, TestApp};
use serde_json::{json, Value};
use tokio::time::{timeout, Duration};
use uuid::Uuid;

async fn next_event(subscription: &mut chat_backend::ws::WsSubscription, expected: &str) -> Value {
    loop {
        let text = timeout(Duration::from_secs(1), subscription.messages.recv())
            .await
            .expect("event timeout")
            .expect("closed websocket subscription");
        let message: Value = serde_json::from_str(&text).unwrap();
        if message["event"] == expected {
            return message;
        }
    }
}

#[tokio::test]
async fn role_acl_and_removal_notify_two_clients() {
    let app = TestApp::new().await;
    let (_, owner_json, owner_cookie) = app.register("live_owner", "password1", None).await;
    let owner = must_cookie(owner_cookie);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(create_server_body("Live")),
            Some(&owner),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, invite, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&owner),
        )
        .await;
    let (_, member, member_cookie) = app
        .register("live_member", "password1", invite["code"].as_str())
        .await;
    let _member_cookie = must_cookie(member_cookie);
    let owner_id = Uuid::parse_str(owner_json["id"].as_str().unwrap()).unwrap();
    let member_id = Uuid::parse_str(member["id"].as_str().unwrap()).unwrap();
    let mut owner_ws = app.state.ws.subscribe(owner_id, Uuid::new_v4());
    let mut member_ws = app.state.ws.subscribe(member_id, Uuid::new_v4());

    let (status, role, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/roles"),
            Some(json!({"name":"Listener"})),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role}");
    let role_id = role["id"].as_str().unwrap();
    for ws in [&mut owner_ws, &mut member_ws] {
        assert_eq!(
            next_event(ws, "role.changed").await["payload"]["role_id"],
            role_id
        );
    }

    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{server_id}/members/{member_id}/role"),
            Some(json!({"role_id":role_id})),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    for ws in [&mut owner_ws, &mut member_ws] {
        assert_eq!(
            next_event(ws, "member_role.changed").await["payload"]["account_id"],
            member_id.to_string()
        );
    }

    let (_, channel, _) = app.request("POST", &format!("/api/servers/{server_id}/channels"), Some(json!({"name":"Voice", "type":"voice_video", "custody_ack":true, "channel_key_sealed":"c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I="})), Some(&owner)).await;
    let channel_id = channel["id"].as_str().unwrap();
    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{channel_id}/acl"),
            Some(json!([])),
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    for ws in [&mut owner_ws, &mut member_ws] {
        assert_eq!(
            next_event(ws, "channel_acl.changed").await["payload"]["channel_id"],
            channel_id
        );
    }

    let (status, body, _) = app
        .request(
            "DELETE",
            &format!("/api/servers/{server_id}/members/{member_id}"),
            None,
            Some(&owner),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT, "{body}");
    for ws in [&mut owner_ws, &mut member_ws] {
        assert_eq!(
            next_event(ws, "member.removed").await["payload"]["account_id"],
            member_id.to_string()
        );
    }
}
