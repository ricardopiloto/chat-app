use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use base64::Engine;
use serde_json::json;

fn b64(data: &str) -> String {
    base64::engine::general_purpose::STANDARD.encode(data.as_bytes())
}

async fn setup_alice_bob(app: &TestApp) -> (String, String, String, String, String) {
    let (_, alice_body, alice) = app.register("alice", "password1", None).await;
    let alice = must_cookie(alice);
    let alice_id = alice_body["id"].as_str().unwrap().to_string();
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap().to_string();
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "geral", "type": "text" })),
            Some(&alice),
        )
        .await;
    let channel_id = ch["id"].as_str().unwrap().to_string();
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "include_history": true })),
            Some(&alice),
        )
        .await;
    let code = inv["code"].as_str().unwrap().to_string();
    let (_, bob_body, bob) = app.register("bob", "password1", Some(&code)).await;
    let bob = must_cookie(bob);
    let bob_id = bob_body["id"].as_str().unwrap().to_string();
    (alice, alice_id, bob, bob_id, channel_id)
}

#[tokio::test]
async fn mention_creates_notification_for_target_not_self() {
    let app = TestApp::new().await;
    let (alice, alice_id, bob, bob_id, channel_id) = setup_alice_bob(&app).await;

    let (status, msg, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({
                "content_ciphertext": b64("hey @bob"),
                "mentioned_account_ids": [bob_id, alice_id],
            })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{msg}");
    let mentions = msg["mentioned_account_ids"].as_array().unwrap();
    assert_eq!(mentions.len(), 1);
    assert_eq!(mentions[0].as_str().unwrap(), bob_id);

    let (st, list, _) = app
        .request(
            "GET",
            "/api/notifications?unread_only=true",
            None,
            Some(&bob),
        )
        .await;
    assert_eq!(st, StatusCode::OK, "{list}");
    let arr = list.as_array().unwrap();
    assert_eq!(arr.len(), 1);
    assert_eq!(arr[0]["kind"], "mention");
    assert_eq!(arr[0]["message_id"], msg["id"]);
    assert_eq!(arr[0]["actor_account_id"], alice_id);

    let (st_self, list_self, _) = app
        .request(
            "GET",
            "/api/notifications?unread_only=true",
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(st_self, StatusCode::OK, "{list_self}");
    assert!(list_self.as_array().unwrap().is_empty());
}

#[tokio::test]
async fn invalid_mention_ids_are_skipped() {
    let app = TestApp::new().await;
    let (alice, _, _, _, channel_id) = setup_alice_bob(&app).await;
    let fake = uuid::Uuid::new_v4().to_string();
    let (status, msg, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({
                "content_ciphertext": b64("hello"),
                "mentioned_account_ids": [fake],
            })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{msg}");
    assert!(msg["mentioned_account_ids"]
        .as_array()
        .map(|a| a.is_empty())
        .unwrap_or(true));
}

#[tokio::test]
async fn reply_notifies_parent_author() {
    let app = TestApp::new().await;
    let (alice, alice_id, bob, _, channel_id) = setup_alice_bob(&app).await;

    let (_, parent, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({ "content_ciphertext": b64("parent") })),
            Some(&alice),
        )
        .await;
    let parent_id = parent["id"].as_str().unwrap();

    let (status, reply, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({
                "content_ciphertext": b64("child"),
                "reply_to_message_id": parent_id,
            })),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{reply}");
    assert_eq!(reply["reply_to_message_id"], parent_id);
    assert_eq!(reply["reply_to_sender_account_id"], alice_id);

    let (st, list, _) = app
        .request(
            "GET",
            "/api/notifications?unread_only=true",
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(st, StatusCode::OK, "{list}");
    let arr = list.as_array().unwrap();
    assert_eq!(arr.len(), 1);
    assert_eq!(arr[0]["kind"], "reply");
}

#[tokio::test]
async fn reply_to_self_does_not_notify() {
    let app = TestApp::new().await;
    let (alice, _, _, _, channel_id) = setup_alice_bob(&app).await;
    let (_, parent, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({ "content_ciphertext": b64("mine") })),
            Some(&alice),
        )
        .await;
    let (_, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({
                "content_ciphertext": b64("self-reply"),
                "reply_to_message_id": parent["id"],
            })),
            Some(&alice),
        )
        .await;
    let (st, list, _) = app
        .request(
            "GET",
            "/api/notifications?unread_only=true",
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(st, StatusCode::OK, "{list}");
    assert!(list.as_array().unwrap().is_empty());
}

#[tokio::test]
async fn reply_parent_wrong_channel_is_400() {
    let app = TestApp::new().await;
    let (alice, _, _, _, channel_id) = setup_alice_bob(&app).await;
    let (_, servers, _) = app
        .request("GET", "/api/servers", None, Some(&alice))
        .await;
    let server_id = servers.as_array().unwrap()[0]["id"].as_str().unwrap();
    let (_, ch2, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "outro", "type": "text" })),
            Some(&alice),
        )
        .await;
    let other_id = ch2["id"].as_str().unwrap();
    let (_, parent, _) = app
        .request(
            "POST",
            &format!("/api/channels/{other_id}/messages"),
            Some(json!({ "content_ciphertext": b64("elsewhere") })),
            Some(&alice),
        )
        .await;
    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({
                "content_ciphertext": b64("bad"),
                "reply_to_message_id": parent["id"],
            })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
}

