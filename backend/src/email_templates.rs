pub struct Template {
    pub subject: String,
    pub html: String,
    pub text: String,
}

fn html_escape(value: &str) -> String {
    value
        .replace('&', "&amp;")
        .replace('<', "&lt;")
        .replace('>', "&gt;")
        .replace('"', "&quot;")
}

fn fragment_value(value: &str) -> String {
    let mut out = String::new();
    for byte in value.bytes() {
        if byte.is_ascii_alphanumeric() || b"-._~".contains(&byte) {
            out.push(byte as char);
        } else {
            out.push_str(&format!("%{byte:02X}"));
        }
    }
    out
}

pub fn recovery_with_key(base_url: &str, handle: &str, english: bool) -> Template {
    let link = format!(
        "{}/recover#handle={}",
        base_url.trim_end_matches('/'),
        fragment_value(handle)
    );
    let (subject, intro, action, reminder) = if english {
        ("Mesa password recovery", "A password recovery was requested for", "Open recovery with your recovery key", "Your recovery key is still required. This email cannot reset your password. If you did not request this, ignore it.")
    } else {
        ("Recuperação de senha do Mesa", "Foi solicitada uma recuperação de senha para", "Abrir recuperação com sua chave", "Sua chave de recuperação continua necessária. Este e-mail não redefine sua senha. Se não fez o pedido, ignore esta mensagem.")
    };
    let safe_handle = html_escape(handle);
    Template {
        subject: subject.into(),
        html: format!(
            "<p>{intro} @{safe_handle}.</p><p><a href=\"{}\">{action}</a></p><p>{reminder}</p>",
            html_escape(&link)
        ),
        text: format!("{intro} @{handle}.\n{action}: {link}\n{reminder}"),
    }
}

pub fn recovery_without_key(handle: &str, english: bool) -> Template {
    let (subject, intro, body) = if english {
        ("Mesa password recovery", "A password recovery was requested for", "This account has no recovery key. Ask the instance operator for a reset code. After signing in, create and save a recovery key in your account settings. If you did not request this, ignore this message.")
    } else {
        ("Recuperação de senha do Mesa", "Foi solicitada uma recuperação de senha para", "Esta conta não tem chave de recuperação. Peça um código de reset ao operador da instância. Depois de entrar, crie e guarde uma chave de recuperação nas configurações da conta. Se não fez o pedido, ignore esta mensagem.")
    };
    Template {
        subject: subject.into(),
        html: format!("<p>{intro} @{}.</p><p>{body}</p>", html_escape(handle)),
        text: format!("{intro} @{handle}.\n{body}"),
    }
}

pub fn recovery_completed(english: bool) -> Template {
    let (subject, body) = if english {
        ("Mesa password changed", "Your Mesa account password was reset. If you did not do this, contact the instance operator immediately.")
    } else {
        ("Senha do Mesa alterada", "A senha da sua conta Mesa foi redefinida. Se não foi você, entre em contato com o operador da instância imediatamente.")
    };
    Template {
        subject: subject.into(),
        html: format!("<p>{body}</p>"),
        text: body.into(),
    }
}

fn account_key_link(base_url: &str) -> String {
    format!("{}/account#recovery", base_url.trim_end_matches('/'))
}

pub fn key_welcome(base_url: &str, has_key: bool, english: bool) -> Template {
    let link = account_key_link(base_url);
    let (subject, greeting, guidance, action, safety, preference) = if english {
        (
            "Welcome to Mesa",
            "Welcome to Mesa.",
            if has_key { "Your account already has a recovery key. Keep your copy in a safe place." } else { "Create a recovery key in your account settings and save your copy in a safe place." },
            "Open account settings",
            "Mesa never receives or sends your recovery key. This email does not ask for your password or recovery code.",
            "You can change key reminder emails in your account settings.",
        )
    } else {
        (
            "Boas-vindas ao Mesa",
            "Boas-vindas ao Mesa.",
            if has_key { "Sua conta já tem uma chave de recuperação. Guarde sua cópia em um lugar seguro." } else { "Crie uma chave de recuperação nas configurações da conta e guarde sua cópia em um lugar seguro." },
            "Abrir configurações da conta",
            "O Mesa nunca recebe nem envia sua chave de recuperação. Este e-mail não pede sua senha nem seu código de recuperação.",
            "Você pode alterar os e-mails de lembrete nas configurações da conta.",
        )
    };
    Template {
        subject: subject.into(),
        html: format!("<p>{greeting}</p><p>{guidance}</p><p><a href=\"{}\">{action}</a></p><p>{safety}</p><p>{preference}</p>", html_escape(&link)),
        text: format!("{greeting}\n{guidance}\n{action}: {link}\n{safety}\n{preference}"),
    }
}

