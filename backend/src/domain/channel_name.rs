//! Channel name normalize + validate (072).

pub const CHANNEL_NAME_MAX: usize = 32;

/// Replace Unicode whitespace with `-`, then take at most [`CHANNEL_NAME_MAX`] scalars.
pub fn normalize_channel_name(raw: &str) -> String {
    let mut out = String::new();
    for c in raw.chars() {
        if c.is_whitespace() {
            out.push('-');
        } else {
            out.push(c);
        }
    }
    out.chars().take(CHANNEL_NAME_MAX).collect()
}

/// Normalize then reject empty or hyphen-only names.
pub fn validate_channel_name(raw: &str) -> Result<String, &'static str> {
    let name = normalize_channel_name(raw);
    if name.is_empty() {
        return Err("name required");
    }
    if name.chars().all(|c| c == '-') {
        return Err("name cannot be only hyphens");
    }
    Ok(name)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn spaces_to_hyphens() {
        assert_eq!(normalize_channel_name("sala geral"), "sala-geral");
    }

    #[test]
    fn truncates_to_32() {
        let s: String = (0..40).map(|_| 'a').collect();
        assert_eq!(normalize_channel_name(&s).chars().count(), 32);
    }

    #[test]
    fn rejects_hyphen_only() {
        assert!(validate_channel_name("---").is_err());
        assert!(validate_channel_name("   ").is_err());
    }
}
