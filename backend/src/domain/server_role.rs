use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Boolean capabilities granted by a server role (Discord-style toggles).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct RoleCapabilities {
    /// Product: Visualizar canal. Public channels stay visible to all members (FR-008);
    /// this flag may still gate private-list edge cases / future use.
    #[serde(default = "default_true")]
    pub can_view_channels: bool,
    /// Create / edit / delete channels (includes legacy can_create_channels).
    #[serde(default)]
    pub can_manage_channels: bool,
    /// Create / edit / delete roles and assign members.
    #[serde(default)]
    pub can_manage_roles: bool,
    #[serde(default)]
    pub can_create_invites: bool,
    #[serde(default = "default_true")]
    pub can_send_messages: bool,
    /// Delete messages authored by others.
    #[serde(default)]
    pub can_delete_messages: bool,
    #[serde(default = "default_true")]
    pub can_attach_files: bool,
    #[serde(default)]
    pub can_remove_members: bool,
    /// Silenciar membros em canais de texto (timeout).
    #[serde(default)]
    pub can_mute_members: bool,
    #[serde(default = "default_true")]
    pub can_connect_voice: bool,
    #[serde(default = "default_true")]
    pub can_speak_voice: bool,
}

fn default_true() -> bool {
    true
}

impl RoleCapabilities {
    pub fn open_defaults() -> Self {
        Self {
            can_view_channels: true,
            can_manage_channels: false,
            can_manage_roles: false,
            can_create_invites: false,
            can_send_messages: true,
            can_delete_messages: false,
            can_attach_files: true,
            can_remove_members: false,
            can_mute_members: false,
            can_connect_voice: true,
            can_speak_voice: true,
        }
    }

    pub fn owner_all() -> Self {
        Self {
            can_view_channels: true,
            can_manage_channels: true,
            can_manage_roles: true,
            can_create_invites: true,
            can_send_messages: true,
            can_delete_messages: true,
            can_attach_files: true,
            can_remove_members: true,
            can_mute_members: true,
            can_connect_voice: true,
            can_speak_voice: true,
        }
    }

    pub fn or_with(&self, other: &Self) -> Self {
        Self {
            can_view_channels: self.can_view_channels || other.can_view_channels,
            can_manage_channels: self.can_manage_channels || other.can_manage_channels,
            can_manage_roles: self.can_manage_roles || other.can_manage_roles,
            can_create_invites: self.can_create_invites || other.can_create_invites,
            can_send_messages: self.can_send_messages || other.can_send_messages,
            can_delete_messages: self.can_delete_messages || other.can_delete_messages,
            can_attach_files: self.can_attach_files || other.can_attach_files,
            can_remove_members: self.can_remove_members || other.can_remove_members,
            can_mute_members: self.can_mute_members || other.can_mute_members,
            can_connect_voice: self.can_connect_voice || other.can_connect_voice,
            can_speak_voice: self.can_speak_voice || other.can_speak_voice,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerRole {
    pub id: Uuid,
    pub server_id: Uuid,
    pub name: String,
    /// Legacy flag; kept in sync with `capabilities.can_manage_channels` for older clients.
    pub can_create_channels: bool,
    pub capabilities: RoleCapabilities,
    /// System Owner/Dono profile — not deletable/editable; reserved for server owner.
    #[serde(default)]
    pub is_system: bool,
    /// Higher = more administrative authority (060).
    #[serde(default)]
    pub position: i64,
    #[serde(default)]
    pub member_ids: Vec<Uuid>,
}

/// Reserved top position for system Dono.
pub const DONO_POSITION: i64 = 1000;
/// Effective position when the member has no role.
pub const NO_ROLE_POSITION: i64 = -1;

/// Fixed display name for the auto-created owner profile (product PT).
pub const DONO_ROLE_NAME: &str = "Dono";

pub fn is_dono_name(name: &str) -> bool {
    name.trim() == DONO_ROLE_NAME
}
