use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

/// Occupant stale after this many seconds without heartbeat / media PATCH.
pub const OCCUPANT_STALE_SECS: i64 = 45;

#[derive(Debug, Clone)]
pub struct VoiceOccupant {
    pub account_id: Uuid,
    pub channel_id: Uuid,
    pub server_id: Uuid,
    pub mic_on: bool,
    pub cam_on: bool,
    pub screen_on: bool,
    pub joined_at: DateTime<Utc>,
    pub last_seen_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize)]
pub struct OccupantView {
    pub account_id: Uuid,
    pub handle: String,
    pub mic_on: bool,
    pub cam_on: bool,
    pub screen_on: bool,
    pub has_avatar: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ChannelOccupancy {
    pub channel_id: Uuid,
    pub call_started_at: Option<DateTime<Utc>>,
    pub occupants: Vec<OccupantView>,
}

#[derive(Debug, Clone, Serialize)]
pub struct VoiceOccupancyResponse {
    pub channels: Vec<ChannelOccupancy>,
}