pub fn key_channel_reminder(base_url: &str, english: bool) -> Template {
    let link = account_key_link(base_url);
    let (subject, guidance, action, safety, preference) = if english {
        (
            "Save your Mesa recovery key",
            "You created a channel. Access to its messages depends on your identity and recovery key. Create and save a recovery key in your account settings.",
            "Open account settings",
            "Mesa never receives or sends your recovery key. This email does not ask for your password or recovery code.",
            "You can turn off key reminder emails in your account settings.",
        )
    } else {
        (
            "Guarde sua chave de recuperação do Mesa",
            "Você criou um canal. O acesso às mensagens dele depende da sua identidade e da chave de recuperação. Crie e guarde uma chave de recuperação nas configurações da conta.",
            "Abrir configurações da conta",
            "O Mesa nunca recebe nem envia sua chave de recuperação. Este e-mail não pede sua senha nem seu código de recuperação.",
            "Você pode desligar os e-mails de lembrete nas configurações da conta.",
        )
    };
    Template {
        subject: subject.into(),
        html: format!("<p>{guidance}</p><p><a href=\"{}\">{action}</a></p><p>{safety}</p><p>{preference}</p>", html_escape(&link)),
        text: format!("{guidance}\n{action}: {link}\n{safety}\n{preference}"),
    }
}

pub fn verification(base_url: &str, token: &str, english: bool) -> Template {
    let link = format!(
        "{}/register#email_token={token}",
        base_url.trim_end_matches('/')
    );
    let (subject, introduction, action, expiry) = if english {
        (
            "Confirm your email for Mesa",
            "Confirm your email to create your Mesa account.",
            "Open the registration form",
            "This link expires in 5 hours.",
        )
    } else {
        (
            "Confirme seu e-mail para o Mesa",
            "Confirme seu e-mail para criar sua conta no Mesa.",
            "Abrir formulário de cadastro",
            "Este link expira em 5 horas.",
        )
    };
    Template {
        subject: subject.into(),
        html: format!("<p>{introduction}</p><p><a href=\"{link}\">{action}</a></p><p>{expiry}</p>"),
        text: format!("{introduction}\n{action}: {link}\n{expiry}"),
    }
}

pub fn existing_account(english: bool) -> Template {
    let (subject, body) = if english {
        ("Mesa account already exists", "An account already uses this email address. Sign in with your handle and password. If you did not request this, you can ignore this message.")
    } else {
        ("Conta Mesa já existente", "Uma conta já usa este endereço de e-mail. Entre com seu nome de usuário e senha. Se você não pediu isso, pode ignorar esta mensagem.")
    };
    Template {
        subject: subject.into(),
        html: format!("<p>{body}</p>"),
        text: body.into(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn links_use_only_fragment_and_notice_has_no_registration_link() {
        for english in [false, true] {
            let template = verification("https://mesa.example", "abc123", english);
            assert!(template
                .text
                .contains("https://mesa.example/register#email_token=abc123"));
            assert!(!template.text.contains("?email_token="));
            assert!(!template.text.contains("/abc123"));
            let notice = existing_account(english);
            assert!(!notice.text.contains("register"));
            assert!(!notice.html.contains("email_token"));
        }
    }

    #[test]
    fn recovery_messages_never_carry_reset_authority() {
        for english in [false, true] {
            let with_key = recovery_with_key("https://mesa.example/", "a&b", english);
            assert!(with_key
                .text
                .contains("https://mesa.example/recover#handle=a%26b"));
            assert!(!with_key.text.contains("?handle="));
            assert!(!with_key.text.contains("email_token"));
            let without_key = recovery_without_key("alice", english);
            assert!(!without_key.text.contains("/recover"));
            let notice = recovery_completed(english);
            assert!(!notice.text.contains("http"));
        }
    }

    #[test]
    fn key_reminder_templates_only_link_to_account_and_carry_no_key_material() {
        for english in [false, true] {
            for template in [
                key_welcome("https://mesa.example/", false, english),
                key_welcome("https://mesa.example/", true, english),
                key_channel_reminder("https://mesa.example/", english),
            ] {
                assert!(template.text.contains("https://mesa.example/account#recovery"));
                assert!(template.html.contains("https://mesa.example/account#recovery"));
                assert_eq!(template.text.matches("https://").count(), 1);
                assert_eq!(template.html.matches("https://").count(), 1);
                assert!(!template.text.contains("email_token="));
                assert!(!template.text.contains("recovery_vault"));
                assert!(!template.text.contains("identity_pubkey"));
                assert!(!template.text.contains("channel_key_sealed"));
                assert!(!template.text.contains("secret-sentinel"));
                assert!(if english { template.text.contains("never receives or sends") } else { template.text.contains("nunca recebe nem envia") });
            }
        }
    }
}
