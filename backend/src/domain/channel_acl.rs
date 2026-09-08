use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Nil UUID used as `subject_id` for `everyone` overwrites.
pub const EVERYONE_SUBJECT_ID: Uuid = Uuid::nil();

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AclSubjectType {
    Account,
    Role,
    Everyone,
}

impl AclSubjectType {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Account => "account",
            Self::Role => "role",
            Self::Everyone => "everyone",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "account" => Some(Self::Account),
            "role" => Some(Self::Role),
            "everyone" => Some(Self::Everyone),
            _ => None,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum AclEffect {
    Allow,
    Deny,
}

impl AclEffect {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Allow => "allow",
            Self::Deny => "deny",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "allow" => Some(Self::Allow),
            "deny" => Some(Self::Deny),
            _ => None,
        }
    }
}

/// Unified permission level; text uses read/write, voice uses listen/speak.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PermLevel {
    Read,
    Write,
    Listen,
    Speak,
}

impl PermLevel {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Read => "read",
            Self::Write => "write",
            Self::Listen => "listen",
            Self::Speak => "speak",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "read" => Some(Self::Read),
            "write" => Some(Self::Write),
            "listen" => Some(Self::Listen),
            "speak" => Some(Self::Speak),
            _ => None,
        }
    }

    pub fn rank(self) -> u8 {
        match self {
            Self::Read | Self::Listen => 1,
            Self::Write | Self::Speak => 2,
        }
    }

    pub fn max(self, other: Self) -> Self {
        if self.rank() >= other.rank() {
            self
        } else {
            other
        }
    }

    pub fn is_view_level(self) -> bool {
        matches!(self, Self::Read | Self::Listen)
    }

    pub fn is_action_level(self) -> bool {
        matches!(self, Self::Write | Self::Speak)
    }

    pub fn allows_write(self) -> bool {
        matches!(self, Self::Write)
    }

    pub fn allows_speak(self) -> bool {
        matches!(self, Self::Speak)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelAclEntry {
    pub id: Uuid,
    pub channel_id: Uuid,
    pub subject_type: AclSubjectType,
    pub subject_id: Uuid,
    pub level: PermLevel,
    #[serde(default = "default_allow")]
    pub effect: AclEffect,
}

fn default_allow() -> AclEffect {
    AclEffect::Allow
}
