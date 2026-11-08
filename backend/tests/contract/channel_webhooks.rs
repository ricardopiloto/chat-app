use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;
use uuid::Uuid;

async fn channel(app: &TestApp, cookie: &str, kind: &str) -> String {
    let (status, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{server}");
    let server_id = server["id"].as_str().unwrap();
    let body = if kind == "text" {
        json!({"name":"avisos", "type":"text"})
    } else {
        json!({"name":"chamada", "type":"voice_video", "custody_ack":true, "channel_key_sealed":crate::common::CHANNEL_KEY_SEALED})
    };
    let (status, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(body),
            Some(cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{ch}");
    ch["id"].as_str().unwrap().to_string()
}

#[tokio::test]
async fn lifecycle_preserves_identity_and_history() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("owner", "password1", None).await;
    let cookie = must_cookie(cookie);
    let ch = channel(&app, &cookie, "text").await;
    let path = format!("/api/channels/{ch}/webhooks");
    let (status, _, _) = app
        .request(
            "POST",
            &path,
            Some(json!({"consent_cleartext":false})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    let (status, created, _, headers) = app
        .request_full(
            "POST",
            &path,
            Some(json!({"consent_cleartext":true,"display_name":"Bot"})),
            Some(&cookie),
            &[],
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{created}");
    assert_eq!(headers["cache-control"], "no-store");
    let id = created["webhook"]["id"].as_str().unwrap();
    let account_id = created["webhook"]["account_id"].as_str().unwrap();
    let token = created["token"].as_str().unwrap();
    let (_, listed, _) = app.request("GET", &path, None, Some(&cookie)).await;
    assert_eq!(listed["id"], id);
    assert!(listed.get("token").is_none());
    assert!(listed.get("token_hash").is_none());
    let (_, ch_view, _) = app
        .request("GET", &format!("/api/channels/{ch}"), None, Some(&cookie))
        .await;
    assert_eq!(ch_view["has_active_webhook"], true);
    let (status, conflict, _) = app
        .request(
            "POST",
            &path,
            Some(json!({"consent_cleartext":true})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CONFLICT, "{conflict}");
    assert_eq!(conflict["code"], "webhook_already_active");
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/webhooks/{id}/wrong"),
            Some(json!({"content":"oi"})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    let post_url = format!("/api/webhooks/{id}/{token}");
    let (status, msg, _) = app
        .request("POST", &post_url, Some(json!({"content":"Aviso"})), None)
        .await;
    assert_eq!(status, StatusCode::CREATED, "{msg}");
    assert_eq!(msg["kind"], "webhook");
    assert_eq!(msg["sender_display_name_snapshot"], "Bot");
    assert_eq!(msg["sender_account_id"], account_id);
    let (status, _, _) = app
        .request(
            "PATCH",
            &format!("{path}/{id}"),
            Some(json!({"display_name":"Novo Bot"})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (status, rotated, _) = app
        .request("POST", &format!("{path}/{id}/rotate"), None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::OK, "{rotated}");
    let (status, _, _) = app
        .request("POST", &post_url, Some(json!({"content":"velho"})), None)
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    let new_url = format!("/api/webhooks/{id}/{}", rotated["token"].as_str().unwrap());
    let (status, _, _) = app
        .request("DELETE", &format!("{path}/{id}"), None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, _, _) = app
        .request("POST", &new_url, Some(json!({"content":"revogado"})), None)
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND);
    let (status, history, _) = app
        .request(
            "GET",
            &format!("/api/channels/{ch}/messages"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{history}");
    assert!(history.to_string().contains("Aviso"));
    assert!(history.to_string().contains("Bot"));
    let (status, reactivated, _) = app
        .request(
            "POST",
            &path,
            Some(json!({"consent_cleartext":true})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{reactivated}");
    assert_eq!(reactivated["webhook"]["id"], id);
    assert_eq!(reactivated["webhook"]["account_id"], account_id);
    assert_eq!(
        chat_backend::db::account::count(&app.pool).await.unwrap(),
        1
    );
    let system: (i64,) = sqlx::query_as("SELECT is_system_account FROM account WHERE id = ?")
        .bind(account_id)
        .fetch_one(&app.pool)
        .await
        .unwrap();
    assert_eq!(system.0, 1);
    let members: (i64,) = sqlx::query_as("SELECT COUNT(*) FROM membership WHERE account_id = ?")
        .bind(account_id)
        .fetch_one(&app.pool)
        .await
        .unwrap();
    assert_eq!(members.0, 0);
    let handle: (String,) = sqlx::query_as("SELECT handle FROM account WHERE id = ?")
        .bind(account_id)
        .fetch_one(&app.pool)
        .await
        .unwrap();
    let (status, _, _) = app.login(&handle.0, "irrelevant").await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn rate_limit_and_voice_rejection() {
    let app = TestApp::with_config(|config| config.rate_limit_disabled = false).await;
    let (_, _, cookie) = app.register("owner", "password1", None).await;
    let cookie = must_cookie(cookie);
    let voice = channel(&app, &cookie, "voice_video").await;
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{voice}/webhooks"),
            Some(json!({"consent_cleartext":true})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    let ch = channel(&app, &cookie, "text").await;
    let (status, created, _) = app
        .request(
            "POST",
            &format!("/api/channels/{ch}/webhooks"),
            Some(json!({"consent_cleartext":true})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{created}");
    let url = format!(
        "/api/webhooks/{}/{}",
        created["webhook"]["id"].as_str().unwrap(),
        created["token"].as_str().unwrap()
    );
    for _ in 0..10 {
        let (status, _, _) = app
            .request("POST", &url, Some(json!({"content":"ok"})), None)
            .await;
        assert_eq!(status, StatusCode::CREATED);
    }
    let (status, _, _, headers) = app
        .request_full("POST", &url, Some(json!({"content":"excesso"})), None, &[])
        .await;
    assert_eq!(status, StatusCode::TOO_MANY_REQUESTS);
    assert_eq!(headers["retry-after"], "60");
}

#[tokio::test]
async fn system_account_does_not_block_first_human_registration() {
    let app = TestApp::new().await;
    let id = Uuid::new_v4();
    let record = chat_backend::domain::account::AccountRecord {
        is_system_account: true,
        id,
        handle: format!("webhook-{id}"),
        password_hash: chat_backend::api::auth::register::hash_password("random").unwrap(),
        identity_pubkey: vec![0; 32],
        identity_vault: None,
        has_recovery_key: false,
        is_initial_operator: false,
        created_at: chrono::Utc::now(),
        avatar_filename: None,
        avatar_content_type: None,
        display_name: None,
        email: None,
        email_canonical: None,
        email_verified_at: None,
        terms_accepted_at: None,
        key_reminders: false,
        last_key_reminder_at: None,
        key_reminder_count: 0,
    };
    chat_backend::db::account::create(&app.pool, &record)
        .await
        .unwrap();
    assert_eq!(
        chat_backend::db::account::count(&app.pool).await.unwrap(),
        0
    );
    let (status, human, _) = app.register("first", "password1", None).await;
    assert_eq!(status, StatusCode::CREATED, "{human}");
    assert_eq!(human["is_initial_operator"], true);
}

#[tokio::test]
async fn avatar_snapshot_remains_readable_after_replacement_and_revoke() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("avatar_owner", "password1", None).await;
    let cookie = must_cookie(cookie);
    let ch = channel(&app, &cookie, "text").await;
    let path = format!("/api/channels/{ch}/webhooks");
    let (status, created, _) = app
        .request(
            "POST",
            &path,
            Some(json!({"consent_cleartext":true})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{created}");
    let id = created["webhook"]["id"].as_str().unwrap();
    let token = created["token"].as_str().unwrap();
    let avatar_path = format!("{path}/{id}/avatar");
    let first = b"first-avatar".to_vec();
    let (status, _, _) = app
        .request_bytes(
            "PUT",
            &avatar_path,
            first.clone(),
            &[("x-mesa-media-type", "image/png")],
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (status, message, _) = app
        .request(
            "POST",
            &format!("/api/webhooks/{id}/{token}"),
            Some(json!({"content":"with avatar"})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{message}");
    let url = message["sender_avatar_url"].as_str().unwrap();
    let (status, _, _) = app
        .request_bytes(
            "PUT",
            &avatar_path,
            b"second-avatar".to_vec(),
            &[("x-mesa-media-type", "image/png")],
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (status, _, _) = app
        .request("DELETE", &format!("{path}/{id}"), None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    let (status, bytes, _) = app
        .request_raw("GET", url, None, &[("cookie", &cookie)], None)
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(bytes, first);
    let (status, _, _) = app.request_raw("GET", url, None, &[], None).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}
