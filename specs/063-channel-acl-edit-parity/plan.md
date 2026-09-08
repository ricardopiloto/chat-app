# Implementation Plan: Paridade de edição nas permissões do canal

**Branch**: `063-channel-acl-edit-parity` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/063-channel-acl-edit-parity/spec.md`

## Summary

Unificar autorização de **gestão de canal** (ACL/permissões + inspecção + apagar + alinhar rename) ao modelo **dono ∪ criador ∪ «Gerenciar canal»**, com **hierarquia** (FR-010) na via só-«Gerenciar canal»: posição estritamente acima do criador; sobrescritas não visam sujeitos ≥ actor. FE: menu «Permissões» / apagar deixam de depender só de dono/criador. Sem migração de schema.

## Technical Context

**Language/Version**: Rust 2021 (Axum); TypeScript / SolidJS (frontend).

**Primary Dependencies**: `backend/src/domain/permissions.rs`, `backend/src/api/channels.rs`, `backend/src/api/authz.rs`, `db/server_role` (`position_for_account`, `aggregated_caps`); FE `frontend/src/shell/Sidebar.tsx`, `frontend/src/components/ChannelAclPanel.tsx`, `frontend/src/lib/capabilities.ts` (se existir helper de caps).

**Storage**: N/A (authZ only; existing `position` / ACL tables).

**Testing**: `cargo test --test contract` (new/extended channel ACL + delete + inspect + rename hierarchy cases); `cd frontend && ./node_modules/.bin/tsc --noEmit`; [quickstart.md](./quickstart.md).

**Target Platform**: Mesa web app (self-hosted).

**Project Type**: Web app — `backend/` + `frontend/`.

**Performance Goals**: Extra position lookups O(1)–O(few) per manage request; no list-channel regression.

**Constraints**: FR-001–010 + clarificações; overwrite semantics unchanged; last-channel-of-type delete rules unchanged; role-permissions page out of scope.

**Scale/Scope**: Domain helper(s) + channel API gates + Sidebar UI gates; ~5–10 files; contract tests.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contract + quickstart |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Unified manage helper + hierarchy rules + API/UI contracts. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/063-channel-acl-edit-parity/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── channel-manage-authz.md
│   ├── channel-acl-ui.md
│   └── channel-delete-parity.md
└── spec.md
```

### Source Code (repository root)

```text
backend/src/domain/permissions.rs     # can_manage_channel_* + hierarchy helpers
backend/src/api/channels.rs           # require_acl_manager, put_acl subject checks, delete, inspect, patch/rename
backend/src/api/authz.rs              # reuse position / hierarchy patterns if helpful
backend/tests/contract/…            # ACL/delete/inspect/rename hierarchy cases
frontend/src/shell/Sidebar.tsx        # canDelete / permissões menu / align rename UI with hierarchy if exposed
frontend/src/lib/…                    # optional shared canManageChannel helper
frontend/src/components/ChannelAclPanel.tsx  # inspect remains; no semantic change
```

**Structure Decision**: Single domain predicate for “may manage this channel” (base triad + FR-010); wire ACL GET/PUT, delete, inspect, and rename/patch through it. FE mirrors with caps + creator/owner (hierarchy: prefer server truth on save; UI may approximate with role list positions when available).

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/channel-manage-authz.md](./contracts/channel-manage-authz.md)
- [contracts/channel-acl-ui.md](./contracts/channel-acl-ui.md)
- [contracts/channel-delete-parity.md](./contracts/channel-delete-parity.md)
- [quickstart.md](./quickstart.md)
