pub const MAX_AVATAR_BYTES: usize = 1 * 1024 * 1024;

pub const ALLOWED_AVATAR_TYPES: &[&str] = &["image/jpeg", "image/png", "image/webp"];

pub fn is_allowed_avatar_type(value: &str) -> bool {
    let normalized = value
        .split(';')
        .next()
        .unwrap_or(value)
        .trim()
        .to_ascii_lowercase();
    ALLOWED_AVATAR_TYPES.iter().any(|t| *t == normalized)
}

pub fn normalize_avatar_type(value: &str) -> Option<String> {
    let normalized = value
        .split(';')
        .next()
        .unwrap_or(value)
        .trim()
        .to_ascii_lowercase();
    if is_allowed_avatar_type(&normalized) {
        Some(normalized)
    } else {
        None
    }
}
