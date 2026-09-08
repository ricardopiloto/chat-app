---
description: "Task list for Atribuição de papéis na gestão de membros"
---

# Tasks: Atribuição de papéis na gestão de membros

**Input**: Design documents from `/specs/052-members-role-assignment/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal obrigatório. Incluir contratos backend smoke para papel único + presença. Validação: [quickstart.md](./quickstart.md) A–F + `tsc --noEmit` + `cargo test` contratos relevantes.

**Organization**: Setup → Foundational (migração + API papel único + presença) → US1 RolesPanel → US2 página Membros → US3 roster → US4 menu → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/migrations/`, `backend/src/db/server_role.rs`, `backend/src/api/roles.rs`, `backend/src/ws/mod.rs`, `frontend/src/components/RolesPanel.tsx`, `frontend/src/pages/MembersManagePage.tsx`, `frontend/src/components/MembersPanel.tsx`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/App.tsx`, `frontend/src/api/client.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar feature Speckit e baseline actual (multi-papel + RolesPanel com checkboxes).

- [X] T001 Confirm `.specify/feature.json` points at `specs/052-members-role-assignment` and skim `RolesPanel` member checkboxes, `set_role_members` in `backend/src/api/roles.rs`, `MembersPanel` flat list, and server header chrome in `frontend/src/shell/Sidebar.tsx`

**Checkpoint**: Baseline understood; feature dir correcto.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Migração papel único, API de atribuição, presença WS — **bloqueia** US1–US4.

**⚠️ CRITICAL**: Sem constraint + `aggregated_caps` single-role, a UI mente sobre capacidades.

- [X] T002 Add migration `backend/migrations/0014_single_role_per_member.sql`: backfill `server_id` on `server_role_member` (if needed), normalize multi-role rows per FR-011 (max active capability flags; tie → first `list_by_server` order), then `UNIQUE(server_id, account_id)` per [data-model.md](./data-model.md) / [research.md](./research.md) R1–R2
- [X] T003 Update `backend/src/db/server_role.rs`: helpers to set/clear a member’s single role; change `aggregated_caps` to one role (no OR across roles) per R3; keep owner path unchanged in callers
- [X] T004 Add `PUT /api/servers/{serverId}/members/{accountId}/role` in `backend/src/api/roles.rs` (or dedicated module) + route in `backend/src/api/mod.rs` per [contracts/single-role-assignment.md](./contracts/single-role-assignment.md); tighten `set_role_members` to enforce uniqueness
- [X] T005 [P] Expose online account set on `WsHub` in `backend/src/ws/mod.rs`; add `GET /api/servers/{serverId}/presence` (+ optional WS `presence` broadcast on connect/disconnect) per [contracts/presence-roster.md](./contracts/presence-roster.md)
- [X] T006 [P] Add frontend API helpers `setMemberRole` / `fetchServerPresence` in `frontend/src/api/client.ts`
- [X] T007 Add backend contract test(s) for single-role assign + migration uniqueness (and presence membership filter) under `backend/tests/contract/`

**Checkpoint**: Migration applies; assign API enforces one role; presence returns hub∩members.

---

## Phase 3: User Story 1 - Papéis do servidor só definem perfis (Priority: P1) 🎯 MVP

**Goal**: `RolesPanel` / Perfis = criar, permissões, apagar — **sem** atribuição de membros.

**Independent Test**: [quickstart.md](./quickstart.md) A.

### Implementation for User Story 1

- [X] T008 [US1] Remove member list / checkboxes / `setServerRoleMembers` / `fetch members` for assignment from `frontend/src/components/RolesPanel.tsx`; update copy to definição-only (FR-001)
- [X] T009 [US1] Confirm permissions navigation + create/delete still work from `frontend/src/components/RolesPanel.tsx` after stripping assignment UI

**Checkpoint**: Perfis sem controlos de membros.

---

## Phase 4: User Story 2 - Página «Membros» para atribuir papéis (Priority: P1)

**Goal**: Página de gestão com pesquisa e **um** papel por membro.

**Independent Test**: [quickstart.md](./quickstart.md) B–C.

### Implementation for User Story 2

- [X] T010 [US2] Create `frontend/src/pages/MembersManagePage.tsx`: list members, search/filter, single-role select (Sem papel ∪ roles), call `setMemberRole`, kick if authorized; gate owner/`can_manage_roles`
- [X] T011 [US2] Register route `/servers/:serverId/members` in `frontend/src/App.tsx` (pattern like role permissions + `returnTo`)
- [X] T012 [P] [US2] Add styles for manage page layout/search in `frontend/src/styles/mesa-theme.css`
- [X] T013 [US2] Wire `mesa:roles-changed` (or equivalent refetch) after role assign so Sidebar caps refresh

