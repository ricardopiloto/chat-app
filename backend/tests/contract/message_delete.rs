use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use base64::Engine;
use serde_json::json;

fn b64(data: &str) -> String {
    base64::engine::general_purpose::STANDARD.encode(data.as_bytes())
}

async fn owner_server_text_channel(app: &TestApp) -> (String, String, String, String) {
    let (status, body, cookie) = app.register("alice_del", "password1", None).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    let alice = must_cookie(cookie);
    let alice_id = body["id"].as_str().unwrap().to_string();
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap().to_string();
    let (_, channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&alice),
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
    (alice, alice_id, server_id, channel_id)
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

async fn invite_bob(app: &TestApp, alice: &str, server_id: &str) -> (String, String) {
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "include_history": true })),
            Some(alice),
        )
        .await;
    let code = inv["code"].as_str().unwrap();
    let (status, body, bob_cookie) = app.register("bob_del", "password1", Some(code)).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    (
        must_cookie(bob_cookie),
        body["id"].as_str().unwrap().to_string(),
    )
}

#[tokio::test]
async fn author_can_delete_own_non_author_forbidden_idempotent_404() {
    let app = TestApp::new().await;
    let (alice, _alice_id, server_id, channel_id) = owner_server_text_channel(&app).await;
    let (bob, _) = invite_bob(&app, &alice, &server_id).await;

    let msg_id = post_msg(&app, &bob, &channel_id, "bob-says").await;

    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{channel_id}/messages/{msg_id}"),
            None,
            Some(&alice),
        )
        .await;
    // alice is owner — allowed; use a second message for non-author check
    assert_eq!(status, StatusCode::NO_CONTENT);

    let msg2 = post_msg(&app, &bob, &channel_id, "bob-again").await;
    // Create carol who is neither author nor owner — use another invite member
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "include_history": true })),
            Some(&alice),
        )
        .await;
    let (status, body, carol_c) = app
        .register("carol_del", "password1", Some(inv["code"].as_str().unwrap()))
        .await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    let carol = must_cookie(carol_c);

    let (status, body, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{channel_id}/messages/{msg2}"),
            None,
            Some(&carol),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{body}");

    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{channel_id}/messages/{msg2}"),
            None,
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{channel_id}/messages/{msg2}"),
            None,
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn channel_creator_can_delete_others_not_on_other_channel() {
    let app = TestApp::new().await;
    let (alice, _alice_id, server_id, bootstrap_text) = owner_server_text_channel(&app).await;
    let (bob, bob_id) = invite_bob(&app, &alice, &server_id).await;

    // Extra text channel created by owner (alice)
    let (status, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "mod", "type": "text" })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{ch}");
    let mod_id = ch["id"].as_str().unwrap().to_string();

    // Reassign creator to bob (product API only lets owner create; ACL still uses created_by)
    sqlx::query("UPDATE channel SET created_by_account_id = ? WHERE id = ?")
        .bind(&bob_id)
        .bind(&mod_id)
        .execute(&app.pool)
        .await
        .unwrap();

    let msg_mod = post_msg(&app, &alice, &mod_id, "owner-in-mod").await;
    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{mod_id}/messages/{msg_mod}"),
            None,
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let msg_boot = post_msg(&app, &alice, &bootstrap_text, "owner-in-boot").await;
    let (status, body, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{bootstrap_text}/messages/{msg_boot}"),
            None,
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{body}");
}

#[tokio::test]
async fn server_owner_deletes_in_any_text_channel_and_attachments_gone() {
    let app = TestApp::new().await;
    let (alice, _, server_id, channel_id) = owner_server_text_channel(&app).await;
    let (bob, _) = invite_bob(&app, &alice, &server_id).await;

    let (status, att, _) = app
        .request_bytes(
            "POST",
            &format!("/api/channels/{channel_id}/attachments"),
            vec![1, 2, 3, 4],
            &[
                ("content-type", "application/octet-stream"),
                ("x-mesa-media-type", "image/png"),
            ],
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{att}");
    let att_id = att["id"].as_str().unwrap().to_string();

    let (status, msg, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({
                "content_ciphertext": b64("with-att"),
                "attachment_ids": [att_id],
            })),
            Some(&bob),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{msg}");
    let msg_id = msg["id"].as_str().unwrap().to_string();

    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{channel_id}/messages/{msg_id}"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let (status, body, _) = app
        .request_bytes(
            "GET",
            &format!("/api/attachments/{att_id}"),
            vec![],
            &[],
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND, "{body}");
}
