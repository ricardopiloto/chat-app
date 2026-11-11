use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::{json, Value};

fn default_appearance() -> Value {
    json!({"color":{"mode":"preset","preset":"white"},"material":"glass","texture":"","sound":false})
}

#[tokio::test]
async fn appearance_round_trip_isolation_validation_and_roll_snapshot() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("appearanceowner", "password1", None).await;
    let cookie = must_cookie(cookie);
    let (_, server, _) = app.request("POST", "/api/servers", Some(crate::common::create_server_body("Mesa")), Some(&cookie)).await;
    let server_id = server["id"].as_str().unwrap();
    let (_, dice, _) = app.request("POST", &format!("/api/servers/{server_id}/channels"), Some(json!({"name":"dados","type":"dice"})), Some(&cookie)).await;
    let dice_id = dice["id"].as_str().unwrap();
    let (_, text, _) = app.request("POST", &format!("/api/servers/{server_id}/channels"), Some(json!({"name":"texto","type":"text"})), Some(&cookie)).await;
    let text_id = text["id"].as_str().unwrap();
    let url = format!("/api/channels/{dice_id}/dice-appearance/me");
    let (status, body, _) = app.request("GET", &url, None, Some(&cookie)).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body, default_appearance());
    let custom = json!({"color":{"mode":"custom","foreground":"#123456","background":"#aBcDeF"},"material":"metal","texture":"marble","sound":true});
    let (status, body, _) = app.request("PUT", &url, Some(custom.clone()), Some(&cookie)).await;
    assert_eq!(status, StatusCode::OK, "{body}");
    assert_eq!(body, custom);
    let (_, body, _) = app.request("GET", &url, None, Some(&cookie)).await;
    assert_eq!(body, custom);
    for invalid in [
        json!({"color":{"mode":"preset","preset":"unknown"},"material":"metal","texture":"","sound":false}),
        json!({"color":{"mode":"custom","foreground":"red","background":"#ffffff"},"material":"metal","texture":"","sound":false}),
        json!({"color":{"mode":"preset","preset":"white"},"material":"rubber","texture":"","sound":false}),
        json!({"color":{"mode":"preset","preset":"white"},"material":"metal","texture":"unknown","sound":false}),
        json!({"color":{"mode":"preset","preset":"white"},"material":"metal","texture":"","sound":"yes"}),
    ] {
        let (status, _, _) = app.request("PUT", &url, Some(invalid), Some(&cookie)).await;
        assert!(status.is_client_error());
    }
    let (_, body, _) = app.request("GET", &url, None, Some(&cookie)).await;
    assert_eq!(body, custom);
    let (_, body, _) = app.request("GET", &format!("/api/channels/{text_id}/dice-appearance/me"), None, Some(&cookie)).await;
    assert_eq!(body, default_appearance());
    let (_, default_roll, _) = app.request("POST", &format!("/api/channels/{text_id}/dice"), Some(json!({"notation":"1d6"})), Some(&cookie)).await;
    let default_payload: Value = serde_json::from_str(default_roll["content_plaintext"].as_str().unwrap()).unwrap();
    assert_eq!(default_payload["appearance"], default_appearance());
    let text_appearance = json!({"color":{"mode":"preset","preset":"black"},"material":"wood","texture":"wood","sound":false});
    let (status, _, _) = app.request("PUT", &format!("/api/channels/{text_id}/dice-appearance/me"), Some(text_appearance.clone()), Some(&cookie)).await;
    assert_eq!(status, StatusCode::OK);
    let (_, roll, _) = app.request("POST", &format!("/api/channels/{dice_id}/dice"), Some(json!({"notation":"1d6"})), Some(&cookie)).await;
    let payload: Value = serde_json::from_str(roll["content_plaintext"].as_str().unwrap()).unwrap();
    assert_eq!(payload["appearance"], custom);
    let (_, roll, _) = app.request("POST", &format!("/api/channels/{text_id}/dice"), Some(json!({"notation":"1d6"})), Some(&cookie)).await;
    let payload: Value = serde_json::from_str(roll["content_plaintext"].as_str().unwrap()).unwrap();
    assert_eq!(payload["appearance"], text_appearance);
    let (status, _, _) = app.request("GET", &url, None, None).await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
    let (_, other_server, _) = app.request("POST", "/api/servers", Some(crate::common::create_server_body("Outro")), Some(&cookie)).await;
    let other_server_id = other_server["id"].as_str().unwrap();
    let (_, inv, _) = app.request("POST", &format!("/api/servers/{other_server_id}/invites"), Some(json!({})), Some(&cookie)).await;
    let (_, _, stranger) = app.register("appearancestranger", "password1", Some(inv["code"].as_str().unwrap())).await;
    let stranger = must_cookie(stranger);
    let (status, _, _) = app.request("GET", &url, None, Some(&stranger)).await;
    assert!(status == StatusCode::FORBIDDEN || status == StatusCode::NOT_FOUND);
}