**Checkpoint**: Owner assigns/clears role for a member without opening RolesPanel assignment.

---

## Phase 5: User Story 3 - Painel «Membros» = presença por papel (Priority: P1)

**Goal**: Roster lateral Online → Offline, cada um agrupado por papel único.

**Independent Test**: [quickstart.md](./quickstart.md) D.

### Implementation for User Story 3

- [X] T014 [US3] Refactor `frontend/src/components/MembersPanel.tsx` to fetch roles + presence, render Online/Offline sections with role subgroups + «Sem papel» per [contracts/presence-roster.md](./contracts/presence-roster.md)
- [X] T015 [P] [US3] Style roster section headers/counts in `frontend/src/styles/mesa-theme.css`
- [X] T016 [US3] Keep kick controls for authorized actors only; **no** role-assignment UI in the panel (FR-005 / FR-007)

**Checkpoint**: Two sessions show correct Online/Offline grouping by role.

---

## Phase 6: User Story 4 - Menu do nome do servidor (Priority: P2)

**Goal**: Menu no nome do servidor: **Membros** + **Perfis**; convite no header.

**Independent Test**: [quickstart.md](./quickstart.md) E.

### Implementation for User Story 4

- [X] T017 [US4] Add server-name disclosure/menu in `frontend/src/shell/Sidebar.tsx` with **Membros** (navigate manage page) and **Perfis** (open RolesPanel) gated by owner/`can_manage_roles` per [contracts/server-menu-members-perfis.md](./contracts/server-menu-members-perfis.md)
- [X] T018 [US4] Keep invite control on existing header; remove or demote duplicate gear-only «Gerir papéis» if **Perfis** replaces it (prefer single entry)
- [X] T019 [P] [US4] Menu open/close a11y + styles in `frontend/src/shell/Sidebar.tsx` / `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Owner sees Membros+Perfis in menu; invite still on header; non-manager lacks management entries.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Types, regressões caps, docs Speckit.

- [X] T020 Audit callers of `aggregated_caps` / `member_ids.includes` (e.g. `frontend/src/shell/Sidebar.tsx`, ACL panels) still correct under single-role semantics
- [X] T021 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and relevant `cargo test` contract binaries; smoke [quickstart.md](./quickstart.md) A–E (F if multi-role seed available)
- [X] T022 [P] Update `docs/daily/2026-09-06.md` (secção 052) and `CHANGELOG.md` `[Unreleased]` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **BLOCKS** all stories
- **US1 (Phase 3)**: After Phase 2 (UI-only on RolesPanel; can start once assign API exists but does not require manage page)
- **US2 (Phase 4)**: After Phase 2 (needs assign API + client helpers)
- **US3 (Phase 5)**: After Phase 2 (needs presence API); benefits from roles list
- **US4 (Phase 6)**: After US1+US2 routes/dialogs exist (menu targets)
- **Polish (Phase 7)**: After desired stories

### User Story Dependencies

- **US1**: Independent after Foundational (strip RolesPanel)
- **US2**: Needs T004–T006; independent of US3
- **US3**: Needs T005–T006; independent of US2 UI
- **US4**: Needs US1 dialog + US2 route for menu targets

### Parallel Opportunities

- T005 ∥ T006 after T003 sketched
- T012 ∥ T010–T011
- T014–T016 can parallel US2 after Foundational
- T019 ∥ T017–T018 polish

---

## Parallel Example: After Foundational

```bash
# US1 strip assignment:
Task: "T008 Remove member checkboxes from frontend/src/components/RolesPanel.tsx"

# US3 roster (needs presence API):
Task: "T014 Refactor frontend/src/components/MembersPanel.tsx Online/Offline by role"

# US2 page (needs assign API):
Task: "T010 Create frontend/src/pages/MembersManagePage.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + Foundational assign path)

1. T001–T007 (migration, API, presence, client, contracts)
2. T008–T009 (RolesPanel clean)
3. **STOP** — quickstart A (+ assign via API/curl if page not ready)
4. Then US2 page → US3 roster → US4 menu → polish

### Incremental Delivery

1. Foundational → single-role truth in DB/API
2. US1 → Perfis definition-only
3. US2 → scalable assignment UI
4. US3 → social roster
5. US4 → discoverable menu
6. Docs + CHANGELOG

---

## Notes

- Suggested MVP for demo: Foundational + US1 + US2 (assignment without old checkboxes).
- Presence without WS broadcast may refetch on panel open (acceptable v1 if documented in implement notes).
- Format: all tasks use `- [ ]`, TaskID, optional `[P]` / `[Story]`, and file paths.
