use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Invite {
    pub code: String,
    pub server_id: Uuid,
    pub expires_at: Option<DateTime<Utc>>,
    pub include_history: bool,
}

#[derive(Debug, Clone)]
pub struct InviteRecord {
    pub id: Uuid,
    pub code: String,
    pub server_id: Uuid,
    pub created_by_account_id: Uuid,
    pub expires_at: Option<DateTime<Utc>>,
    pub include_history: bool,
    pub revoked_at: Option<DateTime<Utc>>,
}

impl InviteRecord {
    pub fn public(&self) -> Invite {
        Invite {
            code: self.code.clone(),
            server_id: self.server_id,
            expires_at: self.expires_at,
            include_history: self.include_history,
        }
    }

    pub fn is_usable(&self, now: DateTime<Utc>) -> bool {
        self.revoked_at.is_none() && self.expires_at.map(|t| t > now).unwrap_or(true)
    }
}
