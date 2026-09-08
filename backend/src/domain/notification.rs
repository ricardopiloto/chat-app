use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum NotificationKind {
    Mention,
    Reply,
}

impl NotificationKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Mention => "mention",
            Self::Reply => "reply",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "mention" => Some(Self::Mention),
            "reply" => Some(Self::Reply),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UserNotification {
    pub id: Uuid,
    pub account_id: Uuid,
    pub kind: NotificationKind,
    pub channel_id: Uuid,
    pub message_id: Option<Uuid>,
    pub actor_account_id: Uuid,
    pub created_at: DateTime<Utc>,
    pub read_at: Option<DateTime<Utc>>,
}
