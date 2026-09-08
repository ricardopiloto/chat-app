# Quickstart: 052-members-role-assignment

## Prerequisites

- Backend + frontend running (`cargo run`, `npm run dev`)
- Migration `0014` applied (auto on boot)
- Two accounts: Owner O, Member M; optional third account for presence

## Setup checks

```bash
cd backend && cargo test --test contract permissions_role_capabilities_patch_and_invite_gate -- --nocapture
# plus new single-role / presence contract tests when added
cd frontend && ./node_modules/.bin/tsc --noEmit
```

## Scenarios

### A — Perfis só definem papéis

1. O: menu nome do servidor → **Perfis**.
2. Criar papel; abrir Permissões; fechar.
3. **Expect**: sem checkboxes de membros.

### B — Atribuir papel único

1. O: menu → **Membros** → página gestão.
2. Pesquisar M; atribuir papel P; confirmar.
3. **Expect**: M tem capacidades de P; não aparece em outro papel.

### C — Trocar / limpar papel

1. Atribuir outro papel ou «Sem papel».
2. **Expect**: capacidades actualizam; SC unicidade.

### D — Roster Online/Offline

1. O e M ligados (WS); abrir painel **Membros** no canal.
2. **Expect**: ambos sob **Online**, agrupados por papel.
3. Terminar sessão de M; refrescar presença.
4. **Expect**: M sob **Offline**.

### E — Menu e convite

1. O: menu tem **Membros** + **Perfis**; ícone/controlo de **Convite** no header.
2. M sem `can_manage_roles`: sem entradas de gestão.

### F — Migração (se DB de teste com multi-papel)

1. Seed account com 2 papéis; subir com `0014`.
2. **Expect**: um papel restante = FR-011 (mais flags; empate → ordem listagem).

## Done when

- A–E OK (+ F se aplicável)
- `tsc --noEmit` limpo
- Contratos backend relevantes verdes
