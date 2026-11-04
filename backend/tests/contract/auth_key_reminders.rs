use super::common::PUBKEY;
use super::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use chat_backend::email_sender::{EmailMessage, EmailSender};
use serde_json::json;
use std::future::Future;
use std::pin::Pin;
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Arc,
};

struct FailingSender(Arc<AtomicUsize>);

#[tokio::test]
async fn public_registration_config_reports_instance_key_reminder_flag() {
    let disabled = TestApp::new().await;
    let (status, config, _) = disabled
        .request("GET", "/api/auth/register/config", None, None)
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(config["key_reminders"], false);
    assert_eq!(config["mode"], "fechado");
    assert!(config["turnstile_site_key"].is_null());
    assert_eq!(config["reset_email"], false);

    let enabled = TestApp::with_config(|c| {
        c.key_reminders = true;
        c.registo_modo = "aberto".into();
        c.turnstile_site_key = Some("public-key".into());
        c.reset_email = true;
    })
    .await;
    let (status, config, _) = enabled
        .request("GET", "/api/auth/register/config", None, None)
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(config["key_reminders"], true);
    assert_eq!(config["mode"], "aberto");
    assert_eq!(config["turnstile_site_key"], "public-key");
    assert_eq!(config["reset_email"], true);
}

impl EmailSender for FailingSender {
    fn send<'a>(&'a self, _message: EmailMessage) -> Pin<Box<dyn Future<Output = ()> + Send + 'a>> {
        Box::pin(async move {
            self.0.fetch_add(1, Ordering::SeqCst);
        })
    }
}

async fn issued_token(app: &TestApp, email: &str) -> String {
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/email/request",
            Some(json!({"email":email,"terms_accepted":true})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::ACCEPTED);
    let path = app
        .state
        .config
        .email_log_file
        .as_ref()
        .unwrap()
        .with_extension("eml");
    for _ in 0..100 {
        let content = tokio::fs::read_to_string(&path).await.unwrap_or_default();
        if content.contains("Purpose: verify") && content.contains(email) {
            return content
                .split("#email_token=")
                .nth(1)
                .unwrap()
                .split_whitespace()
                .next()
                .unwrap()
                .to_string();
        }
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }
    panic!("verification email missing");
}

async fn delivered(app: &TestApp, purpose: &str) -> String {
    let path = app
        .state
        .config
        .email_log_file
        .as_ref()
        .unwrap()
        .with_extension("eml");
    for _ in 0..100 {
        let content = tokio::fs::read_to_string(&path).await.unwrap_or_default();
        if content.contains(&format!("Purpose: {purpose}")) {
            return content;
        }
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }
    panic!("email missing: {purpose}");
}

#[tokio::test]
async fn verified_registration_sends_welcome_for_current_key_state() {
    for has_key in [false, true] {
        let app = TestApp::with_config(|c| {
            c.registo_modo = "aberto".into();
            c.key_reminders = true;
        })
        .await;
        let token = issued_token(&app, "alice@example.org").await;
        let mut body = json!({"handle":"alice","password":"password123","identity_pubkey":PUBKEY,"email_token":token});
        if has_key {
            body["recovery_vault"] = json!({"encrypted":"vault-sentinel"});
            body["recovery_verifier_pubkey"] = json!(PUBKEY);
        }
        let (status, account, cookie) = app
            .request("POST", "/api/auth/register", Some(body), None)
            .await;
        assert_eq!(status, StatusCode::CREATED, "{account}");
        assert!(cookie.is_some());
        let content = delivered(&app, "key_welcome").await;
        assert!(content.contains("https://mesa.example/account#recovery"));
        assert!(content.contains(if has_key {
            "já tem uma chave"
        } else {
            "Crie uma chave"
        }));
        assert!(!content.contains("vault-sentinel"));
        assert!(!content.contains(&token));
    }
}

