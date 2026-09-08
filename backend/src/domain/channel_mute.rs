use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelMute {
    pub channel_id: Uuid,
    pub account_id: Uuid,
    pub muted_by_account_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub ends_at: DateTime<Utc>,
}

impl ChannelMute {
    pub fn is_active(&self, now: DateTime<Utc>) -> bool {
        now < self.ends_at
    }
}
