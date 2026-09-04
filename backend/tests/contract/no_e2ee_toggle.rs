use crate::common::{must_cookie, TestApp};
use axum::http::StatusCode;

#[tokio::test]
async fn no_disable_e2ee_route() {
    let app = TestApp::new().await;
    let (_, _, cookie) = app.register("alice", "password1", None).await;
    let cookie = must_cookie(cookie);
    for path in [
        "/api/e2ee/disable",
        "/api/servers/disable-e2ee",
        "/api/channels/disable-e2ee",
    ] {
        let (status, _, _) = app.request("POST", path, None, Some(&cookie)).await;
        assert!(
            status == StatusCode::NOT_FOUND || status == StatusCode::METHOD_NOT_ALLOWED,
            "{path} -> {status}"
        );
    }
}
