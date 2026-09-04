use axum::body::Body;
use axum::http::{Request, StatusCode};
use axum::Router;
use chat_backend::config::Config;
use chat_backend::{build_state, router};
use http_body_util::BodyExt;
use serde_json::{json, Value};
use tempfile::TempDir;
use tower::ServiceExt;

pub const PUBKEY: &str = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
pub const CHANNEL_KEY_SEALED: &str = "c2VhbGVkLWNoYW5uZWwta2V5LWJsb2I=";

pub fn create_server_body(name: &str) -> Value {
    json!({
        "name": name,
        "custody_ack": true,
        "channel_key_sealed": CHANNEL_KEY_SEALED,
    })
}

pub struct TestApp {
    pub router: Router,
    pub pool: sqlx::SqlitePool,
    _dir: TempDir,
}

impl TestApp {
    pub async fn new() -> Self {
        let dir = TempDir::new().expect("tempdir");
        let db_path = dir.path().join("test.db");
        let mut config = Config::from_env();
        config.database_url = format!("sqlite://{}?mode=rwc", db_path.display());
        config.cookie_secure = false;
        config.attachments_dir = dir.path().join("attachments");
        let state = build_state(config).await.expect("state");
        let pool = state.pool.clone();
        Self {
            router: router(state),
            pool,
            _dir: dir,
        }
    }

    pub async fn request(
        &self,
        method: &str,
        path: &str,
        body: Option<Value>,
        cookie: Option<&str>,
    ) -> (StatusCode, Value, Option<String>) {
        let mut builder = Request::builder().method(method).uri(path);
        if let Some(c) = cookie {
            builder = builder.header("cookie", c);
        }
        let req = if let Some(json) = body {
            builder
                .header("content-type", "application/json")
                .body(Body::from(json.to_string()))
                .unwrap()
        } else {
            builder.body(Body::empty()).unwrap()
        };
        let response = self.router.clone().oneshot(req).await.unwrap();
        let status = response.status();
        let set_cookie = response
            .headers()
            .get_all("set-cookie")
            .iter()
            .filter_map(|v| v.to_str().ok())
            .find(|s| s.starts_with("Session="))
            .and_then(|s| s.split(';').next())
            .map(str::to_string);
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        let json = if bytes.is_empty() {
            Value::Null
        } else {
            serde_json::from_slice(&bytes).unwrap_or(Value::String(
                String::from_utf8_lossy(&bytes).into_owned(),
            ))
        };
        (status, json, set_cookie)
    }

    pub async fn request_bytes(
        &self,
        method: &str,
        path: &str,
        body: Vec<u8>,
        extra_headers: &[(&str, &str)],
        cookie: Option<&str>,
    ) -> (StatusCode, Value, Option<String>) {
        let mut builder = Request::builder().method(method).uri(path);
        if let Some(c) = cookie {
            builder = builder.header("cookie", c);
        }
        for (k, v) in extra_headers {
            builder = builder.header(*k, *v);
        }
        let req = builder.body(Body::from(body)).unwrap();
        let response = self.router.clone().oneshot(req).await.unwrap();
        let status = response.status();
        let set_cookie = response
            .headers()
            .get_all("set-cookie")
            .iter()
            .filter_map(|v| v.to_str().ok())
            .find(|s| s.starts_with("Session="))
            .and_then(|s| s.split(';').next())
            .map(str::to_string);
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        let json = if bytes.is_empty() {
            Value::Null
        } else {
            serde_json::from_slice(&bytes).unwrap_or(Value::String(
                String::from_utf8_lossy(&bytes).into_owned(),
            ))
        };
        (status, json, set_cookie)
    }

    pub async fn register(
        &self,
        handle: &str,
        password: &str,
        invite: Option<&str>,
    ) -> (StatusCode, Value, Option<String>) {
        let mut body = json!({
            "handle": handle,
            "password": password,
            "identity_pubkey": PUBKEY,
        });
        if let Some(code) = invite {
            body["invite_code"] = json!(code);
        }
        self.request("POST", "/api/auth/register", Some(body), None)
            .await
    }

    #[allow(dead_code)]
    pub async fn login(&self, handle: &str, password: &str) -> (StatusCode, Value, Option<String>) {
        self.request(
            "POST",
            "/api/auth/login",
            Some(json!({ "handle": handle, "password": password })),
            None,
        )
        .await
    }
}

pub fn must_cookie(cookie: Option<String>) -> String {
    cookie.expect("session cookie")
}
