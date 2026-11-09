use crate::common::{create_server_body, must_cookie, TestApp};
use axum::http::StatusCode;
use base64::Engine;
use serde_json::json;
use uuid::Uuid;

fn b64(data: &str) -> String {
    base64::engine::general_purpose::STANDARD.encode(data.as_bytes())
}

struct Setup {
    owner: String,
    owner_id: Uuid,
    server_id: String,
    channel_id: String,
}

async fn owner_server_text_channel(app: &TestApp) -> Setup {
    let (status, body, cookie) = app.register("pin_alice", "password1", None).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    let owner = must_cookie(cookie);
    let owner_id = Uuid::parse_str(body["id"].as_str().unwrap()).unwrap();
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(create_server_body("Pins")),
            Some(&owner),
        )
        .await;
    let server_id = server["id"].as_str().unwrap().to_string();
    let (_, channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&owner),
        )
        .await;
    let channel_id = channels
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["type"] == "text")
        .unwrap()["id"]
        .as_str()
        .unwrap()
        .to_string();
    Setup {
        owner,
        owner_id,
        server_id,
        channel_id,
    }
}

async fn post_msg(app: &TestApp, cookie: &str, channel_id: &str, text: &str) -> String {
    let (status, msg, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({ "content_ciphertext": b64(text) })),
            Some(cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{msg}");
    msg["id"].as_str().unwrap().to_string()
}

/// Invite with `include_history` and join as a brand-new account; returns its cookie, id and the
/// invite's code (so a caller can also check `include_history: false` behaviour).
async fn invite_and_join(
    app: &TestApp,
    owner: &str,
    server_id: &str,
    handle: &str,
    include_history: bool,
) -> (String, Uuid) {
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "include_history": include_history })),
            Some(owner),
        )
        .await;
    let code = inv["code"].as_str().unwrap();
    let (status, body, cookie) = app.register(handle, "password1", Some(code)).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    (
        must_cookie(cookie),
        Uuid::parse_str(body["id"].as_str().unwrap()).unwrap(),
    )
}