#[tokio::test]
async fn registration_without_email_sends_no_welcome() {
    let app = TestApp::with_config(|c| c.key_reminders = true).await;
    let (status, _, _) = app.register("alice", "password1", None).await;
    assert_eq!(status, StatusCode::CREATED);
    tokio::time::sleep(std::time::Duration::from_millis(30)).await;
    assert!(!app
        .state
        .config
        .email_log_file
        .as_ref()
        .unwrap()
        .with_extension("eml")
        .exists());
}

#[tokio::test]
async fn provider_failure_keeps_registration_and_session() {
    let mut app = TestApp::with_config(|c| {
        c.registo_modo = "aberto".into();
        c.key_reminders = true;
    })
    .await;
    let token = issued_token(&app, "alice@example.org").await;
    let count = Arc::new(AtomicUsize::new(0));
    let mut state = app.state.clone();
    state.email_sender = Arc::new(FailingSender(count.clone()));
    app.router = chat_backend::router(state);
    let (status, account, cookie) = app.request("POST", "/api/auth/register", Some(json!({"handle":"alice","password":"password123","identity_pubkey":PUBKEY,"email_token":token})), None).await;
    assert_eq!(status, StatusCode::CREATED, "{account}");
    let cookie = must_cookie(cookie);
    let (status, me, _) = app
        .request("GET", "/api/auth/me", None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(me["id"], account["id"]);
    for _ in 0..100 {
        if count.load(Ordering::SeqCst) == 1 {
            return;
        }
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }
    panic!("delivery was not attempted");
}

async fn channel_fixture(email: bool) -> (TestApp, String, String, String) {
    let app = TestApp::with_config(|c| c.key_reminders = true).await;
    let (status, account, cookie) = app.register("alice", "password1", None).await;
    assert_eq!(status, StatusCode::CREATED);
    let id = account["id"].as_str().unwrap().to_string();
    if email {
        sqlx::query(
            "UPDATE account SET email = ?, email_canonical = ?, email_verified_at = ? WHERE id = ?",
        )
        .bind("alice@example.org")
        .bind("alice@example.org")
        .bind("2026-01-01T00:00:00Z")
        .bind(&id)
        .execute(&app.pool)
        .await
        .unwrap();
    }
    let cookie = must_cookie(cookie);
    let (status, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(super::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{server}");
    let server_id = server["id"].as_str().unwrap().to_string();
    (app, id, cookie, server_id)
}

async fn create_channel(app: &TestApp, cookie: &str, server_id: &str, name: &str) {
    let (status, channel, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({"name":name,"type":"text"})),
            Some(cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{channel}");
}

async fn reminder_count(app: &TestApp, id: &str) -> i64 {
    sqlx::query_as::<_, (i64,)>("SELECT key_reminder_count FROM account WHERE id = ?")
        .bind(id)
        .fetch_one(&app.pool)
        .await
        .unwrap()
        .0
}

async fn wait_count(app: &TestApp, id: &str, expected: i64) {
    for _ in 0..100 {
        if reminder_count(app, id).await == expected {
            return;
        }
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }
    panic!("reminder count did not reach {expected}");
}

#[tokio::test]
async fn channel_reminder_has_atomic_cadence_and_total_cap() {
    let (app, id, cookie, server_id) = channel_fixture(true).await;
    assert_eq!(
        reminder_count(&app, &id).await,
        0,
        "automatic server channels must not count"
    );
    create_channel(&app, &cookie, &server_id, "one").await;
    wait_count(&app, &id, 1).await;
    let content = delivered(&app, "key_channel_reminder").await;
    assert!(content.contains("https://mesa.example/account#recovery"));
    create_channel(&app, &cookie, &server_id, "two").await;
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    assert_eq!(reminder_count(&app, &id).await, 1);
    for (name, expected) in [("three", 2), ("four", 3)] {
        sqlx::query(
            "UPDATE account SET last_key_reminder_at = '2026-01-01T00:00:00Z' WHERE id = ?",
        )
        .bind(&id)
        .execute(&app.pool)
        .await
        .unwrap();
        create_channel(&app, &cookie, &server_id, name).await;
        wait_count(&app, &id, expected).await;
    }
    sqlx::query("UPDATE account SET last_key_reminder_at = '2026-01-01T00:00:00Z' WHERE id = ?")
        .bind(&id)
        .execute(&app.pool)
        .await
        .unwrap();
    create_channel(&app, &cookie, &server_id, "five").await;
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    assert_eq!(reminder_count(&app, &id).await, 3);
}

#[tokio::test]
async fn channel_reminder_respects_current_key_preference_and_email() {
    let (app, id, cookie, server_id) = channel_fixture(true).await;
    create_channel(&app, &cookie, &server_id, "one").await;
    wait_count(&app, &id, 1).await;
    sqlx::query("UPDATE account SET recovery_vault = ?, recovery_verifier_pubkey = ?, last_key_reminder_at = '2026-01-01T00:00:00Z' WHERE id = ?")
        .bind(vec![1u8]).bind(vec![2u8; 32]).bind(&id).execute(&app.pool).await.unwrap();
    create_channel(&app, &cookie, &server_id, "two").await;
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    assert_eq!(reminder_count(&app, &id).await, 1);
    sqlx::query(
        "UPDATE account SET recovery_vault = NULL, recovery_verifier_pubkey = NULL WHERE id = ?",
    )
    .bind(&id)
    .execute(&app.pool)
    .await
    .unwrap();
    let (status, _, _) = app
        .request(
            "PATCH",
            "/api/auth/key-reminders",
            Some(json!({"enabled":false})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    create_channel(&app, &cookie, &server_id, "three").await;
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    assert_eq!(reminder_count(&app, &id).await, 1);

    let (app, id, cookie, server_id) = channel_fixture(false).await;
    create_channel(&app, &cookie, &server_id, "one").await;
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    assert_eq!(reminder_count(&app, &id).await, 0);
}

#[tokio::test]
async fn existing_key_and_failed_sender_do_not_change_channel_result() {
    let (mut app, id, cookie, server_id) = channel_fixture(true).await;
    sqlx::query("UPDATE account SET recovery_vault = ?, recovery_verifier_pubkey = ? WHERE id = ?")
        .bind(vec![1u8])
        .bind(vec![2u8; 32])
        .bind(&id)
        .execute(&app.pool)
        .await
        .unwrap();
    create_channel(&app, &cookie, &server_id, "with-key").await;
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    assert_eq!(reminder_count(&app, &id).await, 0);
    sqlx::query(
        "UPDATE account SET recovery_vault = NULL, recovery_verifier_pubkey = NULL WHERE id = ?",
    )
    .bind(&id)
    .execute(&app.pool)
    .await
    .unwrap();
    let count = Arc::new(AtomicUsize::new(0));
    let mut state = app.state.clone();
    state.email_sender = Arc::new(FailingSender(count.clone()));
    app.router = chat_backend::router(state);
    create_channel(&app, &cookie, &server_id, "provider-fails").await;
    wait_count(&app, &id, 1).await;
    for _ in 0..100 {
        if count.load(Ordering::SeqCst) == 1 {
            return;
        }
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }
    panic!("delivery was not attempted");
}

#[tokio::test]
async fn failed_http_provider_does_not_change_created_channel() {
    use tokio::io::{AsyncReadExt, AsyncWriteExt};
    let listener = match tokio::net::TcpListener::bind("127.0.0.1:0").await {
        Ok(listener) => listener,
        Err(error) if error.kind() == std::io::ErrorKind::PermissionDenied => {
            eprintln!("fake provider socket unavailable: {error}");
            return;
        }
        Err(error) => panic!("fake provider bind: {error}"),
    };
    let address = listener.local_addr().unwrap();
    let provider = tokio::spawn(async move {
        let (mut stream, _) = listener.accept().await.unwrap();
        let mut bytes = [0u8; 4096];
        let _ = stream.read(&mut bytes).await;
        stream
            .write_all(b"HTTP/1.1 500 Error\r\nContent-Length: 0\r\nConnection: close\r\n\r\n")
            .await
            .unwrap();
    });
    let (mut app, id, cookie, server_id) = channel_fixture(true).await;
    let mut state = app.state.clone();
    state.email_sender = Arc::new(chat_backend::email_sender::ResendSender::new(
        chat_backend::config::Secret::new("fake-api-key"),
        "Mesa <noreply@example.org>".into(),
        format!("http://{address}"),
    ));
    app.router = chat_backend::router(state);
    create_channel(&app, &cookie, &server_id, "provider-error").await;
    wait_count(&app, &id, 1).await;
    tokio::time::timeout(std::time::Duration::from_secs(2), provider)
        .await
        .unwrap()
        .unwrap();
    let (_, channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&cookie),
        )
        .await;
    assert!(channels
        .as_array()
        .unwrap()
        .iter()
        .any(|channel| channel["name"] == "provider-error"));
}

#[tokio::test]
async fn registration_to_welcome_to_first_channel_then_no_second_email() {
    let app = TestApp::with_config(|c| {
        c.registo_modo = "aberto".into();
        c.key_reminders = true;
    })
    .await;
    let token = issued_token(&app, "alice@example.org").await;
    let (status, account, cookie) = app.request("POST", "/api/auth/register", Some(json!({
        "handle":"alice", "password":"password123", "identity_pubkey":PUBKEY, "email_token":token
    })), None).await;
    assert_eq!(status, StatusCode::CREATED, "{account}");
    let welcome = delivered(&app, "key_welcome").await;
    assert!(welcome.contains("Crie uma chave"));
    let cookie = must_cookie(cookie);
    let (status, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(super::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{server}");
    let id = account["id"].as_str().unwrap();
    assert_eq!(reminder_count(&app, id).await, 0);
    let server_id = server["id"].as_str().unwrap();
    create_channel(&app, &cookie, server_id, "first").await;
    wait_count(&app, id, 1).await;
    let reminder = delivered(&app, "key_channel_reminder").await;
    assert!(reminder.contains("https://mesa.example/account#recovery"));
    create_channel(&app, &cookie, server_id, "second").await;
    tokio::time::sleep(std::time::Duration::from_millis(50)).await;
    assert_eq!(reminder_count(&app, id).await, 1);
    let path = app
        .state
        .config
        .email_log_file
        .as_ref()
        .unwrap()
        .with_extension("eml");
    assert_eq!(tokio::fs::read_to_string(path).await.unwrap(), reminder);
}

#[tokio::test]
async fn preference_is_private_and_requires_session() {
    let app = TestApp::new().await;
    let (_, first, cookie) = app.register("first", "password1", None).await;
    let cookie = must_cookie(cookie);
    assert_eq!(first["key_reminders"], true);
    let (status, _, _) = app
        .request(
            "PATCH",
            "/api/auth/key-reminders",
            Some(json!({"enabled":false})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    let (status, updated, _) = app
        .request(
            "PATCH",
            "/api/auth/key-reminders",
            Some(json!({"enabled":false})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(updated["id"], first["id"]);
    assert_eq!(updated["key_reminders"], false);
    let (_, mine, _) = app
        .request("GET", "/api/auth/me", None, Some(&cookie))
        .await;
    assert_eq!(mine["key_reminders"], false);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(super::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    let (_, invite, _) = app
        .request(
            "POST",
            &format!("/api/servers/{}/invites", server["id"].as_str().unwrap()),
            Some(json!({"include_history":false})),
            Some(&cookie),
        )
        .await;
    let (_, second, second_cookie) = app
        .register("second", "password1", invite["code"].as_str())
        .await;
    assert_eq!(second["key_reminders"], true);
    let second_cookie = must_cookie(second_cookie);
    let (_, other_view, _) = app
        .request("GET", "/api/auth/me", None, Some(&second_cookie))
        .await;
    assert_eq!(other_view["id"], second["id"]);
    assert_eq!(other_view["key_reminders"], true);
    let (status, public, _) = app
        .request(
            "GET",
            &format!("/api/accounts/{}", first["id"].as_str().unwrap()),
            None,
            None,
        )
        .await;
    if status == StatusCode::OK {
        assert!(public.get("key_reminders").is_none());
    }
}
