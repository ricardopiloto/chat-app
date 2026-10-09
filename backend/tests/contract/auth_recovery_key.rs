use crate::common::{must_cookie, TestApp, PUBKEY};
use axum::http::StatusCode;
use base64::Engine;
use chat_backend::api::auth::recovery_key::{canonical_vault_json, recovery_sign_message};
use ed25519_dalek::{Signature, Signer, SigningKey, Verifier, VerifyingKey};
use serde_json::{json, Value};
use sha2::{Digest, Sha256};
use uuid::Uuid;

fn key() -> SigningKey {
    SigningKey::from_bytes(&[7u8; 32])
}

fn b64(bytes: &[u8]) -> String {
    base64::engine::general_purpose::STANDARD.encode(bytes)
}

fn sign(signing: &SigningKey, operation: &str, handle: &str, left: &[u8], right: &[u8]) -> String {
    b64(&signing
        .sign(&recovery_sign_message(operation, handle, left, right))
        .to_bytes())
}

fn identity_vault() -> Value {
    json!({"v":1,"publicKey":vec![0u8;32],"salt":[1],"iv":[2],"wrapped":[3]})
}

async fn install(app: &TestApp, cookie: &str, signing: &SigningKey) {
    let (status, body, _) = app
        .request(
            "PUT",
            "/api/auth/recovery-key",
            Some(json!({
                "current_password": "password1",
                "recovery_vault": {"v":1,"publicKey":[9,9],"iv":[1],"wrapped":[2]},
                "recovery_verifier_pubkey": b64(signing.verifying_key().as_bytes()),
            })),
            Some(cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["has_recovery_key"], true);
    assert!(body.get("recovery_vault").is_none());
    assert!(body.get("session_token").is_none());
}

async fn open_ticket(app: &TestApp, handle: &str, signing: &SigningKey) -> (Value, String) {
    let (status, challenge, _) = app
        .request(
            "POST",
            "/api/auth/recovery/key/challenge",
            Some(json!({"handle": handle})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{challenge}");
    let challenge_id = Uuid::parse_str(challenge["challenge_id"].as_str().unwrap()).unwrap();
    let nonce = base64::engine::general_purpose::STANDARD
        .decode(challenge["nonce"].as_str().unwrap())
        .unwrap();
    let (status, started, _) = app
        .request(
            "POST",
            "/api/auth/recovery/key/start",
            Some(json!({
                "handle": handle,
                "challenge_id": challenge_id,
                "nonce": challenge["nonce"],
                "signature": sign(signing, "start", handle, challenge_id.as_bytes(), &nonce),
            })),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{started}");
    assert!(started.get("recovery_vault").is_some());
    (
        started["recovery_vault"].clone(),
        started["ticket"].as_str().unwrap().to_string(),
    )
}

fn redeem_body(
    handle: &str,
    ticket: &str,
    signing: &SigningKey,
    password: &str,
    vault: &Value,
) -> Value {
    let ticket_bytes = base64::engine::general_purpose::STANDARD
        .decode(ticket)
        .unwrap();
    let canonical = canonical_vault_json(vault).unwrap();
    let mut hashed = Sha256::new();
    hashed.update(password.as_bytes());
    hashed.update([0u8]);
    hashed.update(canonical.as_bytes());
    let hash: [u8; 32] = hashed.finalize().into();
    json!({
        "handle": handle,
        "ticket": ticket,
        "signature": sign(signing, "redeem", handle, &ticket_bytes, &hash),
        "password": password,
        "identity_vault": vault,
    })
}

#[tokio::test]
async fn recovery_key_keeps_identity_and_envelopes() {
    let app = TestApp::new().await;
    let (_, alice, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let signing = key();
    install(&app, &cookie, &signing).await;
    let (status, me, _) = app
        .request("GET", "/api/auth/me", None, Some(&cookie))
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(me["has_recovery_key"], true);
    assert!(me.get("recovery_vault").is_none());
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("mesa")),
            Some(&cookie),
        )
        .await;
    let alice_id = alice["id"].as_str().unwrap();
    sqlx::query(
        "INSERT INTO key_envelope (server_id, account_id, sealed_key, sealed_by_account_id, created_at) VALUES (?, ?, X'0102', ?, '2026-10-08T00:00:00Z')",
    )
    .bind(server["id"].as_str().unwrap())
    .bind(alice_id)
    .bind(alice_id)
    .execute(&app.pool)
    .await
    .unwrap();
    let (_, ticket) = open_ticket(&app, "alice", &signing).await;
    let (status, updated, fresh) = app
        .request(
            "POST",
            "/api/auth/recovery/key/redeem",
            Some(redeem_body(
                "alice",
                &ticket,
                &signing,
                "newpassword1",
                &identity_vault(),
            )),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{updated}");
    let (pubkey,): (Vec<u8>,) = sqlx::query_as("SELECT identity_pubkey FROM account WHERE id = ?")
        .bind(alice_id)
        .fetch_one(&app.pool)
        .await
        .unwrap();
    assert_eq!(pubkey, vec![0u8; 32]);
    assert_eq!(updated["identity_vault"]["publicKey"], json!(vec![0u8; 32]));
    assert_eq!(updated["has_recovery_key"], true);
    let token = updated["session_token"].as_str().expect("session_token");
    let fresh = must_cookie(fresh);
    assert_eq!(fresh, format!("Session={token}"));
    let (status, _, _) = app
        .request(
            "PATCH",
            "/api/auth/display-name",
            Some(json!({"display_name":"X"})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    let (status, _, _) = app.request("GET", "/api/auth/me", None, Some(&fresh)).await;
    assert_eq!(status, StatusCode::OK);
    let (synced,): (String,) = sqlx::query_as(
        "SELECT key_handoff_status FROM membership WHERE account_id = ? AND server_id = ?",
    )
    .bind(alice_id)
    .bind(server["id"].as_str().unwrap())
    .fetch_one(&app.pool)
    .await
    .unwrap();
    assert_eq!(synced, "synced");
    let (envelopes,): (i64,) =
        sqlx::query_as("SELECT COUNT(*) FROM key_envelope WHERE account_id = ?")
            .bind(alice_id)
            .fetch_one(&app.pool)
            .await
            .unwrap();
    assert_eq!(envelopes, 1);
    let (status, again, _) = app
        .request(
            "POST",
            "/api/auth/recovery/key/redeem",
            Some(redeem_body(
                "alice",
                &ticket,
                &signing,
                "newpassword1",
                &identity_vault(),
            )),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED, "{again}");
    let _ = PUBKEY;
}

#[tokio::test]
async fn invalid_proofs_are_uniform_and_hide_the_vault() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    install(&app, &cookie, &key()).await;
    let (status_missing, missing, _) = app
        .request(
            "POST",
            "/api/auth/recovery/key/start",
            Some(json!({
                "handle": "nobody",
                "challenge_id": Uuid::new_v4(),
                "nonce": "AAAA",
                "signature": "AAAA",
            })),
            None,
        )
        .await;
    assert_eq!(status_missing, StatusCode::UNAUTHORIZED);
    assert!(missing.get("recovery_vault").is_none());
    let (status, challenge, _) = app
        .request(
            "POST",
            "/api/auth/recovery/key/challenge",
            Some(json!({"handle": "alice"})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let (status, bad, _) = app
        .request(
            "POST",
            "/api/auth/recovery/key/start",
            Some(json!({
                "handle": "alice",
                "challenge_id": challenge["challenge_id"],
                "nonce": challenge["nonce"],
                "signature": "AAAA",
            })),
            None,
        )
        .await;
    assert_eq!(status, status_missing);
    assert_eq!(bad, missing);
    let (status, hidden, _) = app
        .request(
            "POST",
            "/api/auth/recovery/key/challenge",
            Some(json!({"handle": "ghost"})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(
        hidden["challenge_id"].as_str().is_some(),
        challenge["challenge_id"].as_str().is_some()
    );
    assert!(hidden.get("recovery_vault").is_none());
}

#[tokio::test]
async fn challenge_and_ticket_are_single_use_even_together() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("alice", "password1", None).await;
    let signing = key();
    install(&app, &must_cookie(cookie), &signing).await;
    let (status, challenge, _) = app
        .request(
            "POST",
            "/api/auth/recovery/key/challenge",
            Some(json!({"handle": "alice"})),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let challenge_id = Uuid::parse_str(challenge["challenge_id"].as_str().unwrap()).unwrap();
    let nonce = base64::engine::general_purpose::STANDARD
        .decode(challenge["nonce"].as_str().unwrap())
        .unwrap();
    let body = json!({
        "handle": "alice",
        "challenge_id": challenge_id,
        "nonce": challenge["nonce"],
        "signature": sign(&signing, "start", "alice", challenge_id.as_bytes(), &nonce),
    });
    let first = app.request(
        "POST",
        "/api/auth/recovery/key/start",
        Some(body.clone()),
        None,
    );
    let second = app.request("POST", "/api/auth/recovery/key/start", Some(body), None);
    let ((left, left_body, _), (right, right_body, _)) = tokio::join!(first, second);
    let oks = [left, right]
        .into_iter()
        .filter(|status| *status == StatusCode::OK)
        .count();
    assert_eq!(oks, 1);
    assert_eq!(
        [left, right]
            .into_iter()
            .filter(|status| *status == StatusCode::UNAUTHORIZED)
            .count(),
        1
    );
    let winner = if left == StatusCode::OK {
        left_body
    } else {
        right_body
    };
    let ticket = winner["ticket"].as_str().unwrap().to_string();
    let redeem = redeem_body(
        "alice",
        &ticket,
        &signing,
        "newpassword1",
        &identity_vault(),
    );
    let one = app.request(
        "POST",
        "/api/auth/recovery/key/redeem",
        Some(redeem.clone()),
        None,
    );
    let two = app.request("POST", "/api/auth/recovery/key/redeem", Some(redeem), None);
    let ((a, _, _), (b, _, _)) = tokio::join!(one, two);
    assert_eq!(
        [a, b]
            .into_iter()
            .filter(|status| *status == StatusCode::OK)
            .count(),
        1
    );
    assert_eq!(
        [a, b]
            .into_iter()
            .filter(|status| *status == StatusCode::UNAUTHORIZED)
            .count(),
        1
    );
}

#[tokio::test]
async fn redeem_rejects_a_signature_bound_to_another_password_or_vault() {
    let app = TestApp::new().await;
    let (_, alice, cookie) = app.register("alice", "password1", None).await;
    let signing = key();
    install(&app, &must_cookie(cookie), &signing).await;
    let (_, ticket) = open_ticket(&app, "alice", &signing).await;
    let mut swapped = redeem_body(
        "alice",
        &ticket,
        &signing,
        "newpassword1",
        &identity_vault(),
    );
    swapped["password"] = json!("otherpass1");
    let (status, _, _) = app
        .request("POST", "/api/auth/recovery/key/redeem", Some(swapped), None)
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    let mut other = identity_vault();
    other["publicKey"] = json!(vec![4u8; 32]);
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/recovery/key/redeem",
            Some(redeem_body(
                "alice",
                &ticket,
                &signing,
                "newpassword1",
                &other,
            )),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    let (status, _, _) = app.login("alice", "password1").await;
    assert_eq!(status, StatusCode::OK);
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/recovery/key/redeem",
            Some(redeem_body(
                "bob",
                &ticket,
                &signing,
                "newpassword1",
                &identity_vault(),
            )),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    let (hash,): (String,) = sqlx::query_as("SELECT password_hash FROM account WHERE id = ?")
        .bind(alice["id"].as_str().unwrap())
        .fetch_one(&app.pool)
        .await
        .unwrap();
    assert!(hash.starts_with("$argon2"));
}

#[tokio::test]
async fn rotating_the_recovery_key_invalidates_outstanding_tickets() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let signing = key();
    install(&app, &cookie, &signing).await;
    let (_, ticket) = open_ticket(&app, "alice", &signing).await;
    let replacement = SigningKey::from_bytes(&[8u8; 32]);
    let (status, body, _) = app
        .request(
            "PUT",
            "/api/auth/recovery-key",
            Some(json!({
                "current_password": "password1",
                "recovery_vault": {"v":1,"publicKey":[1],"iv":[2],"wrapped":[3]},
                "recovery_verifier_pubkey": b64(replacement.verifying_key().as_bytes()),
            })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/recovery/key/redeem",
            Some(redeem_body(
                "alice",
                &ticket,
                &signing,
                "newpassword1",
                &identity_vault(),
            )),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    let (status, _, _) = app
        .request(
            "PUT",
            "/api/auth/recovery-key",
            Some(json!({
                "current_password": "wrong-password",
                "recovery_vault": {"v":1,"publicKey":[1],"iv":[2],"wrapped":[3]},
                "recovery_verifier_pubkey": b64(signing.verifying_key().as_bytes()),
            })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}

#[tokio::test]
async fn register_without_recovery_fields_stays_compatible() {
    let app = TestApp::new().await;
    let (status, _, _) = app
        .request(
            "POST",
            "/api/auth/register",
            Some(json!({
                "handle": "bob",
                "password": "password1",
                "identity_pubkey": PUBKEY,
                "identity_vault": identity_vault(),
                "recovery_vault": {"v":1,"publicKey":[1],"iv":[2],"wrapped":[3]},
            })),
            None,
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST);
    let (status, _, _) = app.login("bob", "password1").await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    let (status, alice, _) = app.register("alice", "password1", None).await;
    assert_eq!(status, StatusCode::CREATED);
    assert_eq!(alice["has_recovery_key"], false);
}

#[test]
fn recovery_signature_matches_the_tweetnacl_vector() {
    let doc: Value = serde_json::from_str(include_str!(
        "../../../docs/v2/contracts/vectors/crypto-vectors.json"
    ))
    .unwrap();
    let recovery = &doc["recovery"];
    let decode = |key: &str| {
        base64::engine::general_purpose::STANDARD
            .decode(recovery[key].as_str().unwrap())
            .unwrap()
    };
    let message = decode("message");
    let built = recovery_sign_message("start", "alice", &[3u8; 16], &[4u8; 32]);
    assert_eq!(built, message);
    let public_key = decode("verifierPublicKey");
    let key = VerifyingKey::from_bytes(public_key.as_slice().try_into().unwrap()).unwrap();
    key.verify(
        &message,
        &Signature::from_slice(&decode("signature")).unwrap(),
    )
    .unwrap();
    assert_eq!(
        canonical_vault_json(&recovery["vault"]).unwrap(),
        recovery["canonicalVault"].as_str().unwrap()
    );
    let mut hashed = Sha256::new();
    hashed.update(recovery["password"].as_str().unwrap().as_bytes());
    hashed.update([0u8]);
    hashed.update(recovery["canonicalVault"].as_str().unwrap().as_bytes());
    let digest: [u8; 32] = hashed.finalize().into();
    assert_eq!(b64(&digest), recovery["payloadHash"].as_str().unwrap());
}

#[tokio::test]
async fn recovery_key_failures_share_the_handle_quota() {
    let app = TestApp::with_config(|config| config.rate_limit_disabled = false).await;
    let body = json!({
        "handle": "ghost",
        "challenge_id": Uuid::new_v4(),
        "nonce": "AAAA",
        "signature": "AAAA",
    });
    for _ in 0..5 {
        let (status, _, _) = app
            .request(
                "POST",
                "/api/auth/recovery/key/start",
                Some(body.clone()),
                None,
            )
            .await;
        assert_eq!(status, StatusCode::UNAUTHORIZED);
    }
    let (status, _, _) = app
        .request("POST", "/api/auth/recovery/key/start", Some(body), None)
        .await;
    assert_eq!(status, StatusCode::TOO_MANY_REQUESTS);
}
