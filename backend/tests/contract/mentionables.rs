use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

#[tokio::test]
async fn mentionables_lists_others_excludes_self() {
    let app = TestApp::new().await;
    let (_, alice_body, alice) = app.register("men_alice", "password1", None).await;
    let alice = must_cookie(alice);
    let alice_id = alice_body["id"].as_str().unwrap();
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Men")),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "geral", "type": "text" })),
            Some(&alice),
        )
        .await;
    let channel_id = ch["id"].as_str().unwrap();
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&alice),
        )
        .await;
    let (_, bob_body, bob) = app
        .register("men_bob", "password1", Some(inv["code"].as_str().unwrap()))
        .await;
    let bob = must_cookie(bob);
    let bob_id = bob_body["id"].as_str().unwrap();

    let (status, list, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/mentionables"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{list}");
    let arr = list.as_array().unwrap();
    assert_eq!(arr.len(), 1, "{list}");
    assert_eq!(arr[0]["account_id"], bob_id);
    assert_eq!(arr[0]["handle"], "men_bob");
    assert!(arr.iter().all(|m| m["account_id"] != alice_id));

    let (status_bob, list_bob, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/mentionables"),
            None,
            Some(&bob),
        )
        .await;
    assert_eq!(status_bob, StatusCode::OK, "{list_bob}");
    let arr_bob = list_bob.as_array().unwrap();
    assert_eq!(arr_bob.len(), 1);
    assert_eq!(arr_bob[0]["account_id"], alice_id);
}

#[tokio::test]
async fn mentionables_private_excludes_non_viewers() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("priv_alice", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("PrivMen")),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({
                "name": "secreto",
                "type": "text",
                "visibility": "private"
            })),
            Some(&alice),
        )
        .await;
    let channel_id = ch["id"].as_str().unwrap();
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/invites"),
            Some(json!({})),
            Some(&alice),
        )
        .await;
    let (_, bob_body, bob) = app
        .register(
            "priv_bob",
            "password1",
            Some(inv["code"].as_str().unwrap()),
        )
        .await;
    let bob = must_cookie(bob);
    let bob_id = bob_body["id"].as_str().unwrap();

    // Bob is server member but cannot view private channel by default
    let (status, list, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/mentionables"),
            None,
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::OK, "{list}");
    let arr = list.as_array().unwrap();
    assert!(
        arr.iter().all(|m| m["account_id"] != bob_id),
        "bob without view must not appear: {list}"
    );

    // Bob cannot list mentionables without view
    let (status_bob, _, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/mentionables"),
            None,
            Some(&bob),
        )
        .await;
    assert!(
        status_bob == StatusCode::NOT_FOUND || status_bob == StatusCode::FORBIDDEN,
        "{status_bob}"
    );
}

#[tokio::test]
async fn mentionables_requires_auth() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("auth_men", "password1", None).await;
    let alice = must_cookie(alice);
    let (_, server, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("AuthMen")),
            Some(&alice),
        )
        .await;
    let server_id = server["id"].as_str().unwrap();
    let (_, ch, _) = app
        .request(
            "POST",
            &format!("/api/servers/{server_id}/channels"),
            Some(json!({ "name": "geral", "type": "text" })),
            Some(&alice),
        )
        .await;
    let channel_id = ch["id"].as_str().unwrap();
    let (status, _, _) = app
        .request(
            "GET",
            &format!("/api/channels/{channel_id}/mentionables"),
            None,
            None,
        )
        .await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}
