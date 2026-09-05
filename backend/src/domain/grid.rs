use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Inclusive bounds for scene / voice grid slot counts (018).
pub const MIN_SCENE_SLOTS: i64 = 2;
pub const MAX_SCENE_SLOTS: i64 = 8;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum AssignedBy {
    Auto,
    Owner,
}

impl AssignedBy {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Auto => "auto",
            Self::Owner => "owner",
        }
    }

    pub fn parse(value: &str) -> Self {
        if value == "owner" {
            Self::Owner
        } else {
            Self::Auto
        }
    }
}

/// Named composition layout *families* — slot count is orthogonal (2–8).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LayoutKey {
    Mestre,
    Quad,
    Faixa,
}

impl LayoutKey {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Mestre => "mestre",
            Self::Quad => "quad",
            Self::Faixa => "faixa",
        }
    }

    pub fn parse(value: &str) -> Option<Self> {
        match value {
            "mestre" => Some(Self::Mestre),
            "quad" => Some(Self::Quad),
            "faixa" => Some(Self::Faixa),
            _ => None,
        }
    }

    /// Legacy default when only a slot count is known (e.g. missing layout_key in DB).
    pub fn from_slot_count(slot_count: i64) -> Self {
        match slot_count {
            5 => Self::Mestre,
            _ => Self::Quad,
        }
    }

    /// Suggested default N when creating a scene of this family (not a hard catalog lock).
    pub fn default_slot_count(self) -> i64 {
        match self {
            Self::Mestre | Self::Faixa => 5,
            Self::Quad => 4,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GridSlotView {
    pub index: i64,
    pub account_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GridLayout {
    pub layout_key: LayoutKey,
    pub slot_count: i64,
    pub assigned_by: AssignedBy,
    pub slots: Vec<GridSlotView>,
}

#[derive(Debug, Clone)]
pub struct GridSlot {
    pub channel_id: Uuid,
    pub slot_index: i64,
    pub account_id: Option<Uuid>,
    pub assigned_by: AssignedBy,
}

pub fn validate_layout(body: &GridLayout) -> Result<Vec<(i64, Option<Uuid>)>, &'static str> {
    use std::collections::HashSet;
    if !(MIN_SCENE_SLOTS..=MAX_SCENE_SLOTS).contains(&body.slot_count) {
        return Err("slot_count must be 2–8");
    }
    if i64::try_from(body.slots.len()).unwrap_or(0) != body.slot_count {
        return Err("slots length must equal slot_count");
    }
    let mut seen_index = HashSet::new();
    let mut seen_accounts = HashSet::new();
    let mut mapped = Vec::new();
    for slot in &body.slots {
        if slot.index < 0 || slot.index >= body.slot_count {
            return Err("slot index out of range");
        }
        if !seen_index.insert(slot.index) {
            return Err("duplicate slot index");
        }
        if let Some(id) = slot.account_id {
            if !seen_accounts.insert(id) {
                return Err("account already occupies a slot");
            }
        }
        mapped.push((slot.index, slot.account_id));
    }
    Ok(mapped)
}
