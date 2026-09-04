use crate::domain::grid::{GridLayout, LayoutKey};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub const MAX_SCENES_PER_CHANNEL: i64 = 32;
pub const DEFAULT_SCENE_NAME: &str = "Cena padrão";

#[derive(Debug, Clone)]
pub struct Scene {
    pub id: Uuid,
    pub channel_id: Uuid,
    pub name: String,
    pub slot_count: i64,
    pub layout_key: LayoutKey,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneView {
    pub id: Uuid,
    pub channel_id: Uuid,
    pub name: String,
    pub is_active: bool,
    pub layout: GridLayout,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SceneSummary {
    pub id: Uuid,
    pub name: String,
    pub is_active: bool,
}

pub fn normalize_name(raw: &str) -> Result<String, &'static str> {
    let name = raw.trim();
    if name.is_empty() {
        return Err("name required");
    }
    if name.len() > 64 {
        return Err("name must be at most 64 characters");
    }
    Ok(name.to_string())
}
