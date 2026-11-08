use crate::api::auth::session::AuthUser;
use crate::error::ApiError;
use crate::AppState;
use axum::extract::State;
use axum::Json;
use serde::{Deserialize, Serialize};
use std::net::{IpAddr, ToSocketAddrs};
use std::time::Duration;
use url::Url;

pub const MAX_UNFURL_BODY: usize = 256 * 1024;
const MAX_REDIRECTS: usize = 3;

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
    pub provider: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub embed_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub media_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
enum Provider {
    YouTube,
    Vimeo,
    Spotify,
    SoundCloud,
    TikTok,
}

impl Provider {
    fn name(self) -> &'static str {
        match self {
            Self::YouTube => "youtube",
            Self::Vimeo => "vimeo",
            Self::Spotify => "spotify",
            Self::SoundCloud => "soundcloud",
            Self::TikTok => "tiktok",
        }
    }
    fn endpoint(self) -> &'static str {
        match self {
            Self::YouTube => "https://www.youtube.com/oembed?format=json",
            Self::Vimeo => "https://vimeo.com/api/oembed.json",
            Self::Spotify => "https://open.spotify.com/oembed",
            Self::SoundCloud => "https://soundcloud.com/oembed?format=json",
            Self::TikTok => "https://www.tiktok.com/oembed",
        }
    }
}

fn provider_for(url: &Url) -> Option<Provider> {
    match url.host_str()? {
        "youtube.com"
        | "www.youtube.com"
        | "m.youtube.com"
        | "youtu.be"
        | "www.youtube-nocookie.com" => Some(Provider::YouTube),
        "vimeo.com" | "www.vimeo.com" | "player.vimeo.com" => Some(Provider::Vimeo),
        "open.spotify.com" => Some(Provider::Spotify),
        "soundcloud.com" | "www.soundcloud.com" | "m.soundcloud.com" => Some(Provider::SoundCloud),
        "tiktok.com" | "www.tiktok.com" | "vm.tiktok.com" | "m.tiktok.com" => {
            Some(Provider::TikTok)
        }
        _ => None,
    }
}

#[derive(Deserialize)]
struct OEmbedBody {
    title: String,
    thumbnail_url: String,
    provider_name: String,
    html: String,
}

fn iframe_embed_url(provider: Provider, html: &str) -> Option<String> {
    let lower = html.to_ascii_lowercase();
    let start = lower.find("<iframe")?;
    let end = html[start..].find('>')? + start;
    let tag = &html[start + "<iframe".len()..end];
    // Require an actual attribute boundary, rather than matching data-src or another name.
    let src = tag.split_ascii_whitespace().find_map(|part| {
        let (name, value) = part.split_once('=')?;
        if name.eq_ignore_ascii_case("src") {
            let quote = value.chars().next()?;
            if quote == '"' || quote == '\'' {
                return value[1..].split(quote).next();
            }
        }
        None
    })?;
    let src = src.replace("&amp;", "&");
    let url = Url::parse(&src).ok()?;
    if url.scheme() != "https"
        || !url.username().is_empty()
        || url.password().is_some()
        || url.port().is_some()
    {
        return None;
    }
    let host = url.host_str()?;
    match provider {
        Provider::YouTube if matches!(host, "www.youtube.com" | "www.youtube-nocookie.com") => {
            let mut parts = url.path_segments()?;
            if parts.next()? != "embed" {
                return None;
            }
            let id = parts.next()?;
            if id.is_empty()
                || !id
                    .bytes()
                    .all(|b| b.is_ascii_alphanumeric() || b == b'_' || b == b'-')
                || parts.next().is_some()
            {
                return None;
            }
            Some(format!("https://www.youtube-nocookie.com/embed/{id}"))
        }
        Provider::Vimeo if host == "player.vimeo.com" => Some(url.to_string()),
        Provider::Spotify if host == "open.spotify.com" => Some(url.to_string()),
        Provider::SoundCloud if host == "w.soundcloud.com" => Some(url.to_string()),
        Provider::TikTok if host == "www.tiktok.com" => Some(url.to_string()),
        _ => None,
    }
}

fn parse_oembed_body(provider: Provider, raw: &str, original_url: &str) -> Option<UnfurlResult> {
    let body: OEmbedBody = serde_json::from_str(raw).ok()?;
    if body.title.trim().is_empty() || body.provider_name.trim().is_empty() {
        return None;
    }
    let embed_url = iframe_embed_url(provider, &body.html)?;
    Some(UnfurlResult {
        url: original_url.to_string(),
        kind: "embed".into(),
        title: Some(body.title),
        description: None,
        image_url: Some(body.thumbnail_url),
        site_name: Some(body.provider_name),
        provider: Some(provider.name().into()),
        embed_url: Some(embed_url),
        media_url: None,
        error: None,
    })
}

