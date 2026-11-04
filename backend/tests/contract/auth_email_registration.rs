use super::common::TestApp;
use super::common::PUBKEY;
use axum::http::StatusCode;
use chat_backend::email_sender::EmailMessage;
use serde_json::{json, Value};

fn open(config: &mut chat_backend::config::Config) {
    config.registo_modo = "aberto".into();
}

async fn request_email(app: &TestApp, email: &str) -> (StatusCode, Value) {
    let (status, body, _) = app
        .request(
            "POST",
            "/api/auth/email/request",
            Some(json!({"email":email,"terms_accepted":true})),
            None,
        )
        .await;
    (status, body)
}

async fn issued_token(app: &TestApp, email: &str) -> String {
    assert_eq!(request_email(app, email).await.0, StatusCode::ACCEPTED);
    for _ in 0..100 {
        if let Some(path) = &app.state.config.email_log_file {
            if let Ok(content) = tokio::fs::read_to_string(path.with_extension("eml")).await {
                if content.contains(&format!("To: {email}")) {
                    return content
                        .split("#email_token=")
                        .nth(1)
                        .unwrap()
                        .split_whitespace()
                        .next()
                        .unwrap()
                        .to_string();
                }
            }
        }
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }
    panic!("email not written")
}

fn register_body(handle: &str, token: Option<&str>, invite: Option<&str>) -> Value {
    let mut value = json!({"handle": handle, "password": "password123", "identity_pubkey": PUBKEY});
    if let Some(token) = token {
        value["email_token"] = json!(token);
    }
    if let Some(code) = invite {
        value["invite_code"] = json!(code);
    }
    value
}

#[tokio::test]
async fn log_sender_link_is_readable_by_test_app() {
    let app = TestApp::new().await;
    app.state
        .email_sender
        .send(EmailMessage {
            to: "alice@example.com".into(),
            canonical: "alice@example.com".into(),
            purpose: "verify",
            subject: "Verify".into(),
            html: "".into(),
            text: "https://example.com/register#email_token=abc".into(),
        })
        .await;
    assert_eq!(
        app.last_email_link().await.as_deref(),
        Some("https://example.com/register#email_token=abc")
    );
    let diagnostics = tokio::fs::read_to_string(app.state.config.email_log_file.as_ref().unwrap())
        .await
        .unwrap();
    assert!(!diagnostics.contains("alice@example.com"));
    assert!(!diagnostics.contains("email_token=abc"));
}

#[tokio::test]
async fn config_and_request_validation_are_public_and_stable() {
    let closed = TestApp::new().await;
    let (status, body, _) = closed
        .request("GET", "/api/auth/register/config", None, None)
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["mode"], "fechado");
    assert!(body["turnstile_site_key"].is_null());
    let (status, body) = request_email(&closed, "a@example.org").await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    assert_eq!(body["code"], "registration_closed");

    let app = TestApp::with_config(|c| {
        open(c);
        c.turnstile_site_key = Some("public-key".into());
    })
    .await;
    let (_, config, _) = app
        .request("GET", "/api/auth/register/config", None, None)
        .await;
    assert_eq!(config["turnstile_site_key"], "public-key");
    let (status, body, _) = app
        .request(
            "POST",
            "/api/auth/email/request",
            Some(json!({"email":"a@example.org"})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "terms_required");
    let (status, body) = request_email(&app, "bad address").await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "email_invalid");
    let (status, body) = request_email(&app, "a@mailinator.com").await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "email_domain_blocked");
    let (status, body, _) = app
        .request(
            "POST",
            "/api/auth/email/request",
            Some(json!({"email":"a@example.org","terms_accepted":true,"website":"bot"})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::ACCEPTED);
    assert_eq!(body, json!({"ok":true}));
    assert!(app.last_email_link().await.is_none());

    let captcha = TestApp::with_config(|c| {
        open(c);
        c.turnstile_secret = chat_backend::config::Secret::new("secret");
    })
    .await;
    let (status, body) = request_email(&captcha, "a@example.org").await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "captcha_failed");
}

#[tokio::test]
async fn ip_limit_is_enforced_and_test_disable_bypasses_it() {
    let limited = TestApp::with_config(|c| {
        open(c);
        c.rate_limit_disabled = false;
    })
    .await;
    for n in 0..5 {
        assert_eq!(
            request_email(&limited, &format!("a{n}@example.org"))
                .await
                .0,
            StatusCode::ACCEPTED
        );
    }
    assert_eq!(
        request_email(&limited, "a6@example.org").await.0,
        StatusCode::TOO_MANY_REQUESTS
    );
    let unlimited = TestApp::with_config(open).await;
    for n in 0..7 {
        assert_eq!(
            request_email(&unlimited, &format!("a{n}@example.org"))
                .await
                .0,
            StatusCode::ACCEPTED
        );
    }
}

