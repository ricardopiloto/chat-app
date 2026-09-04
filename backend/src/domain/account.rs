use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Account {
    pub id: Uuid,
    pub handle: String,
    pub is_initial_operator: bool,
}

#[derive(Debug, Clone)]
pub struct AccountRecord {
    pub id: Uuid,
    pub handle: String,
    pub password_hash: String,
    pub identity_pubkey: Vec<u8>,
    /// Cofre opaco (JSON cifrado no cliente). O servidor não desenvelopa.
    pub identity_vault: Option<Vec<u8>>,
    pub is_initial_operator: bool,
    pub created_at: DateTime<Utc>,
}

impl AccountRecord {
    pub fn public(&self) -> Account {
        Account {
            id: self.id,
            handle: self.handle.clone(),
            is_initial_operator: self.is_initial_operator,
        }
    }

    pub fn auth_view(&self) -> AuthAccount {
        AuthAccount {
            id: self.id,
            handle: self.handle.clone(),
            is_initial_operator: self.is_initial_operator,
            identity_vault: self
                .identity_vault
                .as_ref()
                .and_then(|bytes| serde_json::from_slice(bytes).ok()),
        }
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct AuthAccount {
    pub id: Uuid,
    pub handle: String,
    pub is_initial_operator: bool,
    pub identity_vault: Option<serde_json::Value>,
}
