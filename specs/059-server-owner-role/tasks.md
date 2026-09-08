---
description: "Task list for Perfil automático Dono do servidor"
---

# Tasks: Perfil automático Dono do servidor

**Input**: Design documents from `/specs/059-server-owner-role/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Backend contract tests per [owner-role-bootstrap.md](./contracts/owner-role-bootstrap.md) and [owner-role-protection.md](./contracts/owner-role-protection.md). Frontend: `tsc --noEmit` + [quickstart.md](./quickstart.md).

**Organization**: Setup → Foundational (`is_system` + ensure helper) → US1 create bootstrap → US2 protection + read-only UI → US3 migration backfill → Polish (members picker + docs).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/migrations/0016_server_owner_role.sql`, `backend/src/domain/server_role.rs`, `backend/src/db/server_role.rs`, `backend/src/api/{servers,roles}.rs`, `backend/tests/contract/`, `frontend/src/api/client.ts`, `frontend/src/pages/{MembersManagePage,RolePermissionsPage,RolesManagePage}.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature dir and baseline create/roles paths.

- [X] T001 Confirm `.specify/feature.json` points at `specs/059-server-owner-role` and skim `create_server` in `backend/src/api/servers.rs`, role CRUD in `backend/src/api/roles.rs`, and role UI in `frontend/src/pages/{RolesManagePage,RolePermissionsPage,MembersManagePage}.tsx`

**Checkpoint**: Baseline understood.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema + domain/db for system **Dono** — **blocks** all stories.

**⚠️ CRITICAL**: Without `is_system` + ensure helper, bootstrap and migration cannot ship.

- [X] T002 Add migration `backend/migrations/0016_server_owner_role.sql`: `ALTER TABLE server_role ADD COLUMN is_system INTEGER NOT NULL DEFAULT 0` (backfill data can land in US3 / same file after helper exists — prefer column-only here if backfill SQL is written in T016)
- [X] T003 Extend `ServerRole` with `is_system: bool` and constant name `Dono` in `backend/src/domain/server_role.rs`; wire select/insert/update in `backend/src/db/server_role.rs`
- [X] T004 Implement `ensure_dono_role(pool, server_id, owner_account_id)` in `backend/src/db/server_role.rs` (create or reuse name `Dono`, set `is_system`, caps = `owner_all()`, assign owner via `set_member_role`)
- [X] T005 [P] Add `is_system?: boolean` to `ServerRole` in `frontend/src/api/client.ts`

**Checkpoint**: Migrated column; ensure helper callable from API.

---

## Phase 3: User Story 1 - Novo servidor já tem perfil Dono (Priority: P1) 🎯 MVP

**Goal**: Creating a server auto-creates **Dono** and assigns the creator.

**Independent Test**: [quickstart.md](./quickstart.md) A (create → Perfis shows Dono; roster under Dono).

### Tests for User Story 1

- [X] T006 [P] [US1] Add contract test: `POST /api/servers` then `GET …/roles` yields `Dono` with `is_system` and owner in `member_ids` in `backend/tests/contract/` per [owner-role-bootstrap.md](./contracts/owner-role-bootstrap.md); register in `backend/tests/contract/mod.rs`

### Implementation for User Story 1

- [X] T007 [US1] Call `ensure_dono_role` from `create_server` in `backend/src/api/servers.rs` after membership (+ channels) succeed
- [X] T008 [US1] Ensure role JSON serialization includes `is_system` from list/create/patch responses in `backend/src/domain/server_role.rs` / API (verify `GET /roles` after create)

**Checkpoint**: New servers show owner under **Dono** without manual setup.

---

## Phase 4: User Story 2 - Perfil Dono autoridade + protecção (Priority: P1)

**Goal**: Dono has full caps; cannot delete/rename/edit caps; cannot assign away from owner or to others; FE read-only + no delete.

**Independent Test**: [quickstart.md](./quickstart.md) B + [owner-role-protection.md](./contracts/owner-role-protection.md) / [owner-role-ui.md](./contracts/owner-role-ui.md).

### Tests for User Story 2

- [X] T009 [P] [US2] Add contract tests for delete/patch/create-name/`put_member_role` guards in `backend/tests/contract/` per [owner-role-protection.md](./contracts/owner-role-protection.md)

### Implementation for User Story 2

- [X] T010 [US2] Guard `delete_role`, `patch_role` (name + capabilities), `create_role` (reserved name `Dono`), and `put_member_role` (owner locked to system Dono; non-owner cannot take Dono) in `backend/src/api/roles.rs`
- [X] T011 [P] [US2] Make `RolePermissionsPage` read-only when `role.is_system` in `frontend/src/pages/RolePermissionsPage.tsx` (disable toggles + Save; short note)
- [X] T012 [P] [US2] Hide/disable delete for `is_system` roles in `frontend/src/pages/RolesManagePage.tsx`
- [X] T013 [P] [US2] On `MembersManagePage`, hide `is_system` roles from non-owner pickers and lock owner row to Dono in `frontend/src/pages/MembersManagePage.tsx` per [owner-role-ui.md](./contracts/owner-role-ui.md)

**Checkpoint**: Protections enforced API + UI; permissions viewable but not editable.

---

## Phase 5: User Story 3 - Servidores existentes ganham Dono (Priority: P2)

**Goal**: Backfill every existing server with system Dono and force-assign owner.

**Independent Test**: [quickstart.md](./quickstart.md) C; migration on fixture DB.

### Tests for User Story 3

- [X] T014 [P] [US3] Contract or migration-oriented test: after migrate, existing server without Dono gets system Dono + owner assigned (may use raw SQL setup in `backend/tests/contract/`) per [owner-role-bootstrap.md](./contracts/owner-role-bootstrap.md)

### Implementation for User Story 3

- [X] T015 [US3] Complete backfill in `backend/migrations/0016_server_owner_role.sql` (or companion migrate step): per server reuse/create `Dono`, set `is_system=1`, force caps, assign `owner_account_id` (clear prior role membership for owner)
- [X] T016 [US3] Optionally expose a Rust `ensure_dono` path usable from tests that mirrors migration semantics in `backend/src/db/server_role.rs` if SQL-only backfill is hard to assert — prefer single ensure helper used by create + verified by migrate

**Checkpoint**: Old servers consistent with new ones after migrate.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and Speckit docs.

- [X] T017 Run `cargo test --test contract` (owner_role filters) and `cd frontend && ./node_modules/.bin/tsc --noEmit`; smoke [quickstart.md](./quickstart.md) A–C
- [X] T018 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup** → **Foundational** (T002–T005)
- **US1**: After Foundational (needs ensure helper)
- **US2**: After US1 bootstrap exists (or after Foundational if tests seed via ensure); prefer after T007 so create path exists
- **US3**: After T003–T004 (same ensure / column); can parallel US2 after Foundational if migration SQL is independent
- **Polish**: After US1–US3

### User Story Dependencies

- **US1**: Foundational only
- **US2**: Benefits from US1 create path for fixtures; API guards independent once roles exist
- **US3**: Foundational + ensure semantics aligned with create

### Parallel Opportunities

- T005 ∥ T003 after column sketched
- T011 ∥ T012 ∥ T013 after `is_system` on client
- T006 ∥ T009 after API shapes known

---

## Parallel Example: After Foundational

```bash
Task: "T006 Bootstrap contract test"
Task: "T007 create_server ensure_dono"
Task: "T011 RolePermissions read-only UI"
```

---

## Implementation Strategy

### MVP First

1. Foundational T002–T005  
2. US1 T006–T008 (new servers work)  
3. US2 protections + FE  
4. US3 migration  
5. Polish  

Suggested stop after US1: every new server has visible **Dono**.

### Incremental Delivery

1. Schema + ensure  
2. Create-server bootstrap  
3. API/UI protection  
4. Backfill  
5. Docs  

---

## Notes

- Suggested MVP: Foundational + **US1**.
- Format: all tasks use `- [ ]`, TaskID, optional `[P]` / `[Story]`, and file paths.
- Constant role name: exact `Dono` (research R1–R2).