#[tokio::test]
async fn rejected_requests_count_toward_ip_limit() {
    let app = TestApp::with_config(|c| {
        open(c);
        c.rate_limit_disabled = false;
    })
    .await;
    for n in 0..5 {
        let body = if n % 2 == 0 {
            json!({"email":"bad address"})
        } else {
            json!({"email":"bad address","terms_accepted":true})
        };
        let (status, error, _) = app
            .request("POST", "/api/auth/email/request", Some(body), None)
            .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(
            error["code"],
            if n % 2 == 0 {
                "terms_required"
            } else {
                "email_invalid"
            }
        );
    }
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/email/request",
            Some(json!({"email":"bad address"})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::TOO_MANY_REQUESTS);
}

#[tokio::test]
async fn request_validation_errors_keep_their_precedence_before_ip_limit() {
    let app = TestApp::with_config(|c| {
        open(c);
        c.rate_limit_disabled = false;
        c.turnstile_secret = chat_backend::config::Secret::new("secret");
    })
    .await;
    for (body, expected_code) in [
        (json!({"email":"bad address"}), "terms_required"),
        (json!({"email":"bad address","terms_accepted":true}), "email_invalid"),
        (json!({"email":"a@mailinator.com","terms_accepted":true}), "email_domain_blocked"),
        (json!({"email":"a@example.org","terms_accepted":true}), "captcha_failed"),
    ] {
        let (status, error, _) = app
            .request("POST", "/api/auth/email/request", Some(body), None)
            .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(error["code"], expected_code);
    }
}

#[tokio::test]
async fn token_validation_and_single_use() {
    let app = TestApp::with_config(open).await;
    let token = issued_token(&app, "alice@example.org").await;
    let (stored_hash,): (String,) = sqlx::query_as(
        "SELECT token_hash FROM email_verification WHERE email_canonical = 'alice@example.org'",
    )
    .fetch_one(&app.pool)
    .await
    .unwrap();
    assert_ne!(stored_hash, token);
    assert_eq!(
        stored_hash,
        chat_backend::api::auth::session::hash_token(&token)
    );
    let verify = |token: &str| json!({"token":token});
    let (status, body, _) = app
        .request("POST", "/api/auth/email/verify", Some(verify(&token)), None)
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body["email"], "alice@example.org");
    let (status, _, _) = app
        .request("POST", "/api/auth/email/verify", Some(verify(&token)), None)
        .await;
    assert_eq!(status, StatusCode::OK);
    for invalid in ["bad", "f".repeat(64).as_str()] {
        let (status, body, _) = app
            .request(
                "POST",
                "/api/auth/email/verify",
                Some(verify(invalid)),
                None,
            )
            .await;
        assert_eq!(status, StatusCode::BAD_REQUEST);
        assert_eq!(body["code"], "email_token_invalid");
    }
    let (status, body, cookie) = app
        .request(
            "POST",
            "/api/auth/register",
            Some(register_body("alice", Some(&token), None)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    assert!(cookie.is_some());
    assert_eq!(body["email"], "alice@example.org");
    assert!(body["email_verified_at"].is_string());
    let (status, body, _) = app
        .request("POST", "/api/auth/email/verify", Some(verify(&token)), None)
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "email_token_invalid");
}