async fn channel_pin(app: &TestApp, cookie: &str, channel_id: &str) -> Option<String> {
    let (status, channel, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}"),
            None,
            Some(cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{channel}");
    channel["pinned_message_id"].as_str().map(str::to_string)
}

#[tokio::test]
async fn manager_can_pin_and_unpin_member_cannot() {
    let app = TestApp::new().await;
    let setup = owner_server_text_channel(&app).await;
    let (bob, _) = invite_and_join(&app, &setup.owner, &setup.server_id, "pin_bob", true).await;

    let msg_id = post_msg(&app, &setup.owner, &setup.channel_id, "hello").await;

    // A member without manage-channel capability cannot pin.
    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{}/pin", setup.channel_id),
            Some(json!({ "message_id": msg_id })),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{body}");

    // The owner (implicit manager) can.
    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{}/pin", setup.channel_id),
            Some(json!({ "message_id": msg_id })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["pinned_message_id"].as_str(), Some(msg_id.as_str()));
    assert_eq!(
        channel_pin(&app, &setup.owner, &setup.channel_id).await,
        Some(msg_id.clone())
    );

    // A member cannot unpin either.
    let (status, body, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{}/pin", setup.channel_id),
            Some(json!({ "expected_pinned_message_id": msg_id })),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{body}");

    let (status, body, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{}/pin", setup.channel_id),
            Some(json!({ "expected_pinned_message_id": msg_id })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["pinned_message_id"], serde_json::Value::Null);
    assert_eq!(channel_pin(&app, &setup.owner, &setup.channel_id).await, None);
}

#[tokio::test]
async fn pin_changed_broadcasts_to_every_viewer() {
    let app = TestApp::new().await;
    let setup = owner_server_text_channel(&app).await;
    let (_bob, bob_id) =
        invite_and_join(&app, &setup.owner, &setup.server_id, "pin_eve", true).await;
    let msg_id = post_msg(&app, &setup.owner, &setup.channel_id, "hello").await;

    let mut owner_ws = app.state.ws.subscribe(setup.owner_id, Uuid::new_v4());
    let mut bob_ws = app.state.ws.subscribe(bob_id, Uuid::new_v4());

    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{}/pin", setup.channel_id),
            Some(json!({ "message_id": msg_id })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    let owner_event: serde_json::Value =
        serde_json::from_str(&owner_ws.messages.try_recv().unwrap()).unwrap();
    let bob_event: serde_json::Value =
        serde_json::from_str(&bob_ws.messages.try_recv().unwrap()).unwrap();
    assert_eq!(owner_event, bob_event);
    assert_eq!(owner_event["event"], "channel.pin_changed");
    assert_eq!(owner_event["payload"]["channel_id"], setup.channel_id.as_str());
    assert_eq!(owner_event["payload"]["pinned_message_id"], msg_id.as_str());
}

#[tokio::test]
async fn replacing_pin_without_current_precondition_conflicts() {
    let app = TestApp::new().await;
    let setup = owner_server_text_channel(&app).await;
    let first = post_msg(&app, &setup.owner, &setup.channel_id, "first").await;
    let second = post_msg(&app, &setup.owner, &setup.channel_id, "second").await;

    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{}/pin", setup.channel_id),
            Some(json!({ "message_id": first })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    // Stale precondition (acts as if nothing were pinned yet) — must not silently clobber.
    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{}/pin", setup.channel_id),
            Some(json!({ "message_id": second, "expected_pinned_message_id": null })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::CONFLICT, "{body}");
    assert_eq!(body["details"]["pinned_message_id"].as_str(), Some(first.as_str()));
    assert_eq!(
        channel_pin(&app, &setup.owner, &setup.channel_id).await,
        Some(first.clone())
    );

    // Correct precondition succeeds.
    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{}/pin", setup.channel_id),
            Some(json!({ "message_id": second, "expected_pinned_message_id": first })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(
        channel_pin(&app, &setup.owner, &setup.channel_id).await,
        Some(second)
    );
}

#[tokio::test]
async fn ineligible_targets_are_rejected() {
    let app = TestApp::new().await;
    let setup = owner_server_text_channel(&app).await;
    let msg_id = post_msg(&app, &setup.owner, &setup.channel_id, "flip-me").await;

    // Simulate a webhook-authored message (not reachable through the real posting API in tests).
    sqlx::query("UPDATE message SET kind = 'webhook' WHERE id = ?")
        .bind(&msg_id)
        .execute(&app.pool)
        .await
        .unwrap();

    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{}/pin", setup.channel_id),
            Some(json!({ "message_id": msg_id })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::UNPROCESSABLE_ENTITY, "{body}");

    // A message from a different channel is also rejected.
    let (_, ch2, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/channels", setup.server_id),
            Some(json!({ "name": "outro", "type": "text" })),
            Some(&setup.owner),
        )
        .await;
    let other_channel = ch2["id"].as_str().unwrap().to_string();
    let other_msg = post_msg(&app, &setup.owner, &other_channel, "elsewhere").await;

    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{}/pin", setup.channel_id),
            Some(json!({ "message_id": other_msg })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
}

#[tokio::test]
async fn deleting_the_pinned_message_clears_the_pin_but_not_other_pins() {
    let app = TestApp::new().await;
    let setup = owner_server_text_channel(&app).await;
    let pinned = post_msg(&app, &setup.owner, &setup.channel_id, "pin-me").await;
    let other = post_msg(&app, &setup.owner, &setup.channel_id, "keep-me").await;

    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{}/pin", setup.channel_id),
            Some(json!({ "message_id": pinned })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    // Deleting an unrelated message must not touch the pin.
    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{}/messages/{}", setup.channel_id, other),
            None,
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    assert_eq!(
        channel_pin(&app, &setup.owner, &setup.channel_id).await,
        Some(pinned.clone())
    );

    // Deleting the pinned message clears the channel's pin.
    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{}/messages/{}", setup.channel_id, pinned),
            None,
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    assert_eq!(channel_pin(&app, &setup.owner, &setup.channel_id).await, None);
}

#[tokio::test]
async fn deleting_a_channel_with_a_pin_succeeds() {
    let app = TestApp::new().await;
    let setup = owner_server_text_channel(&app).await;
    let (_, ch2, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/channels", setup.server_id),
            Some(json!({ "name": "descartavel", "type": "text" })),
            Some(&setup.owner),
        )
        .await;
    let extra_channel = ch2["id"].as_str().unwrap().to_string();
    let msg_id = post_msg(&app, &setup.owner, &extra_channel, "about-to-vanish").await;

    let (status, body, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{extra_channel}/pin"),
            Some(json!({ "message_id": msg_id })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");

    let (status, body, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{extra_channel}"),
            None,
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT, "{body}");
}

#[tokio::test]
async fn pin_outside_visible_history_is_not_reachable() {
    let app = TestApp::new().await;
    let setup = owner_server_text_channel(&app).await;
    let old_msg = post_msg(&app, &setup.owner, &setup.channel_id, "before-everyone").await;

    let (status, _, _) = app
        .request(
            "PUT",
            &format!("/api/channels/{}/pin", setup.channel_id),
            Some(json!({ "message_id": old_msg })),
            Some(&setup.owner),
        )
        .await;
    assert_eq!(status, StatusCode::OK);

    // Carla joins without shared history: the pin predates her membership.
    let (carla, _) =
        invite_and_join(&app, &setup.owner, &setup.server_id, "pin_carla", false).await;
    assert_eq!(
        channel_pin(&app, &carla, &setup.channel_id).await,
        Some(old_msg.clone()),
        "the pointer itself is still visible — only the message content is gated"
    );
    let (status, body, _) = app
        .request(
            "GET",
            &format!("/api/channels/{}/messages/{}", setup.channel_id, old_msg),
            None,
            Some(&carla),
        )
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND, "{body}");

    // Dana joins with shared history: she can read the same pinned message.
    let (dana, _) = invite_and_join(&app, &setup.owner, &setup.server_id, "pin_dana", true).await;
    let (status, body, _) = app
        .request(
            "GET",
            &format!("/api/channels/{}/messages/{}", setup.channel_id, old_msg),
            None,
            Some(&dana),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["id"].as_str(), Some(old_msg.as_str()));
}
