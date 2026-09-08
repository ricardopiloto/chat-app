# Implementation Plan: Paridade de permissionamento — Fase 1

**Branch**: `060-permissions-parity-phase1` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/060-permissions-parity-phase1/spec.md`

**Note**: Active feature forced via `.specify/feature.json` → `specs/060-permissions-parity-phase1` (git branch was unrelated / `main`). Clarifications 2026-09-08 integrated before plan.

## Summary

Fechar gaps Discord→Mesa da Fase 1: **posição hierárquica** nos perfis (gate kick/mute/assign/gestão de perfis), **overwrites Allow/Deny** por canal com camada **«todos os membros»** → perfil → membro (Deny de visualizar só em privados), e **explicação** nas negações + **ecrã admin de inspecção** membro×canal, tudo sobre um motor de decisão partilhado em `domain/permissions` + `api/authz`.

## Technical Context

**Language/Version**: Rust 2021 (Axum, sqlx/SQLite); TypeScript ~5.8 / SolidJS 1.9.

**Primary Dependencies**: `backend/src/domain/permissions.rs`, `channel_acl.rs`, `server_role.rs`; `api/authz.rs`, `roles.rs`, `mute.rs`, `channels.rs`, `messages.rs`, `voice.rs`; FE `ChannelAclPanel.tsx`, `RolesManagePage.tsx`, `MembersManagePage.tsx`, `MembersPanel.tsx`, `client.ts`, `lib/apiError.ts`.

**Storage**: SQLite migration **`0017_permissions_parity_phase1.sql`**: `server_role.position`; `channel_acl.effect`; `subject_type` inclui `everyone`; unique key alargada (ver [data-model.md](./data-model.md)).

**Testing**: `cargo test --test contract` (hierarchy, overwrites, explain/inspect, ACL migration regression); `tsc --noEmit`; [quickstart.md](./quickstart.md).

**Target Platform**: Instância Mesa self-hosted (browser SPA).

**Project Type**: Web app — `backend/` + `frontend/`.

**Performance Goals**: Resolução overwrite O(entradas do canal) tipicamente ≪ 100; listagem canais continua filtrada no SQL/serviço; inspect O(mesmo) por pedido.

**Constraints**: FR-001–010 + clarificações (Deny view private-only; inspect UI obrigatório; everyone layer; reorder só abaixo; novos perfis no fundo). Papel único (052). Sem categorias / multi-role / ADMINISTRATOR separado / ABAC.

**Scale/Scope**: Uma migração; evolução ACL + hierarchy APIs; painel ACL + reorder + inspect UI; contratos em `contracts/`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contract tests + quickstart |
| Complexity Tracking | Abaixo |

**Gate: PASS**

### Complexity Tracking

| Violation | Why needed | Simpler alternative rejected |
|-----------|------------|------------------------------|
| Allow/Deny + everyone + position | Spec/clarify exigem paridade Discord Fase 1 | Só hierarchy sem Deny — não cobre GM-secrets; só Deny sem everyone — rejeitado Q3 |
| Inspect UI nesta fase | Clarify Q2 | Só erros — rejeitado |

### Re-check pós-Phase 1

Motor único `AccessDecision` + migração aditiva (`effect=allow`) + três contratos. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/060-permissions-parity-phase1/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── gap-analysis.md
├── contracts/
│   ├── role-hierarchy.md
│   ├── channel-overwrites.md
│   └── access-explain.md
└── spec.md
```

### Source Code (repository root)

```text
backend/migrations/0017_permissions_parity_phase1.sql
backend/src/domain/permissions.rs          # AccessDecision; hierarchy helpers; overwrite resolve
backend/src/domain/channel_acl.rs          # effect; everyone subject
backend/src/domain/server_role.rs          # position on ServerRole
backend/src/db/channel_acl.rs              # load overwrites by layer
backend/src/db/server_role.rs              # position CRUD / reorder / create-at-bottom
backend/src/api/authz.rs                   # wire decision + denial codes
backend/src/api/roles.rs                   # reorder; hierarchy on assign/delete/edit
backend/src/api/mute.rs / roles kick       # hierarchy_denied
backend/src/api/channels.rs                # ACL PUT validation; inspect route
backend/src/api/messages.rs / voice.rs     # overwrite deny messages
backend/src/error.rs                       # optional `code` on ApiError
backend/tests/contract/…                   # hierarchy, overwrites, explain

frontend/src/api/client.ts                 # types effect/everyone/position; inspect helper
frontend/src/components/ChannelAclPanel.tsx
frontend/src/pages/RolesManagePage.tsx     # reorder
frontend/src/pages/MembersManagePage.tsx / MembersPanel.tsx
frontend/src/…                             # AccessInspect panel/page (settings or ACL)
frontend/src/lib/apiError.ts               # surface code-aware messages
```

**Structure Decision**: Extender ACL e papéis existentes; centralizar resolução em `permissions.rs`; UI evolui painéis actuais + ecrã inspect mínimo.

## Phase 0 / Phase 1 outputs

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| Contracts | [contracts/](./contracts/) |
| Quickstart | [quickstart.md](./quickstart.md) |

**Next**: `/speckit-tasks`
