use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

#[tokio::test]
async fn plaintext_never_stored() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "geral", "type": "text" })),
            Some(&cookie),
        )
        .await;
    let channel_id = ch["id"].as_str().unwrap();
    let plaintext = "the-secret-message-body";
    let cipher = base64::Engine::encode(
        &base64::engine::general_purpose::STANDARD,
        b"not-the-plaintext-XXXX",
    );
    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/messages"),
            Some(json!({ "content_ciphertext": cipher })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED);
    let found = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM message WHERE instr(content_ciphertext, ?) > 0",
    )
    .bind(plaintext.as_bytes())
    .fetch_one(&app.pool)
    .await
    .unwrap();
    assert_eq!(found, 0);
    let key_found = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM key_envelope WHERE instr(sealed_key, ?) > 0",
    )
    .bind(plaintext.as_bytes())
    .fetch_one(&app.pool)
    .await
    .unwrap();
    assert_eq!(key_found, 0);
}
