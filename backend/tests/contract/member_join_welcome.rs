use crate::common::{create_server_body, must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

async fn owner_and_server(app: &TestApp) -> (String, String) {
    let (_, _, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    (cookie, server["id"].as_str().unwrap().to_string())
}

async fn geral_channel_id(app: &TestApp, cookie: &str, server_id: &str) -> String {
    let (status, channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{channels}");
    channels
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["name"] == "geral" && c["type"] == "text")
        .expect("geral text channel")["id"]
        .as_str()
        .unwrap()
        .to_string()
}

async fn rename_geral(app: &TestApp, cookie: &str, server_id: &str, new_name: &str) -> String {
    let geral_id = geral_channel_id(app, cookie, server_id).await;
    let (status, renamed, _) = app
        .request(
            "PATCH",
            &format!("/api/channels/{geral_id}"),
            Some(json!({ "name": new_name })),
            Some(cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{renamed}");
    geral_id
}

#[tokio::test]
async fn accept_invite_announces_in_geral() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let geral_id = geral_channel_id(&app, &cookie, &server_id).await;

    let (status, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{inv}");
    let code = inv["code"].as_str().unwrap();

    let (status, body, bob_cookie) = app.register("bob", "password1", Some(code)).await;
    assert_eq!(status, StatusCode::CREATED, "{body}");
    let bob_cookie = must_cookie(bob_cookie);

    let (status, msgs, _) = app
        .request(
            "GET",
            &format!("/api/channels/{geral_id}/messages"),
            None,
            Some(&bob_cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{msgs}");
    let system = msgs
        .as_array()
        .unwrap()
        .iter()
        .find(|m| m["kind"] == "system")
        .expect("system welcome");
    assert_eq!(
        system["content_plaintext"],
        "Usuário bob acabou de entrar no canal"
    );
    assert!(system.get("content_ciphertext").is_none() || system["content_ciphertext"] == "");
    assert!(system.get("sender_account_id").is_none() || system["sender_account_id"].is_null());
}

#[tokio::test]
async fn create_invite_requires_welcome_channel_without_geral() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    rename_geral(&app, &cookie, &server_id, "sala").await;

    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
}

#[tokio::test]
async fn per_invite_welcome_channel_used_when_no_geral() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let renamed_id = rename_geral(&app, &cookie, &server_id, "sala").await;

    let (status, ch_a, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "chegadas", "type": "text" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{ch_a}");
    let a_id = ch_a["id"].as_str().unwrap().to_string();

    let (status, ch_b, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "lobby", "type": "text" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{ch_b}");
    let b_id = ch_b["id"].as_str().unwrap().to_string();

    let (status, inv_a, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "welcome_channel_id": a_id })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{inv_a}");
    assert_eq!(inv_a["welcome_channel_id"], a_id);

    let (status, inv_b, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "welcome_channel_id": b_id })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{inv_b}");

    let code_a = inv_a["code"].as_str().unwrap();
    let code_b = inv_b["code"].as_str().unwrap();

    let (status, _, bob_cookie) = app.register("bob", "password1", Some(code_a)).await;
    assert_eq!(status, StatusCode::CREATED);
    let bob_cookie = must_cookie(bob_cookie);

    let (status, _, carol_cookie) = app.register("carol", "password1", Some(code_b)).await;
    assert_eq!(status, StatusCode::CREATED);
    let carol_cookie = must_cookie(carol_cookie);

    let (status, msgs_a, _) = app
        .request(
            "GET",
            &format!("/api/channels/{a_id}/messages"),
            None,
            Some(&bob_cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{msgs_a}");
    assert!(msgs_a
        .as_array()
        .unwrap()
        .iter()
        .any(|m| m["kind"] == "system" && m["content_plaintext"].as_str().unwrap().contains("bob")));

    let (status, msgs_b, _) = app
        .request(
            "GET",
            &format!("/api/channels/{b_id}/messages"),
            None,
            Some(&carol_cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{msgs_b}");
    assert!(msgs_b.as_array().unwrap().iter().any(|m| {
        m["kind"] == "system" && m["content_plaintext"].as_str().unwrap().contains("carol")
    }));

    // Renamed former geral should not get the announce.
    let (status, msgs_sala, _) = app
        .request(
            "GET",
            &format!("/api/channels/{renamed_id}/messages"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{msgs_sala}");
    assert!(!msgs_sala
        .as_array()
        .unwrap()
        .iter()
        .any(|m| m["kind"] == "system"));
}

#[tokio::test]
async fn owner_welcome_template_and_non_owner_forbidden() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let geral_id = geral_channel_id(&app, &cookie, &server_id).await;

    let (status, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{inv}");
    let code = inv["code"].as_str().unwrap();
    let (status, _, bob_cookie) = app.register("bob", "password1", Some(code)).await;
    assert_eq!(status, StatusCode::CREATED);
    let bob_cookie = must_cookie(bob_cookie);

    let (status, denied, _) = app
        .request(
            "PATCH",
            &format!("/api/servers/{server_id}/welcome"),
            Some(json!({ "welcome_message_template": "Olá {nome}!" })),
            Some(&bob_cookie),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN, "{denied}");

    let (status, patched, _) = app
        .request(
            "PATCH",
            &format!("/api/servers/{server_id}/welcome"),
            Some(json!({ "welcome_message_template": "Bem-vindo {nome} à mesa" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{patched}");
    assert_eq!(patched["welcome_message_template"], "Bem-vindo {nome} à mesa");

    let (status, inv2, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{inv2}");
    let code2 = inv2["code"].as_str().unwrap();
    let (status, _, carol_cookie) = app.register("carol", "password1", Some(code2)).await;
    assert_eq!(status, StatusCode::CREATED);
    let carol_cookie = must_cookie(carol_cookie);

    let (status, msgs, _) = app
        .request(
            "GET",
            &format!("/api/channels/{geral_id}/messages"),
            None,
            Some(&carol_cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{msgs}");
    assert!(msgs.as_array().unwrap().iter().any(|m| {
        m["kind"] == "system" && m["content_plaintext"] == "Bem-vindo carol à mesa"
    }));
}

#[tokio::test]
async fn owner_welcome_channel_overrides_geral() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let geral_id = geral_channel_id(&app, &cookie, &server_id).await;

    let (status, avisos, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "avisos", "type": "text" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{avisos}");
    let avisos_id = avisos["id"].as_str().unwrap().to_string();

    let (status, patched, _) = app
        .request(
            "PATCH",
            &format!("/api/servers/{server_id}/welcome"),
            Some(json!({ "welcome_channel_id": avisos_id })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{patched}");
    assert_eq!(patched["welcome_channel_id"], avisos_id);

    let (status, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CREATED, "{inv}");
    let code = inv["code"].as_str().unwrap();
    let (status, _, bob_cookie) = app.register("bob", "password1", Some(code)).await;
    assert_eq!(status, StatusCode::CREATED);
    let bob_cookie = must_cookie(bob_cookie);

    let (status, msgs_avisos, _) = app
        .request(
            "GET",
            &format!("/api/channels/{avisos_id}/messages"),
            None,
            Some(&bob_cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{msgs_avisos}");
    assert!(msgs_avisos
        .as_array()
        .unwrap()
        .iter()
        .any(|m| m["kind"] == "system" && m["content_plaintext"].as_str().unwrap().contains("bob")));

    let (status, msgs_geral, _) = app
        .request(
            "GET",
            &format!("/api/channels/{geral_id}/messages"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{msgs_geral}");
    assert!(!msgs_geral
        .as_array()
        .unwrap()
        .iter()
        .any(|m| m["kind"] == "system"));
}

#[tokio::test]
async fn template_without_nome_rejected() {
    let app = TestApp::new().await;
    let (cookie, server_id) = owner_and_server(&app).await;
    let (status, body, _) = app
        .request(
            "PATCH",
            &format!("/api/servers/{server_id}/welcome"),
            Some(json!({ "welcome_message_template": "sem placeholder" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
}
