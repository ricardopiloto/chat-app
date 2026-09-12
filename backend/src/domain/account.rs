use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Max Unicode scalar count for a set display name (099).
pub const DISPLAY_NAME_MAX_CHARS: usize = 64;

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
    pub avatar_filename: Option<String>,
    pub avatar_content_type: Option<String>,
    /// Optional public presentation name (099). NULL = unset.
    pub display_name: Option<String>,
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
            has_avatar: self.avatar_filename.is_some(),
            display_name: self.display_name.clone(),
        }
    }

    pub fn public_label(&self) -> String {
        public_display_label(&self.handle, self.display_name.as_deref())
    }
}

#[derive(Debug, Clone, Serialize)]
pub struct AuthAccount {
    pub id: Uuid,
    pub handle: String,
    pub is_initial_operator: bool,
    pub identity_vault: Option<serde_json::Value>,
    pub has_avatar: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub display_name: Option<String>,
}

/// Trim; strip control chars; empty → None; enforce max length when set.
pub fn normalize_display_name(raw: Option<&str>) -> Result<Option<String>, &'static str> {
    let Some(raw) = raw else {
        return Ok(None);
    };
    let cleaned: String = raw.chars().filter(|c| !c.is_control()).collect();
    let trimmed = cleaned.trim();
    if trimmed.is_empty() {
        return Ok(None);
    }
    if trimmed.chars().count() > DISPLAY_NAME_MAX_CHARS {
        return Err("display_name too long");
    }
    Ok(Some(trimmed.to_string()))
}

pub fn public_display_label(handle: &str, display_name: Option<&str>) -> String {
    match display_name.map(str::trim).filter(|s| !s.is_empty()) {
        Some(d) => d.to_string(),
        None => handle.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn normalize_empty_and_whitespace() {
        assert_eq!(normalize_display_name(None).unwrap(), None);
        assert_eq!(normalize_display_name(Some("")).unwrap(), None);
        assert_eq!(normalize_display_name(Some("   ")).unwrap(), None);
    }

    #[test]
    fn normalize_trims_and_keeps() {
        assert_eq!(
            normalize_display_name(Some("  Alice  ")).unwrap().as_deref(),
            Some("Alice")
        );
    }

    #[test]
    fn normalize_rejects_too_long() {
        let s = "a".repeat(DISPLAY_NAME_MAX_CHARS + 1);
        assert!(normalize_display_name(Some(&s)).is_err());
    }

    #[test]
    fn public_label_fallback() {
        assert_eq!(public_display_label("alice", None), "alice");
        assert_eq!(public_display_label("alice", Some("")), "alice");
        assert_eq!(public_display_label("alice", Some("Alice")), "Alice");
    }
}
