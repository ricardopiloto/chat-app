use crate::api::auth::session::hash_token;
use std::future::Future;
use std::path::PathBuf;
use std::pin::Pin;

pub struct EmailMessage {
    pub to: String,
    pub canonical: String,
    pub purpose: &'static str,
    pub subject: String,
    pub html: String,
    pub text: String,
}

pub trait EmailSender: Send + Sync {
    fn send<'a>(&'a self, message: EmailMessage) -> Pin<Box<dyn Future<Output = ()> + Send + 'a>>;
}

#[derive(Clone)]
pub struct LogSender {
    pub file: Option<PathBuf>,
}

impl EmailSender for LogSender {
    fn send<'a>(&'a self, message: EmailMessage) -> Pin<Box<dyn Future<Output = ()> + Send + 'a>> {
        Box::pin(async move {
            let prefix = &hash_token(&message.canonical)[..8];
            tracing::info!(
                purpose = message.purpose,
                email_hash = prefix,
                provider = "log",
                "email queued"
            );
            if let Some(path) = &self.file {
                let diagnostics = format!(
                    "purpose={} provider=log status=stored email_hash={}\n",
                    message.purpose, prefix
                );
                if let Err(err) = tokio::fs::write(path, diagnostics).await {
                    tracing::warn!(error = %err, "email diagnostic file write failed");
                }
                let content = format!(
                    "To: {}\nPurpose: {}\nSubject: {}\n{}\n{}\n\n",
                    message.to, message.purpose, message.subject, message.text, message.html
                );
                if let Err(err) = tokio::fs::write(path.with_extension("eml"), content).await {
                    tracing::warn!(error = %err, "development email delivery file write failed");
                }
            }
        })
    }
}

pub struct ResendSender {
    pub client: reqwest::Client,
    pub base_url: String,
    pub api_key: crate::config::Secret,
    pub from: String,
}

impl ResendSender {
    pub fn new(api_key: crate::config::Secret, from: String, base_url: String) -> Self {
        Self {
            client: reqwest::Client::builder()
                .timeout(std::time::Duration::from_secs(5))
                .build()
                .expect("reqwest client"),
            api_key,
            from,
            base_url,
        }
    }
}

impl EmailSender for ResendSender {
    fn send<'a>(&'a self, message: EmailMessage) -> Pin<Box<dyn Future<Output = ()> + Send + 'a>> {
        Box::pin(async move {
            let prefix = &hash_token(&message.canonical)[..8];
            let result = self.client.post(format!("{}/emails", self.base_url.trim_end_matches('/')))
                .bearer_auth(self.api_key.expose())
                .json(&serde_json::json!({"from": self.from, "to": [message.to], "subject": message.subject, "html": message.html, "text": message.text}))
                .send().await;
            match result {
                Ok(response) => {
                    let status = response.status();
                    let id = if status.is_success() {
                        response
                            .json::<serde_json::Value>()
                            .await
                            .ok()
                            .and_then(|v| v["id"].as_str().map(str::to_owned))
                    } else {
                        None
                    };
                    tracing::info!(purpose = message.purpose, email_hash = prefix, status = %status, provider_id = id.as_deref().unwrap_or("none"), "email delivery result");
                }
                Err(err) => {
                    tracing::warn!(purpose = message.purpose, email_hash = prefix, error = %err, "email delivery failed")
                }
            }
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::io::Write;
    use std::sync::{Arc, Mutex};
    use tracing_subscriber::fmt::MakeWriter;

    #[derive(Clone)]
    struct Capture(Arc<Mutex<Vec<u8>>>);
    struct Writer(Arc<Mutex<Vec<u8>>>);
    impl Write for Writer {
        fn write(&mut self, bytes: &[u8]) -> std::io::Result<usize> {
            self.0.lock().unwrap().extend_from_slice(bytes);
            Ok(bytes.len())
        }
        fn flush(&mut self) -> std::io::Result<()> {
            Ok(())
        }
    }
    impl<'a> MakeWriter<'a> for Capture {
        type Writer = Writer;
        fn make_writer(&'a self) -> Self::Writer {
            Writer(self.0.clone())
        }
    }
    fn message() -> EmailMessage {
        EmailMessage {
            to: "secret@example.org".into(),
            canonical: "secret@example.org".into(),
            purpose: "verify",
            subject: "Verify".into(),
            html: "<p>secret-token</p>".into(),
            text: "secret-token".into(),
        }
    }

    async fn fake(status: u16, pause: bool) -> Option<String> {
        let listener = match tokio::net::TcpListener::bind("127.0.0.1:0").await {
            Ok(listener) => listener,
            Err(error) if error.kind() == std::io::ErrorKind::PermissionDenied => {
                eprintln!("provider HTTP test skipped: {error}");
                return None;
            }
            Err(error) => panic!("fake provider bind: {error}"),
        };
        let address = listener.local_addr().unwrap();
        tokio::spawn(async move {
            let (mut stream, _) = listener.accept().await.unwrap();
            use tokio::io::{AsyncReadExt, AsyncWriteExt};
            let mut bytes = [0u8; 4096];
            let _ = stream.read(&mut bytes).await;
            if pause {
                tokio::time::sleep(std::time::Duration::from_millis(100)).await;
            }
            let body = "{\"id\":\"test-id\"}";
            let response = format!("HTTP/1.1 {status} Test\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n{body}", body.len());
            let _ = stream.write_all(response.as_bytes()).await;
        });
        Some(format!("http://{address}"))
    }

    #[tokio::test(flavor = "current_thread")]
    async fn provider_success_error_and_timeout_do_not_leak_details() {
        let capture = Capture(Arc::new(Mutex::new(Vec::new())));
        let subscriber = tracing_subscriber::fmt()
            .with_writer(capture.clone())
            .without_time()
            .finish();
        let _guard = tracing::subscriber::set_default(subscriber);
        for status in [200, 400, 500] {
            let Some(base_url) = fake(status, false).await else {
                return;
            };
            let sender = ResendSender::new(
                crate::config::Secret::new("api-key"),
                "sender@example.org".into(),
                base_url,
            );
            sender.send(message()).await;
        }
        let Some(base_url) = fake(200, true).await else {
            return;
        };
        let mut sender = ResendSender::new(
            crate::config::Secret::new("api-key"),
            "sender@example.org".into(),
            base_url,
        );
        sender.client = reqwest::Client::builder()
            .timeout(std::time::Duration::from_millis(10))
            .build()
            .unwrap();
        sender.send(message()).await;
        let logs = String::from_utf8(capture.0.lock().unwrap().clone()).unwrap();
        assert!(
            logs.contains("verify")
                && logs.contains("200")
                && logs.contains("400")
                && logs.contains("500")
                && logs.contains("test-id")
        );
        assert!(logs.contains("email delivery failed"));
        for secret in ["secret@example.org", "secret-token", "api-key"] {
            assert!(!logs.contains(secret));
        }
    }

    #[tokio::test(flavor = "current_thread")]
    async fn log_sender_diagnostics_hide_recipient_and_token() {
        let capture = Capture(Arc::new(Mutex::new(Vec::new())));
        let subscriber = tracing_subscriber::fmt()
            .with_writer(capture.clone())
            .without_time()
            .finish();
        let _guard = tracing::subscriber::set_default(subscriber);
        LogSender { file: None }.send(message()).await;
        let logs = String::from_utf8(capture.0.lock().unwrap().clone()).unwrap();
        assert!(logs.contains("verify") && logs.contains("email_hash"));
        assert!(!logs.contains("secret@example.org"));
        assert!(!logs.contains("secret-token"));
    }
}
