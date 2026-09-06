use crate::common::TestApp;
use axum::http::StatusCode;
use chat_backend::security_headers::CONTENT_SECURITY_POLICY;

#[tokio::test]
async fn health_includes_frame_deny_and_csp() {
    let app = TestApp::new().await;
    let (status, _, _, headers) = app
        .request_full("GET", "/health", None, None, &[])
        .await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(headers.get("x-frame-options").unwrap(), "DENY");
    assert_eq!(headers.get("x-content-type-options").unwrap(), "nosniff");
    assert_eq!(headers.get("referrer-policy").unwrap(), "no-referrer");
    let csp = headers.get("content-security-policy").unwrap();
    assert_eq!(csp, CONTENT_SECURITY_POLICY);
    assert!(csp.to_str().unwrap().contains("frame-ancestors 'none'"));
    assert!(headers.get("strict-transport-security").is_none());
}
