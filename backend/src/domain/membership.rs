use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum KeyHandoffStatus {
    Synced,
    Pending,
}

impl KeyHandoffStatus {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Synced => "synced",
            Self::Pending => "pending",
        }
    }

    pub fn parse(value: &str) -> Self {
        if value == "synced" {
            Self::Synced
        } else {
            Self::Pending
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Membership {
    pub account_id: Uuid,
    pub server_id: Uuid,
    pub key_handoff_status: KeyHandoffStatus,
    #[serde(skip_serializing)]
    pub joined_at: DateTime<Utc>,
    #[serde(skip_serializing)]
    pub joined_via_invite_id: Option<Uuid>,
}
