use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

const SEALED: &str = "c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I=";

fn voice_body(name: &str) -> serde_json::Value {
    json!({
        "name": name,
        "type": "voice_video",
        "custody_ack": true,
        "channel_key_sealed": SEALED,
    })
}

#[tokio::test]
async fn delete_channel_auth_and_last_of_type_guard() {
    let app = TestApp::new().await;
    let (_, me, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    let owner_id = me["id"].as_str().unwrap();

    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Mesa")),
            Some(&cookie),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();

    let (status, channels, _) = app
        .request(
            "GET",
            &format!("/api/servers/{server_id}/channels"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    let text = channels
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["type"] == "text")
        .unwrap();
    let voice = channels
        .as_array()
        .unwrap()
        .iter()
        .find(|c| c["type"] == "voice_video")
        .unwrap();
    let text_id = text["id"].as_str().unwrap();
    let voice_id = voice["id"].as_str().unwrap();
    assert_eq!(text["created_by_account_id"], owner_id);

    // Extra text — can delete one text, not the last
    let (_, extra, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "a", "type": "text" })),
            Some(&cookie),
        )
        .await;
    let extra_id = extra["id"].as_str().unwrap();

    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{extra_id}"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);

    let (status, err, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{text_id}"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CONFLICT, "{err}");
    assert_eq!(err["error"], "last_channel_of_type");

    let (status, err, _) = app
        .request(
            "DELETE",
            &format!("/api/channels/{voice_id}"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::CONFLICT, "{err}");
    assert_eq!(err["error"], "last_channel_of_type");
}

#[tokio::test]
async fn delete_server_owner_only() {
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
    let server_id = server["id"].as_str().unwrap().to_string();

    let (_, invite, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({ "include_history": false })),
            Some(&cookie),
        )
        .await;
    let code = invite["code"].as_str().unwrap();

    let (_, _, bob_cookie) = app.register("bob", "password1", Some(code)).await;
    let bob_cookie = must_cookie(bob_cookie);

    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/servers/{server_id}"),
            None,
            Some(&bob_cookie),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);

    let (status, _, _) = app
        .request(
            "DELETE",
            &format!("/api/servers/{server_id}"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::NO_CONTENT);
}

#[tokio::test]
async fn e2ee_and_egress_require_channel_key() {
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
            Some(voice_body("mesa-extra")),
            Some(&cookie),
        )
        .await;
    let channel_id = ch["id"].as_str().unwrap().to_string();
    assert_eq!(ch["has_channel_key"], true);

    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/voice/e2ee"),
            Some(json!({ "enabled": false, "intent": "record" })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body["e2ee_enabled"], false);

    let (status, body, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/voice/e2ee"),
            Some(json!({ "enabled": true })),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{body}");

    let (status, err, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/egress/start"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE, "{err}");
    assert_eq!(err["error"], "egress_unavailable");

    let (status, ch2, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}"),
            None,
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(ch2["e2ee_enabled"], true);

    sqlx::query("DELETE FROM channel_key WHERE channel_id = ?")
        .bind(&channel_id)
        .execute(&app.pool)
        .await
        .unwrap();

    let (status, _, _) = app
        .request(
            "POST",
            &format!("/api/channels/{channel_id}/egress/start"),
            Some(json!({})),
            Some(&cookie),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
}
