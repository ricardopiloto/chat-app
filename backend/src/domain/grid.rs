use serde::{Deserialize, Serialize};
use uuid::Uuid;

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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GridSlotView {
    pub index: i64,
    pub account_id: Option<Uuid>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GridLayout {
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
