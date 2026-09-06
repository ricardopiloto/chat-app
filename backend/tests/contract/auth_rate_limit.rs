use crate::common::TestApp;
use axum::http::StatusCode;

#[tokio::test]
async fn login_rate_limit_returns_429() {
    let app = TestApp::with_config(|c| {
        c.rate_limit_disabled = false;
    })
    .await;
    for i in 0..10 {
        let (status, body, _) = app.login("nobody", "password1").await;
        assert_eq!(status, StatusCode::UNAUTHORIZED, "i={i} {body}");
        assert_eq!(body["error"], "invalid credentials");
    }
    let (status, body, _) = app.login("nobody", "password1").await;
    assert_eq!(status, StatusCode::TOO_MANY_REQUESTS, "{body}");
    assert_eq!(body["error"], "too many requests");
}

#[tokio::test]
async fn login_unknown_and_bad_password_same_message() {
    let app = TestApp::new().await;
    let _ = app.register("alice_rl", "password1", None).await;
    let (s1, b1, _) = app.login("missing_user", "password1").await;
    let (s2, b2, _) = app.login("alice_rl", "wrongpass").await;
    assert_eq!(s1, StatusCode::UNAUTHORIZED);
    assert_eq!(s2, StatusCode::UNAUTHORIZED);
    assert_eq!(b1["error"], "invalid credentials");
    assert_eq!(b2["error"], "invalid credentials");
}

#[tokio::test]
async fn first_operator_at_most_one() {
    let app = TestApp::new().await;
    let a = app.register("op_a", "password1", None);
    let b = app.register("op_b", "password1", None);
    let (ra, rb) = tokio::join!(a, b);
    let (n,): (i64,) = sqlx::query_as("SELECT COUNT(*) FROM account WHERE is_initial_operator = 1")
        .fetch_one(&app.pool)
        .await
        .unwrap();
    assert_eq!(n, 1, "ra={:?} rb={:?}", ra.0, rb.0);
    let created = [ra.0, rb.0]
        .into_iter()
        .filter(|s| *s == StatusCode::CREATED)
        .count();
    assert!(created >= 1);
}

#[tokio::test]
async fn default_testapp_does_not_rate_limit() {
    let app = TestApp::new().await;
    for _ in 0..12 {
        let (status, _, _) = app.login("nobody", "password1").await;
        assert_eq!(status, StatusCode::UNAUTHORIZED);
    }
}