async fn fetch_oembed(
    client: &reqwest::Client,
    provider: Provider,
    original_url: &str,
) -> Option<UnfurlResult> {
    let response = client
        .get(provider.endpoint())
        .query(&[("url", original_url)])
        .send()
        .await
        .ok()?;
    if response.status() != reqwest::StatusCode::OK {
        return None;
    }
    let body = response.text().await.ok()?;
    parse_oembed_body(provider, &body, original_url)
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

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .redirect(reqwest::redirect::Policy::none())
        .user_agent("Parley-Unfurl/0.1 (+self-hosted)")
        .build()
        .map_err(|_| ApiError::internal("unfurl client"))?;

    if let Some(provider) = provider_for(&parsed) {
        if let Some(result) = fetch_oembed(&client, provider, raw).await {
            return Ok(Json(result));
        }
    }

    let response = match fetch_ssrf_safe(&client, parsed.clone()).await {
        Ok(r) => r,
        Err(UnfurlFetchError::Blocked(msg)) => return Err(ApiError::bad_request(msg)),
        Err(UnfurlFetchError::Network) => {
            return Ok(Json(failed_card(raw, parsed.host_str())));
        }
    };

    let content_type = response
        .headers()
        .get(reqwest::header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("")
        .to_ascii_lowercase();

    if content_type.starts_with("image/") {
        let image_url = response.url().clone();
        return Ok(Json(UnfurlResult {
            url: raw.to_string(),
            kind: "image".into(),
            title: None,
            description: None,
            image_url: Some(image_url.to_string()),
            site_name: image_url.host_str().map(str::to_string),
            provider: None,
            embed_url: None,
            media_url: None,
            error: None,
        }));
    }

    if content_type.starts_with("video/") {
        let media_url = response.url().clone();
        return Ok(Json(UnfurlResult {
            url: raw.to_string(),
            kind: "video".into(),
            title: None,
            description: None,
            image_url: None,
            site_name: media_url.host_str().map(str::to_string),
            provider: None,
            embed_url: None,
            media_url: Some(media_url.to_string()),
            error: None,
        }));
    }

    if content_length_exceeds_unfurl_cap(response.headers()) {
        return Ok(Json(failed_card(raw, parsed.host_str())));
    }

    let bytes = match read_capped_body(response).await {
        Ok(b) => b,
        Err(_) => return Ok(Json(failed_card(raw, parsed.host_str()))),
    };
    let html = String::from_utf8_lossy(&bytes);
    let title = meta_content(&html, "og:title")
        .or_else(|| meta_content(&html, "twitter:title"))
        .or_else(|| html_title(&html));
    let description = meta_content(&html, "og:description")
        .or_else(|| meta_content(&html, "twitter:description"));
    let image_url =
        meta_content(&html, "og:image").or_else(|| meta_content(&html, "twitter:image"));
    let site_name =
        meta_content(&html, "og:site_name").or_else(|| parsed.host_str().map(str::to_string));
    let og_type = meta_content(&html, "og:type").unwrap_or_default();
    let kind = if og_type.contains("video") {
        "video"
    } else {
        "link"
    };

    let image_url = match image_url {
        Some(img) => safe_og_image(&parsed, &img).await,
        None => None,
    };

    Ok(Json(UnfurlResult {
        url: raw.to_string(),
        kind: kind.into(),
        title,
        description,
        image_url,
        site_name,
        provider: None,
        embed_url: None,
        media_url: None,
        error: None,
    }))
}

fn failed_card(raw: &str, host: Option<&str>) -> UnfurlResult {
    UnfurlResult {
        url: raw.to_string(),
        kind: "link".into(),
        title: None,
        description: None,
        image_url: None,
        site_name: host.map(str::to_string),
        provider: None,
        embed_url: None,
        media_url: None,
        error: Some("unfurl_failed".into()),
    }
}

enum UnfurlFetchError {
    Blocked(&'static str),
    Network,
}

async fn fetch_ssrf_safe(
    client: &reqwest::Client,
    start: Url,
) -> Result<reqwest::Response, UnfurlFetchError> {
    let mut url = start;
    for hop in 0..=MAX_REDIRECTS {
        if let Err(msg) = validate_public_url(&url).await {
            return Err(UnfurlFetchError::Blocked(msg));
        }
        let response = client
            .get(url.clone())
            .send()
            .await
            .map_err(|_| UnfurlFetchError::Network)?;
        if response.status().is_redirection() {
            if hop == MAX_REDIRECTS {
                return Err(UnfurlFetchError::Network);
            }
            let loc = response
                .headers()
                .get(reqwest::header::LOCATION)
                .and_then(|v| v.to_str().ok())
                .ok_or(UnfurlFetchError::Network)?;
            url = url.join(loc).map_err(|_| UnfurlFetchError::Network)?;
            if url.scheme() != "http" && url.scheme() != "https" {
                return Err(UnfurlFetchError::Blocked("only http(s) urls allowed"));
            }
            continue;
        }
        return Ok(response);
    }
    Err(UnfurlFetchError::Network)
}

async fn safe_og_image(page: &Url, raw: &str) -> Option<String> {
    let joined = page.join(raw.trim()).ok()?;
    if joined.scheme() != "http" && joined.scheme() != "https" {
        return None;
    }
    validate_public_url(&joined).await.ok()?;
    Some(joined.to_string())
}

pub fn content_length_exceeds_unfurl_cap(headers: &reqwest::header::HeaderMap) -> bool {
    headers
        .get(reqwest::header::CONTENT_LENGTH)
        .and_then(|v| v.to_str().ok())
        .and_then(|s| s.parse::<u64>().ok())
        .is_some_and(|n| n > MAX_UNFURL_BODY as u64)
}

async fn read_capped_body(mut response: reqwest::Response) -> Result<Vec<u8>, ()> {
    let mut buf = Vec::new();
    loop {
        match response.chunk().await {
            Ok(Some(chunk)) => {
                if buf.len().saturating_add(chunk.len()) > MAX_UNFURL_BODY {
                    return Err(());
                }
                buf.extend_from_slice(&chunk);
            }
            Ok(None) => break,
            Err(_) => return Err(()),
        }
    }
    Ok(buf)
}

pub async fn validate_public_url(url: &Url) -> Result<(), &'static str> {
    let host = url.host_str().ok_or("url host required")?;
    if host.eq_ignore_ascii_case("localhost") || host.ends_with(".localhost") {
        return Err("private or local urls blocked");
    }
    let lower = host.to_ascii_lowercase();
    if lower == "metadata.google.internal" || lower.ends_with(".internal") || lower == "metadata" {
        return Err("private or local urls blocked");
    }
    if let Ok(ip) = host.parse::<IpAddr>() {
        if is_blocked_ip(ip) {
            return Err("private or local urls blocked");
        }
        return Ok(());
    }
    let port = url.port_or_known_default().unwrap_or(80);
    let lookup = format!("{host}:{port}");
    let addrs = tokio::task::spawn_blocking(move || {
        lookup.to_socket_addrs().map(|i| i.collect::<Vec<_>>())
    })
    .await
    .map_err(|_| "private or local urls blocked")?
    .map_err(|_| "private or local urls blocked")?;
    if addrs.is_empty() {
        return Err("private or local urls blocked");
    }
    for addr in addrs {
        if is_blocked_ip(addr.ip()) {
            return Err("private or local urls blocked");
        }
    }
    Ok(())
}

pub fn is_blocked_ip(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(v4) => {
            v4.is_loopback()
                || v4.is_private()
                || v4.is_link_local()
                || v4.is_broadcast()
                || v4.is_unspecified()
                || v4.octets()[0] == 169 && v4.octets()[1] == 254
        }
        IpAddr::V6(v6) => {
            if let Some(v4) = v6.to_ipv4_mapped() {
                return is_blocked_ip(IpAddr::V4(v4));
            }
            v6.is_loopback() || v6.is_unique_local() || v6.is_unspecified()
        }
    }
}

