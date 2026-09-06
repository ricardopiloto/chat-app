# Data model: 027-auth-login-screen

Sem entidades de persistência novas. Estado UI de autenticação (já existente + apresentação):

| Concept | Role |
|---------|------|
| **Auth mode** | `login` \| `register` (abas + CTAs) |
| **Session unlock** | Sessão servidor presente → pedir senha para chaves locais |
| **Password visibility** | `password` \| `text` no input de senha |
| **Auth shell** | Chrome partilhado: brand pane + form pane |
| **Invite context** | Preview do servidor no form pane; mesmo shell |

## Transitions

```text
anonymous → login form ⇄ register form
         → submit login/register → authed shell

session-without-keys → unlock form → authed shell
invite link → invite form (register|accept) → authed shell
```

## Validation (unchanged)

- Handle + password min length / API errors — comportamento actual.
- Convite: regras `/api/invites/*` inalteradas.
