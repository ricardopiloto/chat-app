use std::path::Path;

pub fn normalize(raw: &str) -> Result<(String, String), &'static str> {
    let email = raw.trim().to_ascii_lowercase();
    if email.len() > 254 || email.bytes().any(|b| b <= 32 || b >= 127) {
        return Err("email_invalid");
    }
    let (local, domain) = email.split_once('@').ok_or("email_invalid")?;
    if local.is_empty()
        || local.len() > 64
        || domain.is_empty()
        || domain.contains('@')
        || !domain.contains('.')
    {
        return Err("email_invalid");
    }
    if local.starts_with('.')
        || local.ends_with('.')
        || local.contains("..")
        || !local
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b".!#$%&'*+-/=?^_`{|}~".contains(&b))
    {
        return Err("email_invalid");
    }
    if domain.split('.').any(|label| {
        label.is_empty()
            || label.len() > 63
            || label.starts_with('-')
            || label.ends_with('-')
            || !label
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b == b'-')
    }) {
        return Err("email_invalid");
    }
    let base = local.split('+').next().unwrap_or(local);
    let canonical = if domain == "gmail.com" || domain == "googlemail.com" {
        format!("{}@gmail.com", base.replace('.', ""))
    } else {
        format!("{base}@{domain}")
    };
    Ok((email, canonical))
}

pub fn domain_blocked(email: &str, extra_file: Option<&Path>) -> bool {
    let domain = email.rsplit_once('@').map(|(_, d)| d).unwrap_or("");
    let listed = |content: &str| {
        content
            .lines()
            .map(str::trim)
            .filter(|line| !line.starts_with('#'))
            .any(|line| !line.is_empty() && line.eq_ignore_ascii_case(domain))
    };
    listed(include_str!("disposable_domains.txt"))
        || extra_file
            .and_then(|p| std::fs::read_to_string(p).ok())
            .is_some_and(|content| listed(&content))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn aliases_and_disposable_domains() {
        assert_eq!(
            normalize(" A.B+x@GoogleMail.com ").unwrap(),
            ("a.b+x@googlemail.com".into(), "ab@gmail.com".into())
        );
        assert_eq!(normalize("ab@gmail.com").unwrap().1, "ab@gmail.com");
        assert_eq!(normalize("A+label@Example.org").unwrap().1, "a@example.org");
        assert!(domain_blocked("a@mailinator.com", None));
        let file = tempfile::NamedTempFile::new().unwrap();
        std::fs::write(file.path(), "custom.example\n").unwrap();
        assert!(domain_blocked("a@custom.example", Some(file.path())));
        for bad in [
            "missing",
            "a@@example.com",
            "a@localhost",
            "a b@example.com",
            ".a@example.com",
        ] {
            assert!(normalize(bad).is_err(), "{bad}");
        }
    }
}
