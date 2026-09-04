use crate::api::auth::session::AuthUser;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::State;
use axum::Json;
use serde::{Deserialize, Serialize};
use std::net::IpAddr;
use std::time::Duration;
use url::Url;

#[derive(Debug, Deserialize)]
pub struct UnfurlBody {
    pub url: String,
}

#[derive(Debug, Serialize)]
pub struct UnfurlResult {
    pub url: String,
    pub kind: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub site_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

pub async fn unfurl(
    State(_state): State<AppState>,
    AuthUser(_account): AuthUser,
    Json(body): Json<UnfurlBody>,
) -> Result<Json<UnfurlResult>, ApiError> {
    let raw = body.url.trim();
    if raw.is_empty() || raw.len() > 2048 {
        return Err(ApiError::bad_request("url required (max 2048 chars)"));
    }
    let parsed = Url::parse(raw).map_err(|_| ApiError::bad_request("invalid url"))?;
    if parsed.scheme() != "http" && parsed.scheme() != "https" {
        return Err(ApiError::bad_request("only http(s) urls allowed"));
    }
    if let Err(msg) = validate_public_url(&parsed) {
        return Err(ApiError::bad_request(msg));
    }

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .redirect(reqwest::redirect::Policy::limited(3))
        .user_agent("Mesa-Unfurl/0.1 (+self-hosted)")
        .build()
        .map_err(|_| ApiError::internal("unfurl client"))?;

    let response = match client.get(parsed.clone()).send().await {
        Ok(r) => r,
        Err(_) => {
            return Ok(Json(UnfurlResult {
                url: raw.to_string(),
                kind: "link".into(),
                title: None,
                description: None,
                image_url: None,
                site_name: parsed.host_str().map(str::to_string),
                error: Some("unfurl_failed".into()),
            }));
        }
    };

    // Re-check final URL after redirects
    if let Err(msg) = validate_public_url(response.url()) {
        return Err(ApiError::bad_request(msg));
    }

    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_ascii_lowercase();

    if content_type.starts_with("image/") {
        return Ok(Json(UnfurlResult {
            url: raw.to_string(),
            kind: "image".into(),
            title: None,
            description: None,
            image_url: Some(response.url().to_string()),
            site_name: response.url().host_str().map(str::to_string),
            error: None,
        }));
    }

    let bytes = match response.bytes().await {
        Ok(b) => b,
        Err(_) => {
            return Ok(Json(UnfurlResult {
                url: raw.to_string(),
                kind: "link".into(),
                title: None,
                description: None,
                image_url: None,
                site_name: parsed.host_str().map(str::to_string),
                error: Some("unfurl_failed".into()),
            }));
        }
    };
    // Cap HTML parse size
    let slice = if bytes.len() > 512_000 {
        &bytes[..512_000]
    } else {
        &bytes
    };
    let html = String::from_utf8_lossy(slice);
    let title = meta_content(&html, "og:title")
        .or_else(|| meta_content(&html, "twitter:title"))
        .or_else(|| html_title(&html));
    let description =
        meta_content(&html, "og:description").or_else(|| meta_content(&html, "twitter:description"));
    let image_url =
        meta_content(&html, "og:image").or_else(|| meta_content(&html, "twitter:image"));
    let site_name = meta_content(&html, "og:site_name")
        .or_else(|| parsed.host_str().map(str::to_string));
    let og_type = meta_content(&html, "og:type").unwrap_or_default();
    let kind = if og_type.contains("video") {
        "video"
    } else {
        "link"
    };

    Ok(Json(UnfurlResult {
        url: raw.to_string(),
        kind: kind.into(),
        title,
        description,
        image_url,
        site_name,
        error: None,
    }))
}

fn validate_public_url(url: &Url) -> Result<(), &'static str> {
    let host = url.host_str().ok_or("url host required")?;
    if host.eq_ignore_ascii_case("localhost") || host.ends_with(".localhost") {
        return Err("private or local urls blocked");
    }
    // Literal IP in host
    if let Ok(ip) = host.parse::<IpAddr>() {
        if is_blocked_ip(ip) {
            return Err("private or local urls blocked");
        }
        return Ok(());
    }
    // Best-effort: resolve synchronously via to_socket_addrs is blocking — skip in async
    // path for MVP; block obvious metadata hostnames.
    let lower = host.to_ascii_lowercase();
    if lower == "metadata.google.internal"
        || lower.ends_with(".internal")
        || lower == "metadata"
    {
        return Err("private or local urls blocked");
    }
    Ok(())
}

fn is_blocked_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => {
            v4.is_loopback()
                || v4.is_private()
                || v4.is_link_local()
                || v4.is_broadcast()
                || v4.is_unspecified()
                || v4.octets()[0] == 169 && v4.octets()[1] == 254
        }
        IpAddr::V6(v6) => v6.is_loopback() || v6.is_unique_local() || v6.is_unspecified(),
    }
}

fn meta_content(html: &str, property: &str) -> Option<String> {
    // Very small OG parser: property="…" content="…" or name=
    let patterns = [
        format!("property=\"{property}\""),
        format!("property='{property}'"),
        format!("name=\"{property}\""),
        format!("name='{property}'"),
    ];
    for pat in patterns {
        if let Some(idx) = html.to_ascii_lowercase().find(&pat.to_ascii_lowercase()) {
            let window = &html[idx..html.len().min(idx + 400)];
            if let Some(c) = attr_after(window, "content") {
                return Some(c);
            }
        }
    }
    None
}

fn attr_after(window: &str, attr: &str) -> Option<String> {
    let lower = window.to_ascii_lowercase();
    let key = format!("{attr}=");
    let pos = lower.find(&key)?;
    let rest = &window[pos + key.len()..];
    let quote = rest.chars().next()?;
    if quote != '"' && quote != '\'' {
        return None;
    }
    let end = rest[1..].find(quote)?;
    Some(rest[1..1 + end].trim().to_string())
}

fn html_title(html: &str) -> Option<String> {
    let lower = html.to_ascii_lowercase();
    let start = lower.find("<title")?;
    let after = &html[start..];
    let gt = after.find('>')?;
    let rest = &after[gt + 1..];
    let end = rest.to_ascii_lowercase().find("</title>")?;
    let title = rest[..end].trim();
    if title.is_empty() {
        None
    } else {
        Some(title.to_string())
    }
}

#[allow(dead_code)]
fn _unused() {}
