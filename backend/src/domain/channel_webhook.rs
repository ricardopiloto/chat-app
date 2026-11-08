use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

pub const WEBHOOK_CONTENT_MAX_CHARS: usize = 4000;

#[derive(Debug, Clone, Serialize)]
pub struct ChannelWebhook {
    pub id: Uuid,
    pub channel_id: Uuid,
    pub account_id: Uuid,
    pub display_name: String,
    pub has_avatar: bool,
    pub created_by_account_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub revoked_at: Option<DateTime<Utc>>,
}
