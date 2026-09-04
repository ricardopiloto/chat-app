use serde_json::Value;
use spike_token::{mint_jwt, AppState, TokenRequest, TokenResponse};

#[test]
fn token_response_json_has_only_token_and_url() {
    let body = TokenResponse {
        token: "header.payload.sig".into(),
        url: "ws://127.0.0.1:7880".into(),
    };
    let json = serde_json::to_value(&body).unwrap();
    let obj = json.as_object().unwrap();
    assert_eq!(obj.len(), 2);
    assert!(obj.contains_key("token"));
    assert!(obj.contains_key("url"));
    assert!(!obj.contains_key("secret"));
    assert!(!obj.contains_key("apiSecret"));
    assert!(!obj.contains_key("api_secret"));
    let s = serde_json::to_string(&body).unwrap();
    assert!(!s.contains("spikesecret"));
}

#[test]
fn minted_jwt_does_not_embed_api_secret() {
    let state = AppState {
        api_key: "spikekey".into(),
        api_secret: "spikesecretspikesecretspikesecret".into(),
        ws_url: "ws://127.0.0.1:7880".into(),
    };
    let req = TokenRequest {
        identity: "alice".into(),
        room: "spike-room".into(),
        name: None,
    };
    let jwt = mint_jwt(&state, &req).expect("jwt");
    assert!(!jwt.contains("spikesecret"));
    let payload = jwt.split('.').nth(1).expect("payload");
    let decoded = decode_jwt_payload(payload);
    assert!(!decoded.contains("spikesecret"));
    assert!(decoded.contains("alice"));
    assert!(decoded.contains("spike-room"));
    let v: Value = serde_json::from_str(&decoded).unwrap();
    assert!(v.get("secret").is_none());
}

fn decode_jwt_payload(payload: &str) -> String {
    let padded = match payload.len() % 4 {
        0 => payload.to_string(),
        n => format!("{payload}{}", "=".repeat(4 - n)),
    };
    let b64 = padded.replace('-', "+").replace('_', "/");
    let bytes = b64::decode(b64).expect("base64");
    String::from_utf8(bytes).expect("utf8")
}

mod b64 {
    pub fn decode(s: String) -> Result<Vec<u8>, &'static str> {
        fn val(c: u8) -> Option<u8> {
            match c {
                b'A'..=b'Z' => Some(c - b'A'),
                b'a'..=b'z' => Some(c - b'a' + 26),
                b'0'..=b'9' => Some(c - b'0' + 52),
                b'+' => Some(62),
                b'/' => Some(63),
                b'=' => Some(0),
                _ => None,
            }
        }
        let bytes = s.as_bytes();
        let mut out = Vec::new();
        let mut i = 0;
        while i + 3 < bytes.len() {
            let a = val(bytes[i]).ok_or("b64")?;
            let b = val(bytes[i + 1]).ok_or("b64")?;
            let c = val(bytes[i + 2]).ok_or("b64")?;
            let d = val(bytes[i + 3]).ok_or("b64")?;
            out.push((a << 2) | (b >> 4));
            if bytes[i + 2] != b'=' {
                out.push((b << 4) | (c >> 2));
            }
            if bytes[i + 3] != b'=' {
                out.push((c << 6) | d);
            }
            i += 4;
        }
        Ok(out)
    }
}
