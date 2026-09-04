use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub id: Uuid,
    pub channel_id: Uuid,
    pub sender_account_id: Uuid,
    pub content_ciphertext: String,
    pub created_at: DateTime<Utc>,
    #[serde(default)]
    pub attachment_ids: Vec<Uuid>,
}
