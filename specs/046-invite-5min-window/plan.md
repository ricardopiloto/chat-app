# Implementation Plan: Janela de 5 minutos para códigos de convite

**Branch**: `046-invite-5min-window` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/046-invite-5min-window/spec.md`

## Summary

Alinhar convites ao produto: TTL padrão **300s** (env `DEFAULT_INVITE_TTL_SECS` ainda sobrepõe); **proibir permanentes**; teto fixo **10 usos** por código; invalidar convites legados na migração. Server-scope já correcto. UI do dono continua a omitir TTL (herda default). Contagem de usos em registo e accept.

## Technical Context

**Language/Version**: Rust 2021 (Axum, sqlx/SQLite); TypeScript / SolidJS (Sidebar invite dialog, Invite/Auth pages).

**Primary Dependencies**: `backend/src/api/invites.rs`, `auth/register.rs`, `db/invite.rs`, `domain/invite.rs`, `config.rs`; `frontend/src/shell/Sidebar.tsx`, `pages/Invite.tsx`.

**Storage**: SQLite — coluna `invite.use_count` (ou equivalente) + migração que revoga/expira convites activos existentes; default TTL config 300.

**Testing**: `cargo test --test contract` (invites + auth_register); smoke UI opcional [quickstart.md](./quickstart.md).

**Target Platform**: Instância Mesa self-hosted.

**Project Type**: Web app — `backend/` + `frontend/`.

**Performance Goals**: Incremento de uso atómico (sem oversell sob concorrência); rejeição de convite esgotado/expirado &lt; típico request.

**Constraints**: Clarificações 2026-09-06 — default 5 min + env; sem permanente; 10 usos; invalidar legados no deploy; bootstrap 1.ª conta intacto; sem max_uses configurável por convite.

**Scale/Scope**: Convites por servidor; N≤10 usos / 5 min por código novo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contract tests invites/register |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Migração + domínio `is_usable` + API create/accept/register + docs env. Sem LiveKit. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/046-invite-5min-window/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── invite-ttl-uses.md
└── spec.md
```

### Source Code (repository root)

```text
backend/migrations/0011_invite_use_count_and_legacy.sql
backend/src/config.rs                 # default_invite_ttl_secs → 300
backend/src/domain/invite.rs          # use_count; is_usable (+ max 10)
backend/src/db/invite.rs              # create/select/increment; revoke_all_active
backend/src/api/invites.rs            # reject permanent; usable checks; increment on accept
backend/src/api/auth/register.rs      # usable + increment on successful join
backend/tests/contract/invites.rs
backend/tests/contract/auth_register.rs
frontend/src/shell/Sidebar.tsx        # copy opcional “válido 5 min / até 10 usos”
frontend/src/pages/Invite.tsx         # mensagens expirado / esgotado
docs/operar-instancia.md / deploy     # DEFAULT_INVITE_TTL_SECS=300
```

**Structure Decision**: Persistir `use_count` na tabela `invite`; constante de produto `INVITE_MAX_USES = 10`; TTL default via config (300). Invalidação legada = `UPDATE … SET revoked_at = now` (ou `expires_at = now`) para convites ainda utilizáveis.

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/invite-ttl-uses.md](./contracts/invite-ttl-uses.md)
- [quickstart.md](./quickstart.md)
