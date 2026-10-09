use crate::common::{create_server_body, must_cookie, TestApp};
use axum::http::StatusCode;
use base64::Engine;
use serde_json::{json, Value};

fn b64(data: &str) -> String {
    base64::engine::general_purpose::STANDARD.encode(data.as_bytes())
}

struct Member {
    id: String,
    cookie: String,
}

struct World {
    server_id: String,
    channel_id: String,
    alice: Member,
    bob: Member,
    carol: Member,
}

async fn invite_member(app: &TestApp, server_id: &str, owner: &str, handle: &str) -> Member {
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "include_history": true })),
            Some(owner),
        )
        .await;
    let code = inv["code"].as_str().unwrap().to_string();
    let (status, body, cookie) = app.register(handle, "password1", Some(&code)).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    Member {
        id: body["id"].as_str().unwrap().to_string(),
        cookie: must_cookie(cookie),
    }
}

async fn world(app: &TestApp) -> World {
    let (_, alice_body, alice) = app.register("alice", "password1", None).await;
    let alice = Member {
        id: alice_body["id"].as_str().unwrap().to_string(),
        cookie: must_cookie(alice),
    };
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(create_server_body("Mesa")),
            Some(&alice.cookie),
        )
        .await;
    let server_id = server["id"].as_str().unwrap().to_string();
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "geral", "type": "text" })),
            Some(&alice.cookie),
        )
        .await;
    let channel_id = ch["id"].as_str().unwrap().to_string();
    let bob = invite_member(app, &server_id, &alice.cookie, "bob").await;
    let carol = invite_member(app, &server_id, &alice.cookie, "carol").await;
    World {
        server_id,
        channel_id,
        alice,
        bob,
        carol,
    }
}

async fn send(
    app: &TestApp,
    channel_id: &str,
    cookie: &str,
    everyone: bool,
    extra: Value,
) -> (StatusCode, Value) {
    let mut body = json!({ "content_ciphertext": b64("@todos olá"), "mention_everyone": everyone });
    if let (Some(map), Some(more)) = (body.as_object_mut(), extra.as_object()) {
        map.extend(more.clone());
    }
    let (status, msg, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(body),
            Some(cookie),
        )
        .await;
    (status, msg)
}

