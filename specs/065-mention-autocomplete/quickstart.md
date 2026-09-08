# Quickstart: 065-mention-autocomplete

## Prerequisites

- App a correr; ≥2 contas membros do mesmo servidor/canal de texto.
- Handles conhecidos (ASCII `[a-zA-Z0-9_]`, ≥2 chars).

## Commands

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
cd backend && cargo test --test contract mentions_replies -- --test-threads=1
# se mentionables API existir:
cd backend && cargo test --test contract mentionable -- --test-threads=1
```

## Scenarios

### A — Picker abre e selecciona (US1)

1. Conta A no canal → composer → digitar `@`.
2. **Expect**: lista com outros mentionables (sem A).
3. Escolher B → draft contém `@handle_B`.
4. Escape noutro `@` → lista fecha sem enviar.

### B — Filtro dinâmico (US2)

1. `@` → lista ampla → digitar prefixo do handle de B.
2. **Expect**: só matches; filtro vazio → estado vazio.
3. Seleccionar → `@handle` completo.

### C — Menção efectiva sem picker (US1b)

1. A digita manualmente `@handle_B` (handle exacto) e envia.
2. **Expect**: B vê **Menção** em Notificações; mensagem destacável para B (062).
3. Repetir via picker → mesmo resultado.

### D — Privado / self (clarify)

1. Canal privado: lista só quem vê o canal; A não aparece.
2. `@` + próprio handle à mão → envia sem notificação a A.

### E — Teclado (US3, opcional MVP+)

1. Picker aberto → setas + Enter confirma sem submit acidental da form.

## Pass criteria

- [ ] A–D OK; C deixa de ser «silencioso».
- [ ] `tsc` limpo; contract mentions (e mentionables se aplicável) OK.
