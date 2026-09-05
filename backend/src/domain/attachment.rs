use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub const MAX_ATTACHMENT_BYTES: usize = 5 * 1024 * 1024;
pub const MAX_ATTACHMENTS_PER_MESSAGE: usize = 10;

pub const ALLOWED_MEDIA_TYPES: &[&str] = &[
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
];

pub fn is_allowed_media_type(value: &str) -> bool {
    ALLOWED_MEDIA_TYPES.iter().any(|t| *t == value)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MessageAttachment {
    pub id: Uuid,
    pub channel_id: Uuid,
    pub message_id: Option<Uuid>,
    pub uploader_account_id: Uuid,
    pub content_type: String,
    pub size_bytes: i64,
    pub created_at: DateTime<Utc>,
}
