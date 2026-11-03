pub struct Template {
    pub subject: String,
    pub html: String,
    pub text: String,
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
}
