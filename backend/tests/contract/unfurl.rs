use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;
use serde_json::json;

#[tokio::test]
async fn unfurl_rejects_link_local_metadata() {
    let app = TestApp::new().await;
    let (_, _, alice) = app.register("alice_unfurl3", "password1", None).await;
    let alice = must_cookie(alice);
    let (status, body, _) = app
        .request(
            "POST",
            "/api/unfurl",
            Some(json!({ "url": "http://169.254.169.254/" })),
            Some(&alice),
        )
        .await;
    assert_eq!(status, StatusCode::BAD_REQUEST, "{body}");
}

#[tokio::test]
async fn content_length_cap_helper() {
    use chat_backend::api::unfurl::{content_length_exceeds_unfurl_cap, MAX_UNFURL_BODY};
    use reqwest::header::{HeaderMap, HeaderValue, CONTENT_LENGTH};
    let mut h = HeaderMap::new();
    h.insert(
        CONTENT_LENGTH,
        HeaderValue::from_str(&(MAX_UNFURL_BODY as u64 + 1).to_string()).unwrap(),
    );
    assert!(content_length_exceeds_unfurl_cap(&h));
}
