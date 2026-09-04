use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelRole {
    pub channel_id: Uuid,
    pub account_id: Uuid,
    pub role: String,
}

#[derive(Debug, Clone)]
pub struct ChannelRoleRow {
    pub channel_id: Uuid,
    pub account_id: Uuid,
    pub role: String,
    pub granted_by_account_id: Uuid,
    pub created_at: DateTime<Utc>,
}

pub const ROLE_CO_DIRECTOR: &str = "co_director";
