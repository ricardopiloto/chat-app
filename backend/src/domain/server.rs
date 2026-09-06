use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Server {
    pub id: Uuid,
    pub name: String,
    pub owner_account_id: Uuid,
    pub has_image: bool,
    #[serde(skip)]
    pub image_filename: Option<String>,
    #[serde(skip)]
    pub image_content_type: Option<String>,
}
