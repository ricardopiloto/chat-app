use crate::common::TestApp;
use axum::body::Body;
use axum::extract::ConnectInfo;
use axum::http::{Request, StatusCode};
use serde_json::json;
use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use tower::ServiceExt;

#[tokio::test]
async fn status_tracks_first_account_without_changing_health() {
    let app = TestApp::new().await;
    let (status, body, _) = app.request("GET", "/api/instance/status", None, None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body, json!({ "initial_setup": true }));

    let (status, _, _) = app.register("first", "password1", None).await;
    assert_eq!(status, StatusCode::CREATED);
    let (status, body, _) = app.request("GET", "/api/instance/status", None, None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body, json!({ "initial_setup": false }));

    let (status, body, _) = app.request("GET", "/health", None, None).await;
    assert_eq!(status, StatusCode::OK);
    assert_eq!(body, json!({ "ok": true }));
}

#[tokio::test]
async fn status_has_its_own_rate_limit() {
    let app = TestApp::with_config(|config| config.rate_limit_disabled = false).await;
    let first = IpAddr::V4(Ipv4Addr::new(192, 0, 2, 1));
    let second = IpAddr::V4(Ipv4Addr::new(192, 0, 2, 2));
    for _ in 0..60 {
        let status = request_from_ip(&app, first).await;
        assert_eq!(status, StatusCode::OK);
    }
    assert_eq!(
        request_from_ip(&app, first).await,
        StatusCode::TOO_MANY_REQUESTS
    );
    assert_eq!(request_from_ip(&app, second).await, StatusCode::OK);

    let (status, _, _) = app.login("nobody", "password1").await;
    assert_eq!(status, StatusCode::UNAUTHORIZED);
}

async fn request_from_ip(app: &TestApp, ip: IpAddr) -> StatusCode {
    let mut request = Request::builder()
        .uri("/api/instance/status")
        .body(Body::empty())
        .unwrap();
    request
        .extensions_mut()
        .insert(ConnectInfo(SocketAddr::new(ip, 1234)));
    app.router.clone().oneshot(request).await.unwrap().status()
}
