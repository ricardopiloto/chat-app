use super::common::TestApp;
use axum::body::Body;
use axum::http::Request;
use axum::http::StatusCode;
use base64::Engine;
use chat_backend::api::auth::recovery_key::{canonical_vault_json, recovery_sign_message};
use ed25519_dalek::{Signer, SigningKey};
use serde_json::json;
use sha2::{Digest, Sha256};
use std::future::Future;
use std::pin::Pin;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tower::ServiceExt;

const PATH: &str = "/api/auth/recovery/email/request";

struct CountingSender(Arc<AtomicUsize>);
impl chat_backend::email_sender::EmailSender for CountingSender {
    fn send<'a>(
        &'a self,
        _message: chat_backend::email_sender::EmailMessage,
    ) -> Pin<Box<dyn Future<Output = ()> + Send + 'a>> {
        Box::pin(async move {
            self.0.fetch_add(1, Ordering::SeqCst);
        })
    }
}

async fn account(app: &TestApp, handle: &str, email: &str, key: bool) {
    let (_, body, _) = app.register(handle, "password1", None).await;
    let id = body["id"].as_str().unwrap();
    sqlx::query("UPDATE account SET email = ?, email_canonical = ?, email_verified_at = ?, recovery_vault = ?, recovery_verifier_pubkey = ? WHERE id = ?")
        .bind(email).bind(chat_backend::email_address::normalize(email).unwrap().1)
        .bind("2026-01-01T00:00:00Z")
        .bind(if key { Some(vec![1u8]) } else { None })
        .bind(if key { Some(vec![2u8;32]) } else { None })
        .bind(id).execute(&app.pool).await.unwrap();
}

async fn ask(app: &TestApp, email: &str) -> (StatusCode, serde_json::Value) {
    let (status, body, _) = app
        .request("POST", PATH, Some(json!({"email":email})), None)
        .await;
    (status, body)
}

async fn email_file(app: &TestApp, purpose: &str) -> String {
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
    panic!("email not sent");
}

#[tokio::test]
async fn endpoint_is_absent_by_default() {
    let app = TestApp::new().await;
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/recovery/email/request",
            Some(json!({"email":"person@example.org"})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::NOT_FOUND);
}

#[tokio::test]
async fn verified_account_with_key_gets_fragment_link_without_secret() {
    let app = TestApp::with_config(|c| c.reset_email = true).await;
    account(&app, "alice", "alice@example.org", true).await;
    assert_eq!(
        ask(&app, "ALICE@example.org").await,
        (StatusCode::ACCEPTED, json!({"ok":true}))
    );
    let content = email_file(&app, "recovery_request").await;
    assert!(content.contains("https://mesa.example/recover#handle=alice"));
    assert!(!content.contains("email_token"));
    assert!(!content.contains("recovery_vault"));
    assert!(!content.contains("[1]"));
}

#[tokio::test]
async fn verified_account_without_key_gets_operator_guidance_without_link() {
    let app = TestApp::with_config(|c| c.reset_email = true).await;
    account(&app, "alice", "alice@example.org", false).await;
    assert_eq!(ask(&app, "alice@example.org").await.0, StatusCode::ACCEPTED);
    let content = email_file(&app, "recovery_request").await;
    assert!(content.contains("operador"));
    assert!(!content.contains("/recover#"));
}

#[tokio::test]
async fn unknown_unverified_and_no_email_return_same_response_without_delivery() {
    let app = TestApp::with_config(|c| c.reset_email = true).await;
    let _ = app.register("alice", "password1", None).await;
    let expected = (StatusCode::ACCEPTED, json!({"ok":true}));
    assert_eq!(ask(&app, "unknown@example.org").await, expected);
    assert_eq!(ask(&app, "alice@example.org").await, expected);
    let path = app
        .state
        .config
        .email_log_file
        .as_ref()
        .unwrap()
        .with_extension("eml");
    tokio::time::sleep(std::time::Duration::from_millis(30)).await;
    assert!(!path.exists());
}

