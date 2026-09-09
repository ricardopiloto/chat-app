use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

fn default_kind() -> String {
    "user".to_string()
}

fn is_user_kind(kind: &str) -> bool {
    kind.is_empty() || kind == "user"
}

fn nil_uuid() -> Uuid {
    Uuid::nil()
}

fn is_nil_uuid(id: &Uuid) -> bool {
    *id == Uuid::nil()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: Uuid,
    pub channel_id: Uuid,
    #[serde(default = "nil_uuid", skip_serializing_if = "is_nil_uuid")]
    pub sender_account_id: Uuid,
    #[serde(default, skip_serializing_if = "String::is_empty")]
    pub content_ciphertext: String,
    pub created_at: DateTime<Utc>,
    #[serde(default = "default_kind", skip_serializing_if = "is_user_kind")]
    pub kind: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub content_plaintext: Option<String>,
    #[serde(default)]
    pub attachment_ids: Vec<Uuid>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reply_to_message_id: Option<Uuid>,
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub mentioned_account_ids: Vec<Uuid>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reply_to_sender_account_id: Option<Uuid>,
}

impl Message {
    pub fn is_system(&self) -> bool {
        self.kind == "system"
    }
}
