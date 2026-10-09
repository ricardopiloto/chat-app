use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use base64::Engine;
use chat_backend::db;
use serde_json::json;
use uuid::Uuid;

async fn setup_message(app: &TestApp) -> (String, Uuid, Uuid, Uuid) {
    let (_, account, cookie) = app.register("reactor", "password1", None).await;
    let cookie = must_cookie(cookie);
    let account_id = Uuid::parse_str(account["id"].as_str().unwrap()).unwrap();
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, channel, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "geral", "type": "text" })),
            Some(&cookie),
        )
        .await;
    let channel_id = Uuid::parse_str(channel["id"].as_str().unwrap()).unwrap();
    let ciphertext = base64::engine::general_purpose::STANDARD.encode("hello");
    let (status, message, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({ "content_ciphertext": ciphertext })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{message}");
    assert_eq!(message["reactions"], json!([]));
    let message_id = Uuid::parse_str(message["id"].as_str().unwrap()).unwrap();
    (cookie, account_id, channel_id, message_id)
}

#[tokio::test]
async fn reaction_migration_and_database_operations() {
    let app = TestApp::new().await;
    let (_, account_id, channel_id, message_id) = setup_message(&app).await;
    let (table,): (String,) = sqlx::query_as(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'message_reaction'",
    )
    .fetch_one(&app.pool)
    .await
    .unwrap();
    assert_eq!(table, "message_reaction");

    assert!(
        db::reaction::add_reaction(&app.pool, message_id, account_id, "fire")
            .await
            .unwrap()
    );
    assert!(
        !db::reaction::add_reaction(&app.pool, message_id, account_id, "fire")
            .await
            .unwrap()
    );
    let summary = db::reaction::reactions_for_message(&app.pool, message_id)
        .await
        .unwrap();
    assert_eq!(summary.len(), 1);
    assert_eq!(summary[0].emoji_code, "fire");
    assert_eq!(summary[0].count, 1);
    assert_eq!(summary[0].account_ids, vec![account_id]);

    let message = db::message::find_by_id(&app.pool, message_id)
        .await
        .unwrap()
        .unwrap();
    assert_eq!(message.reactions.len(), 1);
    assert_eq!(message.reactions[0].count, 1);
    let listed = db::message::list_since(&app.pool, channel_id, None, None, 200)
        .await
        .unwrap();
    assert_eq!(listed[0].reactions[0].emoji_code, "fire");

    assert!(
        db::reaction::remove_reaction(&app.pool, message_id, account_id, "fire")
            .await
            .unwrap()
    );
    assert!(
        !db::reaction::remove_reaction(&app.pool, message_id, account_id, "fire")
            .await
            .unwrap()
    );
    assert!(db::reaction::reactions_for_message(&app.pool, message_id)
        .await
        .unwrap()
        .is_empty());
}

#[tokio::test]
async fn reaction_api_validates_permissions_and_broadcasts() {
    let app = TestApp::new().await;
    let (cookie, account_id, channel_id, message_id) = setup_message(&app).await;
    let mut first_ws = app.state.ws.subscribe(account_id, Uuid::new_v4());
    let mut second_ws = app.state.ws.subscribe(account_id, Uuid::new_v4());
    let path = format!("/api/channels/{channel_id}/messages/{message_id}/reactions");

    let (status, _, _) = app
        .request(
            "POST",
            &path,
            Some(json!({ "emoji_code": "invalid" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    let (status, _, _) = app
        .request(
            "POST",
            &path,
            Some(json!({ "emoji_code": "fire" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED);
    let first_event: serde_json::Value =
        serde_json::from_str(&first_ws.messages.try_recv().unwrap()).unwrap();
    let second_event: serde_json::Value =
        serde_json::from_str(&second_ws.messages.try_recv().unwrap()).unwrap();
    assert_eq!(first_event, second_event);
    assert_eq!(second_event["event"], "reaction.added");
    assert_eq!(
        second_event["payload"]["message_id"],
        message_id.to_string()
    );
    assert_eq!(
        second_event["payload"]["channel_id"],
        channel_id.to_string()
    );
    assert_eq!(
        second_event["payload"]["account_id"],
        account_id.to_string()
    );
    assert_eq!(second_event["payload"]["emoji_code"], "fire");

    let (status, _, _) = app
        .request(
            "POST",
            &path,
            Some(json!({ "emoji_code": "fire" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert!(second_ws.messages.try_recv().is_err());

    let (status, listed, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/messages"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(listed[0]["reactions"][0]["count"], 1);

    let delete_path = format!("{path}/fire");
    let (status, _, _) = app
        .request("DELETE", &delete_path, None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let _: String = first_ws.messages.try_recv().unwrap();
    let removed: serde_json::Value =
        serde_json::from_str(&second_ws.messages.try_recv().unwrap()).unwrap();
    assert_eq!(removed["event"], "reaction.removed");
    assert_eq!(removed["payload"]["emoji_code"], "fire");
    let (status, _, _) = app
        .request("DELETE", &delete_path, None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    assert!(second_ws.messages.try_recv().is_err());

    sqlx::query("INSERT INTO channel_mute (channel_id, account_id, muted_by_account_id, created_at, ends_at) VALUES (?, ?, ?, '2026-10-09T00:00:00Z', '2099-01-01T00:00:00Z')")
        .bind(channel_id.to_string())
        .bind(account_id.to_string())
        .bind(account_id.to_string())
        .execute(&app.pool).await.unwrap();
    let (status, _, _) = app
        .request(
            "POST",
            &path,
            Some(json!({ "emoji_code": "fire" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);

    let (_, beta, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Beta")),
            Some(&cookie),
        )
        .await;
    let beta_id = beta["id"].as_str().unwrap();
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{beta_id}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    let (status, _, cara) = app
        .register("cara", "password1", Some(inv["code"].as_str().unwrap()))
        .await;
    assert_eq!(status, StatusCode::CREATED);
    let cara = must_cookie(cara);
    let (status, _, _) = app
        .request(
            "POST",
            &path,
            Some(json!({ "emoji_code": "fire" })),
            Some(&cara),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
}