#[tokio::test]
async fn ip_limit_and_alias_bucket_are_enforced() {
    let app = TestApp::with_config(|c| {
        c.reset_email = true;
        c.rate_limit_disabled = false;
    })
    .await;
    account(&app, "alice", "a.b@gmail.com", true).await;
    let count = Arc::new(AtomicUsize::new(0));
    let mut state = app.state.clone();
    state.email_sender = Arc::new(CountingSender(count.clone()));
    let router = chat_backend::router(state);
    for alias in [
        "a.b@gmail.com",
        "ab+one@gmail.com",
        "a.b+two@googlemail.com",
        "ab@gmail.com",
        "a.b+four@gmail.com",
    ] {
        let response = router
            .clone()
            .oneshot(
                Request::builder()
                    .method("POST")
                    .uri(PATH)
                    .header("content-type", "application/json")
                    .body(Body::from(json!({"email":alias}).to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        assert_eq!(response.status(), StatusCode::ACCEPTED);
    }
    for _ in 0..100 {
        if count.load(Ordering::SeqCst) == 3 {
            break;
        }
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }
    assert_eq!(count.load(Ordering::SeqCst), 3);
    assert_eq!(
        ask(&app, "ab@gmail.com").await.0,
        StatusCode::TOO_MANY_REQUESTS
    );
}

#[tokio::test]
async fn registration_requests_do_not_exhaust_recovery_ip_limit() {
    let app = TestApp::with_config(|c| {
        c.registo_modo = "aberto".into();
        c.reset_email = true;
        c.rate_limit_disabled = false;
    })
    .await;
    for n in 0..5 {
        let (status, _, _) = app
            .request(
                "POST",
                "/api/auth/email/request",
                Some(json!({"email":format!("registration{n}@example.org"),"terms_accepted":true})),
                None,
            )
            .await;
        assert_eq!(status, StatusCode::ACCEPTED);
    }
    for n in 0..5 {
        assert_eq!(
            ask(&app, &format!("recovery{n}@example.org")).await.0,
            StatusCode::ACCEPTED
        );
    }
    assert_eq!(
        ask(&app, "recovery5@example.org").await.0,
        StatusCode::TOO_MANY_REQUESTS
    );
}

#[tokio::test]
async fn honeypot_stays_generic_and_sends_nothing() {
    let app = TestApp::with_config(|c| c.reset_email = true).await;
    account(&app, "alice", "alice@example.org", true).await;
    let (status, body, _) = app
        .request(
            "POST",
            PATH,
            Some(json!({"email":"alice@example.org", "website":"bot"})),
            None,
        )
        .await;
    assert_eq!((status, body), (StatusCode::ACCEPTED, json!({"ok":true})));
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
async fn unavailable_fake_provider_cannot_change_the_public_response() {
    let app = TestApp::with_config(|c| c.reset_email = true).await;
    account(&app, "alice", "alice@example.org", true).await;
    let mut state = app.state.clone();
    state.email_sender = Arc::new(chat_backend::email_sender::ResendSender::new(
        chat_backend::config::Secret::new("fake"),
        "Mesa <mesa@example.org>".into(),
        "http://127.0.0.1:1".into(),
    ));
    let router = chat_backend::router(state);
    let response = router
        .oneshot(
            Request::builder()
                .method("POST")
                .uri(PATH)
                .header("content-type", "application/json")
                .body(Body::from(json!({"email":"alice@example.org"}).to_string()))
                .unwrap(),
        )
        .await
        .unwrap();
    assert_eq!(response.status(), StatusCode::ACCEPTED);
}

fn vault() -> serde_json::Value {
    json!({"v":1,"publicKey":vec![0u8;32],"salt":[1],"iv":[2],"wrapped":[3]})
}

#[tokio::test]
async fn operator_reset_sends_notice_and_password_change_does_not() {
    let app = TestApp::with_config(|c| c.reset_email = true).await;
    account(&app, "alice", "alice@example.org", false).await;
    let (_, me, cookie) = app.login("alice", "password1").await;
    let cookie = cookie.unwrap();
    let (status, _, _) = app
        .request(
            "PUT",
            "/api/auth/password",
            Some(json!({
                "current_password":"password1", "new_password":"password2", "identity_vault":vault()
            })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
    tokio::time::sleep(std::time::Duration::from_millis(30)).await;
    assert!(!app
        .state
        .config
        .email_log_file
        .as_ref()
        .unwrap()
        .with_extension("eml")
        .exists());

    let code = chat_backend::api::auth::recovery::generate_code();
    sqlx::query("INSERT INTO password_reset (id, account_id, code_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, 0, ?)")
        .bind(uuid::Uuid::new_v4().to_string()).bind(me["id"].as_str().unwrap())
        .bind(chat_backend::api::auth::recovery::hash_code(&code).unwrap())
        .bind("2999-01-01T00:00:00Z").bind("2026-01-01T00:00:00Z")
        .execute(&app.pool).await.unwrap();
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/recovery/code/redeem",
            Some(json!({
                "handle":"alice", "code":code, "password":"newpassword1",
                "identity_pubkey":"QkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkI=",
                "identity_vault":{"v":1,"publicKey":vec![66u8;32],"salt":[1],"iv":[2],"wrapped":[3]}
            })),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert!(email_file(&app, "password_reset_notice")
        .await
        .contains("Senha do Mesa alterada"));
}

#[tokio::test]
async fn key_reset_sends_notice() {
    let app = TestApp::with_config(|c| c.reset_email = true).await;
    account(&app, "alice", "alice@example.org", false).await;
    let signing = SigningKey::from_bytes(&[7u8; 32]);
    let (_, _, cookie) = app.login("alice", "password1").await;
    let (status, _, _) = app.request("PUT", "/api/auth/recovery-key", Some(json!({
        "current_password":"password1", "recovery_vault":{"v":1,"publicKey":[9],"iv":[1],"wrapped":[2]},
        "recovery_verifier_pubkey":base64::engine::general_purpose::STANDARD.encode(signing.verifying_key().as_bytes())
    })), cookie.as_deref()).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        ask(&app, "alice@example.org").await,
        (StatusCode::ACCEPTED, json!({"ok":true}))
    );
    let request_email = email_file(&app, "recovery_request").await;
    assert!(request_email.contains("https://mesa.example/recover#handle=alice"));
    let (status, challenge, _) = app
        .request(
            "POST",
            "/api/auth/recovery/key/challenge",
            Some(json!({"handle":"alice"})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let challenge_id = uuid::Uuid::parse_str(challenge["challenge_id"].as_str().unwrap()).unwrap();
    let nonce = base64::engine::general_purpose::STANDARD
        .decode(challenge["nonce"].as_str().unwrap())
        .unwrap();
    let signature = signing.sign(&recovery_sign_message(
        "start",
        "alice",
        challenge_id.as_bytes(),
        &nonce,
    ));
    let (status, started, _) = app
        .request(
            "POST",
            "/api/auth/recovery/key/start",
            Some(json!({
                "handle":"alice", "challenge_id":challenge_id, "nonce":challenge["nonce"],
                "signature":base64::engine::general_purpose::STANDARD.encode(signature.to_bytes())
            })),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let ticket = base64::engine::general_purpose::STANDARD
        .decode(started["ticket"].as_str().unwrap())
        .unwrap();
    let mut hash = Sha256::new();
    hash.update(b"password2");
    hash.update([0u8]);
    hash.update(canonical_vault_json(&vault()).unwrap().as_bytes());
    let signature = signing.sign(&recovery_sign_message(
        "redeem",
        "alice",
        &ticket,
        &hash.finalize(),
    ));
    let (status, _, _) = app.request("POST", "/api/auth/recovery/key/redeem", Some(json!({
        "handle":"alice", "ticket":started["ticket"], "signature":base64::engine::general_purpose::STANDARD.encode(signature.to_bytes()),
        "password":"password2", "identity_vault":vault()
    })), None).await;
    assert_eq!(status, StatusCode::OK);
    assert!(email_file(&app, "password_reset_notice")
        .await
        .contains("Senha do Mesa alterada"));
}

#[tokio::test]
async fn provider_failure_does_not_prevent_operator_reset() {
    let app = TestApp::with_config(|c| c.reset_email = true).await;
    account(&app, "alice", "alice@example.org", false).await;
    let (_, me, _) = app.login("alice", "password1").await;
    let code = chat_backend::api::auth::recovery::generate_code();
    sqlx::query("INSERT INTO password_reset (id, account_id, code_hash, expires_at, attempts, created_at) VALUES (?, ?, ?, ?, 0, ?)")
        .bind(uuid::Uuid::new_v4().to_string()).bind(me["id"].as_str().unwrap())
        .bind(chat_backend::api::auth::recovery::hash_code(&code).unwrap())
        .bind("2999-01-01T00:00:00Z").bind("2026-01-01T00:00:00Z")
        .execute(&app.pool).await.unwrap();
    let mut state = app.state.clone();
    state.email_sender = Arc::new(chat_backend::email_sender::ResendSender::new(
        chat_backend::config::Secret::new("fake"),
        "Mesa <mesa@example.org>".into(),
        "http://127.0.0.1:1".into(),
    ));
    let router = chat_backend::router(state);
    let response = router.oneshot(Request::builder().method("POST").uri("/api/auth/recovery/code/redeem")
        .header("content-type", "application/json")
        .body(Body::from(json!({
            "handle":"alice", "code":code, "password":"newpassword1",
            "identity_pubkey":"QkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkJCQkI=",
            "identity_vault":{"v":1,"publicKey":vec![66u8;32],"salt":[1],"iv":[2],"wrapped":[3]}
        }).to_string())).unwrap()).await.unwrap();
    assert_eq!(response.status(), StatusCode::OK);
    assert_eq!(app.login("alice", "newpassword1").await.0, StatusCode::OK);
}
