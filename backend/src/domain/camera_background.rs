use chrono::{DateTime, Utc};
use serde::Serialize;
use uuid::Uuid;

pub const MAX_CAMERA_BACKGROUND_BYTES: usize = 5 * 1024 * 1024;
pub const MAX_CAMERA_BACKGROUNDS_PER_ACCOUNT: i64 = 10;

#[derive(Clone, Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CameraBackground {
    pub id: Uuid,
    #[serde(skip_serializing)]
    pub account_id: Uuid,
    #[serde(skip_serializing)]
    pub filename: String,
    pub content_type: String,
    pub size_bytes: i64,
    pub created_at: DateTime<Utc>,
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::domain::avatar::{is_allowed_avatar_type, normalize_avatar_type};

    #[test]
    fn limits_and_image_types() {
        assert_eq!(MAX_CAMERA_BACKGROUND_BYTES, 5 * 1024 * 1024);
        assert_eq!(MAX_CAMERA_BACKGROUNDS_PER_ACCOUNT, 10);
        for content_type in ["image/jpeg", "image/png", "image/webp"] {
            assert!(is_allowed_avatar_type(content_type));
        }
        assert_eq!(normalize_avatar_type("image/png; charset=binary").as_deref(), Some("image/png"));
        assert!(!is_allowed_avatar_type("image/svg+xml"));
    }
}
