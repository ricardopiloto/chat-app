use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use serde::Deserialize;
use uuid::Uuid;

use crate::api::authz::require_write_text;
use crate::api::messages::send_to_channel_viewers;
use crate::db;
use crate::domain::channel::ChannelType;
use crate::AppState;

const FRAME_MAX_BYTES: usize = 512;
const MIN_GAP: Duration = Duration::from_secs(2);

#[derive(Clone, Default)]
pub struct TypingLimiter {
    last: Arc<Mutex<HashMap<(Uuid, Uuid), Mark>>>,
}

struct Mark {
    at: Instant,
    active: bool,
}

impl TypingLimiter {
    /// One accepted frame per account and channel inside [`MIN_GAP`], except a stop that follows a start.
    pub fn allow(&self, account_id: Uuid, channel_id: Uuid, active: bool) -> bool {
        let now = Instant::now();
        let mut map = self.last.lock().expect("typing limiter");
        map.retain(|_, mark| now.saturating_duration_since(mark.at) < Duration::from_secs(30));
        let key = (account_id, channel_id);
        if let Some(prev) = map.get(&key) {
            let soon = now.saturating_duration_since(prev.at) < MIN_GAP;
            let stopping = !active && prev.active;
            if soon && !stopping {
                return false;
            }
        }
        map.insert(key, Mark { at: now, active });
        true
    }
}

#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
struct TypingFrame {
    #[serde(rename = "type")]
    kind: String,
    channel_id: Uuid,
    active: bool,
}

/// Accepts one client text frame. Invalid frames and unauthorized accounts produce no event.
pub async fn accept(state: &AppState, account_id: Uuid, text: &str) {
    if text.len() > FRAME_MAX_BYTES {
        return;
    }
    let Ok(frame) = serde_json::from_str::<TypingFrame>(text) else {
        return;
    };
    if frame.kind != "typing" {
        return;
    }
    let Ok((channel, _, _)) = require_write_text(&state.pool, account_id, frame.channel_id).await
    else {
        return;
    };
    if channel.kind != ChannelType::Text {
        return;
    }
    let muted = db::channel_mute::get_active(&state.pool, channel.id, account_id, chrono::Utc::now())
        .await
        .ok()
        .flatten();
    if muted.is_some() {
        return;
    }
    if !state.typing.allow(account_id, channel.id, frame.active) {
        return;
    }
    let payload = serde_json::json!({
        "channel_id": channel.id,
        "account_id": account_id,
        "active": frame.active,
    });
    send_to_channel_viewers(state, &channel, "typing.updated", &payload).await;
}
