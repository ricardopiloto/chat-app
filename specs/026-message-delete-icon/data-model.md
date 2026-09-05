# Data model: 026-message-delete-icon

Sem entidades de persistência. Controlo UI:

| Concept | Role |
|---------|------|
| **Message delete control** | Botão por mensagem (quando `canDeleteMessage`) |
| **Visible label** | Só ícone de lixeira (sem texto «Apagar») |
| **Hover tip** | `title` = «Apagar» |
| **Accessible name** | `aria-label` = «Apagar mensagem» (ou equivalente) |
| **Destructive soft accent** | Cor partilhada ícone + fundo + borda (vermelho claro) |

## State (unchanged from 011)

```text
hidden (no permission | no hover/focus)
  → visible on .msg-block:hover | :focus-within
  → click → confirm → delete | cancel
```
