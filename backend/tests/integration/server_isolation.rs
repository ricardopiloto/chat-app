use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

#[tokio::test]
async fn servers_do_not_leak_across_membership() {
    let app = TestApp::new().await;
    let (_, _, a) = app.register("alice", "password1", None).await;
    let a = must_cookie(a);
    let (_, s1, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Alpha")),
            Some(&a),
        )
        .await;
    let s1 = s1["id"].as_str().unwrap().to_string();
    let (_, ch1, _) = app
        .request(
            "POST",
            &format!("/api/servers/{s1}/channels"),
            Some(json!({ "name": "geral", "type": "text" })),
            Some(&a),
        )
        .await;
    let ch1 = ch1["id"].as_str().unwrap().to_string();
    app.request(
        "POST",
        &format!("/api/channels/{ch1}/messages"),
        Some(json!({ "content_ciphertext": "YQ==" })),
        Some(&a),
    )
    .await;
    let (_, inv, _) = app
        .request(
            "POST",
            &format!("/api/servers/{s1}/invites"),
            Some(json!({})),
            Some(&a),
        )
        .await;
    let code_a = inv["code"].as_str().unwrap().to_string();

    let (_, _, b) = app.register("bob", "password1", Some(&code_a)).await;
    let b = must_cookie(b);

    let (_, _, c) = app.register("cara", "password1", None).await;
    // cara cannot open-register; use a second server owned by bob
    let _ = c;
    let (_, s2, _) = app
        .request(
            "POST",
            "/api/servers",
            Some(crate::common::create_server_body("Beta")),
            Some(&b),
        )
        .await;
    let s2 = s2["id"].as_str().unwrap().to_string();
    let (_, inv2, _) = app
        .request(
            "POST",
            &format!("/api/servers/{s2}/invites"),
            Some(json!({})),
            Some(&b),
        )
        .await;
    let code_b = inv2["code"].as_str().unwrap();
    let (status, _, cara) = app.register("cara", "password1", Some(code_b)).await;
    assert_eq!(status, StatusCode::CREATED);
    let cara = must_cookie(cara);

    let (status, list, _) = app.request("GET", "/api/servers", None, Some(&cara)).await;
    assert_eq!(status, StatusCode::OK);
    let names: Vec<&str> = list
        .as_array()
        .unwrap()
        .iter()
        .map(|s| s["name"].as_str().unwrap())
        .collect();
    assert_eq!(names, vec!["Beta"]);

    let (status, _, _) = app
        .request(
            "GET",
            &format!("/api/servers/{s1}/channels"),
            None,
            Some(&cara),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);

    let (status, _, _) = app
        .request(
            "GET",
            &format!("/api/channels/{ch1}/messages"),
            None,
            Some(&cara),
        )
        .await;
    assert_eq!(status, StatusCode::FORBIDDEN);
}
