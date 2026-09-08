use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ChannelType {
    Text,
    VoiceVideo,
}

impl ChannelType {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Text => "text",
            Self::VoiceVideo => "voice_video",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "text" => Some(Self::Text),
            "voice_video" => Some(Self::VoiceVideo),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ChannelVisibility {
    Public,
    Private,
}

impl ChannelVisibility {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Public => "public",
            Self::Private => "private",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "public" => Some(Self::Public),
            "private" => Some(Self::Private),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Channel {
    pub id: Uuid,
    pub server_id: Uuid,
    pub name: String,
    #[serde(rename = "type")]
    pub kind: ChannelType,
    pub grid_slot_count: Option<i64>,
    pub created_by_account_id: Uuid,
    pub e2ee_enabled: bool,
    pub has_channel_key: bool,
    pub visibility: ChannelVisibility,
    pub visible_to_new_members: bool,
    /// Effective permission for the requesting account (list/get responses).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub my_permission: Option<String>,
}