async fn unread(app: &TestApp, cookie: &str) -> Vec<Value> {
    let (status, list, _) = app
        .request(
            "GET",
            "/api/notifications?unread_only=true",
            None,
            Some(cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{list}");
    list.as_array().unwrap().clone()
}

async fn make_role(app: &TestApp, w: &World, caps: Value) -> Value {
    let (status, role, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/roles", w.server_id),
            Some(json!({ "name": "Avisos", "capabilities": caps })),
            Some(&w.alice.cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{role}");
    role
}

async fn assign(app: &TestApp, w: &World, role_id: &str, members: &[&str]) {
    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/servers/{}/roles/{role_id}/members", w.server_id),
            Some(json!({ "member_ids": members })),
            Some(&w.alice.cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
}

#[tokio::test]
async fn capability_is_off_by_default_and_can_be_granted() {
    let app = TestApp::new().await;
    let w = world(&app).await;

    let role = make_role(&app, &w, json!({ "can_mute_members": true })).await;
    assert_eq!(role["capabilities"]["can_mention_everyone"], false);
    let role_id = role["id"].as_str().unwrap();

    let (status, updated, _) = app
        .request(
            "PATCH",
            &format!("/api/servers/{}/roles/{role_id}", w.server_id),
            Some(json!({ "capabilities": { "can_mute_members": true, "can_mention_everyone": true } })),
            Some(&w.alice.cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{updated}");
    assert_eq!(updated["capabilities"]["can_mention_everyone"], true);

    let (_, roles, _) = app
        .request(
            "GET",
            &format!("/api/servers/{}/roles", w.server_id),
            None,
            Some(&w.alice.cookie),
        )
        .await;
    let listed = roles
        .as_array()
        .unwrap()
        .iter()
        .find(|r| r["id"] == role["id"])
        .unwrap();
    assert_eq!(listed["capabilities"]["can_mention_everyone"], true);
    let dono = roles
        .as_array()
        .unwrap()
        .iter()
        .find(|r| r["is_system"] == true)
        .unwrap();
    assert_eq!(dono["capabilities"]["can_mention_everyone"], true);
}

#[tokio::test]
async fn owner_mention_everyone_notifies_everyone_else() {
    let app = TestApp::new().await;
    let w = world(&app).await;

    let (status, msg) = send(&app, &w.channel_id, &w.alice.cookie, true, json!({})).await;
    assert_eq!(status, StatusCode::CREATED, "{msg}");
    assert_eq!(msg["mentions_everyone"], true);

    for who in [&w.bob, &w.carol] {
        let list = unread(&app, &who.cookie).await;
        assert_eq!(list.len(), 1);
        assert_eq!(list[0]["kind"], "mention");
        assert_eq!(list[0]["message_id"], msg["id"]);
        assert_eq!(list[0]["actor_account_id"], w.alice.id);
    }
    assert!(unread(&app, &w.alice.cookie).await.is_empty());
}

#[tokio::test]
async fn without_the_permission_it_is_plain_text() {
    let app = TestApp::new().await;
    let w = world(&app).await;

    let (status, msg) = send(&app, &w.channel_id, &w.bob.cookie, true, json!({})).await;
    assert_eq!(status, StatusCode::CREATED, "{msg}");
    assert!(msg.get("mentions_everyone").is_none(), "{msg}");
    assert!(unread(&app, &w.alice.cookie).await.is_empty());
    assert!(unread(&app, &w.carol.cookie).await.is_empty());

    // The flag also stays off in the message history.
    let (_, list, _) = app
        .request(
            "GET",
            &format!("/api/channels/{}/messages", w.channel_id),
            None,
            Some(&w.carol.cookie),
        )
        .await;
    assert!(list
        .as_array()
        .unwrap()
        .iter()
        .all(|m| m.get("mentions_everyone").is_none()));
}

#[tokio::test]
async fn role_with_the_permission_can_notify_everyone() {
    let app = TestApp::new().await;
    let w = world(&app).await;
    let role = make_role(&app, &w, json!({ "can_mention_everyone": true })).await;
    assign(&app, &w, role["id"].as_str().unwrap(), &[&w.bob.id]).await;

    let (status, msg) = send(&app, &w.channel_id, &w.bob.cookie, true, json!({})).await;
    assert_eq!(status, StatusCode::CREATED, "{msg}");
    assert_eq!(msg["mentions_everyone"], true);
    assert_eq!(unread(&app, &w.alice.cookie).await.len(), 1);
    assert_eq!(unread(&app, &w.carol.cookie).await.len(), 1);
    assert!(unread(&app, &w.bob.cookie).await.is_empty());

    // Without the flag nothing is mass-notified, even from a role that may.
    let (_, quiet) = send(&app, &w.channel_id, &w.bob.cookie, false, json!({})).await;
    assert!(quiet.get("mentions_everyone").is_none());
    assert_eq!(unread(&app, &w.carol.cookie).await.len(), 1);
}

#[tokio::test]
async fn explicit_mention_and_everyone_do_not_double_notify() {
    let app = TestApp::new().await;
    let w = world(&app).await;
    let (status, msg) = send(
        &app,
        &w.channel_id,
        &w.alice.cookie,
        true,
        json!({ "mentioned_account_ids": [w.bob.id] }),
    )
    .await;
    assert_eq!(status, StatusCode::CREATED, "{msg}");
    assert_eq!(unread(&app, &w.bob.cookie).await.len(), 1);
    assert_eq!(unread(&app, &w.carol.cookie).await.len(), 1);
}

#[tokio::test]
async fn private_channel_only_notifies_who_can_see_it() {
    let app = TestApp::new().await;
    let w = world(&app).await;
    let (_, private, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/channels", w.server_id),
            Some(json!({ "name": "mestres", "type": "text", "visibility": "private" })),
            Some(&w.alice.cookie),
        )
        .await;
    let private_id = private["id"].as_str().unwrap();
    let role = make_role(&app, &w, json!({})).await;
    let role_id = role["id"].as_str().unwrap();
    assign(&app, &w, role_id, &[&w.bob.id]).await;
    let (status, acl, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{private_id}/acl"),
            Some(json!([{ "subject_type": "role", "subject_id": role_id, "level": "write", "effect": "allow" }])),
            Some(&w.alice.cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{acl}");

    let (status, msg) = send(&app, private_id, &w.alice.cookie, true, json!({})).await;
    assert_eq!(status, StatusCode::CREATED, "{msg}");
    assert_eq!(unread(&app, &w.bob.cookie).await.len(), 1);
    assert!(unread(&app, &w.carol.cookie).await.is_empty());
}

#[tokio::test]
async fn more_than_twenty_members_all_get_notified() {
    let app = TestApp::new().await;
    let w = world(&app).await;
    let mut extra = Vec::new();
    for i in 0..21 {
        extra
            .push(invite_member(&app, &w.server_id, &w.alice.cookie, &format!("user{i:02}")).await);
    }
    let (status, msg) = send(&app, &w.channel_id, &w.alice.cookie, true, json!({})).await;
    assert_eq!(status, StatusCode::CREATED, "{msg}");
    assert_eq!(unread(&app, &w.bob.cookie).await.len(), 1);
    for m in &extra {
        assert_eq!(unread(&app, &m.cookie).await.len(), 1, "member {}", m.id);
    }
}

#[tokio::test]
async fn muted_sender_is_refused_and_nobody_is_notified() {
    let app = TestApp::new().await;
    let w = world(&app).await;
    let role = make_role(&app, &w, json!({ "can_mention_everyone": true })).await;
    assign(&app, &w, role["id"].as_str().unwrap(), &[&w.bob.id]).await;
    let (status, muted, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{}/mutes/{}", w.channel_id, w.bob.id),
            Some(json!({ "duration_minutes": 10 })),
            Some(&w.alice.cookie),
        )
        .await;
    assert!(status.is_success(), "{muted}");

    let (status, msg) = send(&app, &w.channel_id, &w.bob.cookie, true, json!({})).await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{msg}");
    assert!(unread(&app, &w.carol.cookie).await.is_empty());
    assert!(unread(&app, &w.alice.cookie).await.is_empty());
}