fn meta_content(html: &str, property: &str) -> Option<String> {
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

#[cfg(test)]
mod tests {
    use super::*;
    use reqwest::header::{HeaderMap, HeaderValue, CONTENT_LENGTH};
    use std::net::{Ipv4Addr, Ipv6Addr};

    #[test]
    fn blocks_loopback_and_link_local() {
        assert!(is_blocked_ip(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1))));
        assert!(is_blocked_ip(IpAddr::V4(Ipv4Addr::new(169, 254, 169, 254))));
        assert!(is_blocked_ip(IpAddr::V4(Ipv4Addr::new(10, 0, 0, 1))));
        assert!(is_blocked_ip(IpAddr::V6(Ipv6Addr::LOCALHOST)));
        assert!(!is_blocked_ip(IpAddr::V4(Ipv4Addr::new(1, 1, 1, 1))));
    }

    #[test]
    fn content_length_cap() {
        let mut h = HeaderMap::new();
        h.insert(CONTENT_LENGTH, HeaderValue::from_static("262145"));
        assert!(content_length_exceeds_unfurl_cap(&h));
        h.insert(CONTENT_LENGTH, HeaderValue::from_static("100"));
        assert!(!content_length_exceeds_unfurl_cap(&h));
    }

    #[test]
    fn provider_hosts() {
        for (host, provider) in [
            ("youtube.com", Provider::YouTube),
            ("www.youtube.com", Provider::YouTube),
            ("m.youtube.com", Provider::YouTube),
            ("youtu.be", Provider::YouTube),
            ("www.youtube-nocookie.com", Provider::YouTube),
            ("vimeo.com", Provider::Vimeo),
            ("www.vimeo.com", Provider::Vimeo),
            ("player.vimeo.com", Provider::Vimeo),
            ("open.spotify.com", Provider::Spotify),
            ("soundcloud.com", Provider::SoundCloud),
            ("www.soundcloud.com", Provider::SoundCloud),
            ("m.soundcloud.com", Provider::SoundCloud),
            ("tiktok.com", Provider::TikTok),
            ("www.tiktok.com", Provider::TikTok),
            ("vm.tiktok.com", Provider::TikTok),
            ("m.tiktok.com", Provider::TikTok),
        ] {
            assert_eq!(
                provider_for(&Url::parse(&format!("https://{host}/test")).unwrap()),
                Some(provider)
            );
        }
        assert_eq!(
            provider_for(&Url::parse("https://youtube.com.evil.test/").unwrap()),
            None
        );
    }

    #[test]
    fn oembed_body_decision() {
        let body = r#"{"title":"A video","thumbnail_url":"https://img.example/a.jpg","provider_name":"YouTube","html":"<iframe src='https://www.youtube.com/embed/abc123?autoplay=1'></iframe>"}"#;
        let result = parse_oembed_body(Provider::YouTube, body, "https://youtu.be/abc123").unwrap();
        assert_eq!(result.kind, "embed");
        assert_eq!(result.title.as_deref(), Some("A video"));
        assert_eq!(
            result.image_url.as_deref(),
            Some("https://img.example/a.jpg")
        );
        assert_eq!(result.site_name.as_deref(), Some("YouTube"));
        assert_eq!(result.provider.as_deref(), Some("youtube"));
        assert_eq!(
            result.embed_url.as_deref(),
            Some("https://www.youtube-nocookie.com/embed/abc123")
        );
        assert!(parse_oembed_body(Provider::YouTube, "", "https://youtu.be/abc123").is_none());
        assert!(
            parse_oembed_body(Provider::YouTube, "{bad json", "https://youtu.be/abc123").is_none()
        );
    }

    #[test]
    fn iframe_hosts_and_rewriting() {
        for (provider, html, expected) in [
            (
                Provider::YouTube,
                "<iframe src=\"https://www.youtube.com/embed/abc123?feature=oembed\"></iframe>",
                "https://www.youtube-nocookie.com/embed/abc123",
            ),
            (
                Provider::Vimeo,
                "<iframe src=\"https://player.vimeo.com/video/123\"></iframe>",
                "https://player.vimeo.com/video/123",
            ),
            (
                Provider::Spotify,
                "<iframe src=\"https://open.spotify.com/embed/track/abc\"></iframe>",
                "https://open.spotify.com/embed/track/abc",
            ),
            (
                Provider::SoundCloud,
                "<iframe src=\"https://w.soundcloud.com/player/?url=abc\"></iframe>",
                "https://w.soundcloud.com/player/?url=abc",
            ),
            (
                Provider::TikTok,
                "<iframe src=\"https://www.tiktok.com/embed/v2/123\"></iframe>",
                "https://www.tiktok.com/embed/v2/123",
            ),
        ] {
            assert_eq!(iframe_embed_url(provider, html).as_deref(), Some(expected));
        }
        assert!(iframe_embed_url(
            Provider::Vimeo,
            "<iframe src='https://evil.test/video/123'></iframe>"
        )
        .is_none());
        assert!(iframe_embed_url(Provider::Vimeo, "<div>no iframe</div>").is_none());
    }
}