#[tokio::test]
async fn mark_notification_read() {
    let app = TestApp::new().await;
    let (alice, _, bob, bob_id, channel_id) = setup_alice_bob(&app).await;
    app.request(
        "POST",
        &format!("/api/channels/{channel_id}/messages"),
        Some(json!({
            "content_ciphertext": b64("ping"),
            "mentioned_account_ids": [bob_id],
        })),
        Some(&alice),
    )
    .await;
    let (_, list, _) = app
        .request(
            "GET",
            "/api/notifications?unread_only=true",
            None,
            Some(&bob),
        )
        .await;
    let nid = list.as_array().unwrap()[0]["id"].as_str().unwrap();
    let (st, _, _) = app
        .request(
            "POST",
            &format!("/api/notifications/{nid}/read"),
            None,
            Some(&bob),
        )
        .await;
    assert_eq!(st, StatusCode::NO_CONTENT);
    let (_, list2, _) = app
        .request(
            "GET",
            "/api/notifications?unread_only=true",
            None,
            Some(&bob),
        )
        .await;
    assert!(list2.as_array().unwrap().is_empty());
}

#[tokio::test]
async fn mark_all_notifications_read() {
    let app = TestApp::new().await;
    let (alice, _, bob, bob_id, channel_id) = setup_alice_bob(&app).await;
    for body in ["one", "two"] {
        app.request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({
                "content_ciphertext": b64(body),
                "mentioned_account_ids": [bob_id],
            })),
            Some(&alice),
        )
        .await;
    }
    let (_, list, _) = app
        .request(
            "GET",
            "/api/notifications?unread_only=true",
            None,
            Some(&bob),
        )
        .await;
    assert!(list.as_array().unwrap().len() >= 2);
    let (st, _, _) = app
        .request("POST", "/api/notifications/read-all", None, Some(&bob))
        .await;
    assert_eq!(st, StatusCode::NO_CONTENT);
    let (_, list2, _) = app
        .request(
            "GET",
            "/api/notifications?unread_only=true",
            None,
            Some(&bob),
        )
        .await;
    assert!(list2.as_array().unwrap().is_empty());
}

#[tokio::test]
async fn deleted_message_nulls_notification_message_id() {
    let app = TestApp::new().await;
    let (alice, _, bob, bob_id, channel_id) = setup_alice_bob(&app).await;
    let (_, msg, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({
                "content_ciphertext": b64("gone soon"),
                "mentioned_account_ids": [bob_id],
            })),
            Some(&alice),
        )
        .await;
    let mid = msg["id"].as_str().unwrap();
    let (st, _, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{channel_id}/messages/{mid}"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(st, StatusCode::NO_CONTENT);
    let (_, list, _) = app
        .request(
            "GET",
            "/api/notifications?unread_only=false",
            None,
            Some(&bob),
        )
        .await;
    let arr = list.as_array().unwrap();
    assert_eq!(arr.len(), 1);
    assert!(arr[0]["message_id"].is_null());
}