#[tokio::test]
async fn expired_replaced_and_existing_email_behave_consistently() {
    let app = TestApp::with_config(open).await;
    let token = issued_token(&app, "alice@example.org").await;
    sqlx::query("UPDATE email_verification SET expires_at = ? WHERE token_hash = ?")
        .bind("2000-01-01T00:00:00+00:00")
        .bind(chat_backend::api::auth::session::hash_token(&token))
        .execute(&app.pool)
        .await
        .unwrap();
    let (status, body, _) = app
        .request(
            "POST",
            "/api/auth/email/verify",
            Some(json!({"token":token})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "email_token_invalid");
    let second = issued_token(&app, "bob@example.org").await;
    let _ = request_email(&app, "bob@example.org").await;
    for _ in 0..100 {
        let (count,): (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM email_verification WHERE email_canonical = 'bob@example.org'",
        )
        .fetch_one(&app.pool)
        .await
        .unwrap();
        if count == 2 {
            break;
        }
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }
    let (status, body, _) = app
        .request(
            "POST",
            "/api/auth/email/verify",
            Some(json!({"token":second})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(body["code"], "email_token_invalid");
}

#[tokio::test]
async fn existing_email_gets_generic_response_and_notice_without_registration_link() {
    let app = TestApp::with_config(open).await;
    let token = issued_token(&app, "owner@example.org").await;
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/register",
            Some(register_body("owner", Some(&token), None)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::CREATED);
    let (status, body) = request_email(&app, "owner@example.org").await;
    assert_eq!(status, StatusCode::ACCEPTED);
    assert_eq!(body, json!({"ok":true}));
    let path = app
        .state
        .config
        .email_log_file
        .as_ref()
        .unwrap()
        .with_extension("eml");
    for _ in 0..100 {
        let content = tokio::fs::read_to_string(&path).await.unwrap_or_default();
        if content.contains("Purpose: notice") {
            assert!(!content.contains("#email_token="));
            return;
        }
        tokio::time::sleep(std::time::Duration::from_millis(10)).await;
    }
    panic!("notice email not sent");
}

#[tokio::test]
async fn cleanup_removes_old_verifications_without_touching_accounts() {
    let app = TestApp::with_config(open).await;
    let token = issued_token(&app, "owner@example.org").await;
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/register",
            Some(register_body("owner", Some(&token), None)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::CREATED);
    sqlx::query("UPDATE email_verification SET consumed_at = '2000-01-01T00:00:00+00:00' WHERE token_hash = ?")
        .bind(chat_backend::api::auth::session::hash_token(&token)).execute(&app.pool).await.unwrap();
    sqlx::query("INSERT INTO email_verification (id,email,email_canonical,token_hash,expires_at,created_at) VALUES ('expired','e@example.org','e@example.org','expired-hash','2000-01-01T00:00:00+00:00','2000-01-01T00:00:00+00:00')")
        .execute(&app.pool).await.unwrap();
    assert_eq!(
        chat_backend::api::auth::email::cleanup(&app.pool)
            .await
            .unwrap(),
        2
    );
    let (accounts,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM account")
        .fetch_one(&app.pool)
        .await
        .unwrap();
    assert_eq!(accounts, 1);
}

async fn owner_invite(app: &TestApp) -> (String, String, String) {
    let (_, _, cookie) = app.register("owner", "password123", None).await;
    let cookie = cookie.unwrap();
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
    let (status, invite, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{invite}");
    (
        cookie,
        server_id,
        invite["code"].as_str().unwrap().to_string(),
    )
}

#[tokio::test]
async fn open_signup_without_invite_has_no_server_and_can_log_in() {
    let app = TestApp::with_config(open).await;
    let _ = app.register("owner", "password123", None).await;
    let token = issued_token(&app, "bob@example.org").await;
    let (status, body, cookie) = app
        .request(
            "POST",
            "/api/auth/register",
            Some(register_body("bob", Some(&token), None)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    let cookie = cookie.unwrap();
    let (status, servers, _) = app
        .request("GET", "/api/servers", None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(servers, json!([]));
    let (status, me, _) = app
        .request("GET", "/api/auth/me", None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(me["email"], "bob@example.org");
    assert!(me["email_verified_at"].is_string());
    let (status, login, _) = app.login("bob", "password123").await;
    assert_eq!(status, StatusCode::OK, "{login}");
    assert_eq!(login["email"], "bob@example.org");
}

#[tokio::test]
async fn invite_with_email_joins_server_and_invalid_invite_keeps_token() {
    let app = TestApp::with_config(open).await;
    let (_, server_id, invite) = owner_invite(&app).await;
    let token = issued_token(&app, "bob@example.org").await;
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/register",
            Some(register_body("bob", Some(&token), Some("invalid"))),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/email/verify",
            Some(json!({"token":token})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (status, body, cookie) = app
        .request(
            "POST",
            "/api/auth/register",
            Some(register_body("bob", Some(&token), Some(&invite))),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    let (status, servers, _) = app
        .request("GET", "/api/servers", None, cookie.as_deref())
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(servers[0]["id"], server_id);
    assert_eq!(servers.as_array().unwrap().len(), 1);
}

#[tokio::test]
async fn closed_mode_and_duplicate_handle_leave_token_usable() {
    let app = TestApp::with_config(open).await;
    let _ = app.register("owner", "password123", None).await;
    let token = issued_token(&app, "bob@example.org").await;
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/register",
            Some(register_body("owner", Some(&token), None)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::CONFLICT);
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/email/verify",
            Some(json!({"token":token})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let closed_app = TestApp::with_config(|c| {
        c.registo_modo = "fechado".into();
    })
    .await;
    let _ = closed_app.register("owner", "password123", None).await;
    sqlx::query("INSERT INTO email_verification (id,email,email_canonical,token_hash,expires_at,created_at) VALUES ('closed-token','bob@example.org','bob@example.org',?, '2999-01-01T00:00:00+00:00','2026-01-01T00:00:00+00:00')")
        .bind(chat_backend::api::auth::session::hash_token(&token)).execute(&closed_app.pool).await.unwrap();
    let (status, _, _) = closed_app
        .request(
            "POST",
            "/api/auth/register",
            Some(register_body("bob", Some(&token), None)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
    let (status, _, _) = closed_app
        .request(
            "POST",
            "/api/auth/email/verify",
            Some(json!({"token":token})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK);
}

#[tokio::test]
async fn email_taken_is_conflict_and_does_not_consume_token() {
    let app = TestApp::with_config(open).await;
    let token = issued_token(&app, "alice@example.org").await;
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/register",
            Some(register_body("alice", Some(&token), None)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::CREATED);
    let second = "a".repeat(64);
    sqlx::query("INSERT INTO email_verification (id,email,email_canonical,token_hash,expires_at,created_at) VALUES ('duplicate-email','alice+other@example.org','alice@example.org',?, '2999-01-01T00:00:00+00:00','2026-01-01T00:00:00+00:00')")
        .bind(chat_backend::api::auth::session::hash_token(&second)).execute(&app.pool).await.unwrap();
    let (status, body, _) = app
        .request(
            "POST",
            "/api/auth/register",
            Some(register_body("bob", Some(&second), None)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::CONFLICT, "{body}");
    assert_eq!(body["code"], "email_taken");
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/email/verify",
            Some(json!({"token":second})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK);
}

#[tokio::test]
async fn own_email_is_absent_from_other_account_views_and_invites() {
    let app = TestApp::with_config(open).await;
    let (owner_cookie, server_id, invite) = owner_invite(&app).await;
    let token = issued_token(&app, "bob@example.org").await;
    let (_, _, bob_cookie) = app
        .request(
            "POST",
            "/api/auth/register",
            Some(register_body("bob", Some(&token), Some(&invite))),
            None,
        )
        .await;
    let (status, members, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/members"),
            None,
            Some(&owner_cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert!(!members.to_string().contains("bob@example.org"));
    let (_, channel, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({"name":"geral","type":"text"})),
            Some(&owner_cookie),
        )
        .await;
    let (status, mentionables, _) = app
        .request(
            "GET",
            &format!(
                "/api/channels/{}/mentionables",
                channel["id"].as_str().unwrap()
            ),
            None,
            Some(&owner_cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert!(!mentionables.to_string().contains("bob@example.org"));
    let (status, invite_view, _) = app
        .request(
            "GET",
            &format!("/api/invites/{invite}"),
            None,
            bob_cookie.as_deref(),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert!(!invite_view.to_string().contains("bob@example.org"));
}

#[tokio::test]
async fn no_server_account_accepts_invite_later() {
    let app = TestApp::with_config(open).await;
    let (_, server_id, invite) = owner_invite(&app).await;
    let token = issued_token(&app, "bob@example.org").await;
    let (status, _, cookie) = app
        .request(
            "POST",
            "/api/auth/register",
            Some(register_body("bob", Some(&token), None)),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::CREATED);
    let cookie = cookie.unwrap();
    let (_, empty, _) = app
        .request("GET", "/api/servers", None, Some(&cookie))
        .await;
    assert_eq!(empty, json!([]));
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/invites/{invite}/accept"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (_, joined, _) = app
        .request("GET", "/api/servers", None, Some(&cookie))
        .await;
    assert_eq!(joined[0]["id"], server_id);
}

#[tokio::test]
async fn closed_mode_invite_registration_and_login_stay_compatible() {
    let app = TestApp::new().await;
    let (_, server_id, invite) = owner_invite(&app).await;
    let (status, body, cookie) = app.register("bob", "password123", Some(&invite)).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    assert!(body["email"].is_null());
    let (_, servers, _) = app
        .request("GET", "/api/servers", None, cookie.as_deref())
        .await;
    assert_eq!(servers[0]["id"], server_id);
    assert_eq!(app.login("bob", "password123").await.0, StatusCode::OK);
}

#[tokio::test]
async fn invalid_body_precedes_invalid_token_and_invite_error() {
    let app = TestApp::with_config(open).await;
    let _ = app.register("owner", "password123", None).await;
    let mut body = register_body("bob", Some("bad"), Some("invalid"));
    body["password"] = json!("short");
    let (status, error, _) = app
        .request("POST", "/api/auth/register", Some(body), None)
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_ne!(error["code"], "email_token_invalid");
    let (status, error, _) = app
        .request(
            "POST",
            "/api/auth/register",
            Some(register_body("bob", Some("bad"), Some("invalid"))),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    assert_eq!(error["code"], "email_token_invalid");
}
