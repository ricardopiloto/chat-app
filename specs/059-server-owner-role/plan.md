# Implementation Plan: Perfil automático Dono do servidor

**Branch**: `059-server-owner-role` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/059-server-owner-role/spec.md`

## Summary

On server create (and via backfill migration), ensure a system role named **Dono** with full capabilities, assigned to the server owner. Protect it from delete/rename/cap edits and from assignment to non-owners. FE: read-only permissions page, hide Dono in other members’ role pickers, lock owner row.

## Technical Context

**Language/Version**: Rust (Axum/SQLx) + TypeScript / SolidJS.

**Primary Dependencies**: `create_server` (`backend/src/api/servers.rs`); `server_role` domain/db/API (`roles.rs`); `RoleCapabilities::owner_all()`; `MembersManagePage`, `RolePermissionsPage`, `RolesManagePage`; roster grouping in `MembersPanel`.

**Storage**: SQLite — migration `0016_*`: `server_role.is_system` (or equivalent); backfill create/reuse **Dono** per server + assign `owner_account_id`.

**Testing**: `cargo test` contracts (create server → Dono + assignment; protect delete/patch/assign; migration semantics); `tsc --noEmit`; [quickstart.md](./quickstart.md).

**Target Platform**: Mesa web app (settings Perfis / Membros + members roster).

**Project Type**: Web app (frontend + backend).

**Performance Goals**: Create-server path remains one transactional unit; migration O(servers).

**Constraints**: Name fixed **Dono**; ownership (`server.owner_account_id`) remains authZ source of truth for exclusive owner actions (FR-010); single role per member (052).

**Scale/Scope**: One system-role flag + create/migrate wiring + API guards + FE picker/permissions UX.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contratos + quickstart |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

`is_system` + name **Dono** + create/migrate justified by clarify. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/059-server-owner-role/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── owner-role-bootstrap.md
│   ├── owner-role-protection.md
│   └── owner-role-ui.md
└── spec.md
```

### Source Code (repository root)

```text
backend/migrations/0016_server_owner_role.sql
backend/src/domain/server_role.rs          # is_system; helpers name DONO / ensure
backend/src/db/server_role.rs              # persist is_system; find_system / ensure_dono
backend/src/api/servers.rs                 # after create: ensure Dono + assign owner
backend/src/api/roles.rs                   # guard delete/patch/put_member_role/create name
backend/tests/contract/…                   # owner role contracts

frontend/src/api/client.ts                 # ServerRole.is_system
frontend/src/pages/MembersManagePage.tsx   # hide Dono; lock owner row
frontend/src/pages/RolePermissionsPage.tsx # read-only when is_system
frontend/src/pages/RolesManagePage.tsx     # hide delete (and rename if any) for is_system
```

**Structure Decision**: Extend existing server_role pipeline; no new top-level module beyond helpers on `db::server_role`.

## Complexity Tracking

> None
