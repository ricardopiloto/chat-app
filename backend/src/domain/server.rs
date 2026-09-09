use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Server {
    pub id: Uuid,
    pub name: String,
    pub owner_account_id: Uuid,
    pub has_image: bool,
    #[serde(default)]
    pub has_unread: bool,
    #[serde(default)]
    pub has_voice: bool,
    #[serde(skip)]
    pub image_filename: Option<String>,
    #[serde(skip)]
    pub image_content_type: Option<String>,
}

/// Owner-configurable join welcome settings (077).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ServerWelcomeSettings {
    pub welcome_channel_id: Option<Uuid>,
    pub welcome_message_template: Option<String>,
}
