---
description: "Task list for Mensagem de entrada de membro no chat (077)"
---

# Tasks: Mensagem de entrada de membro no chat

**Input**: Design documents from `/specs/077-member-join-welcome/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Contract tests for join announce + invite channel validation (per plan) + `tsc --noEmit` + manual [quickstart.md](./quickstart.md).

**Organization**: Setup → Foundational (migration + system message model + resolve helper) → US1 announce on join → US2 invite channel → US3 template settings → US4 destination settings → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/migrations/`, `backend/src/domain/`, `backend/src/db/`, `backend/src/api/`, `backend/tests/contract/`, `frontend/src/pages/`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/lib/settingsAccess.ts`, `frontend/src/api/client.ts`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and join/message touch points.

- [x] T001 Confirm `.specify/feature.json` → `specs/077-member-join-welcome` and skim `accept_invite` / `emit_invite_consumed` in `backend/src/api/invites.rs` + `backend/src/api/auth/register.rs`, and message create path in `backend/src/api/messages.rs` / `backend/src/db/message.rs` against [research.md](./research.md)

**Checkpoint**: Understood post-join hook and E2EE constraint for system messages.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema + system message persistence + destination resolution — **blocks** all stories.

**⚠️ CRITICAL**: Complete before US1–US4 wiring.

- [x] T002 Add `backend/migrations/0019_member_join_welcome.sql`: `message.kind` + `content_plaintext` (+ nullable ciphertext/sender for system); `server.welcome_channel_id` + `welcome_message_template`; `invite.welcome_channel_id` per [data-model.md](./data-model.md)
- [x] T003 Extend `backend/src/domain/message.rs` and `backend/src/db/message.rs` for system vs user create/list (plaintext for system; skip mentions for system) per [contracts/join-welcome-message.md](./contracts/join-welcome-message.md)
- [x] T004 [P] Extend invite domain/DB/API types for `welcome_channel_id` in `backend/src/domain/invite.rs`, `backend/src/db/invite.rs` (create/read) 
- [x] T005 [P] Extend server domain/DB for welcome fields in server model + `backend/src/db/` server module (as used by servers API)
- [x] T006 Implement destination resolve + template render helper (owner channel → name `geral` → invite channel; default `Usuário {nome} acabou de entrar no canal`) in a BE module used by join (e.g. near `backend/src/api/auth/register.rs` or `backend/src/api/invites.rs`) per FR-004 and [research.md](./research.md) R3–R4

**Checkpoint**: Can insert a system message and resolve destination in isolation.

---

## Phase 3: User Story 1 - Anúncio automático ao entrar (Priority: P1) 🎯 MVP

**Goal**: On invite join, publish centered system welcome in `#geral` (or resolved destination); FE renders system rows; non-fatal on failure.

**Independent Test**: [quickstart.md](./quickstart.md) A (+ E).

### Implementation for User Story 1

- [x] T007 [US1] After successful invite membership (shared path with `emit_invite_consumed` in `backend/src/api/auth/register.rs` / `backend/src/api/invites.rs`), call announce helper: insert system message + WS `message.new`; swallow errors (FR-009); skip server-owner bootstrap join
- [x] T008 [US1] Ensure list/history APIs return system fields so FE can render without decrypt in `backend/src/api/messages.rs` (and DTO serialization)
- [x] T009 [US1] Render `kind === "system"` as centered background row in `frontend/src/pages/Channel.tsx` (+ types in `frontend/src/api/client.ts`); do not decrypt; no user msg-group chrome per [contracts/join-welcome-message.md](./contracts/join-welcome-message.md)
- [x] T010 [US1] Add styles for system welcome row in `frontend/src/styles/mesa-theme.css`
- [x] T011 [P] [US1] Contract test: accept invite with `geral` present → system message in that channel (`backend/tests/contract/`)

**Checkpoint**: Quickstart A passes; join still works if announce forced to fail (E).

---

## Phase 4: User Story 2 - Destino quando não existe `#geral` (Priority: P1)

**Goal**: Per-invite `welcome_channel_id` required at create when no owner destination and no `geral`; used only for that invite.

**Independent Test**: [quickstart.md](./quickstart.md) B.

### Implementation for User Story 2

- [x] T012 [US2] Validate create-invite in `backend/src/api/invites.rs`: require `welcome_channel_id` when resolve would need invite-level channel; persist on invite only per [contracts/invite-welcome-channel.md](./contracts/invite-welcome-channel.md)
- [x] T013 [US2] Sidebar invite create UI: when needed, require text-channel picker and send `welcome_channel_id` in `frontend/src/shell/Sidebar.tsx` (+ `frontend/src/api/client.ts`)
- [x] T014 [P] [US2] Contract tests: create invite without channel when required → 400; two invites different channels → announces per invite (`backend/tests/contract/`)

**Checkpoint**: Quickstart B passes.

---

## Phase 5: User Story 3 - Texto customizável pelo dono (Priority: P1)

**Goal**: Owner edits welcome template in server settings (`{nome}` required); always-on (no disable).

**Independent Test**: [quickstart.md](./quickstart.md) C.

### Implementation for User Story 3

- [x] T015 [US3] Owner GET/PATCH welcome settings (template) in `backend/src/api/servers.rs` (or dedicated module) enforcing `{nome}` per [contracts/server-welcome-settings.md](./contracts/server-welcome-settings.md)
- [x] T016 [US3] Add owner-only settings nav + page for template edit in `frontend/src/lib/settingsAccess.ts`, `frontend/src/shell/SettingsNav.tsx` / `App.tsx` routes, new page under `frontend/src/pages/` (e.g. `ServerWelcomePage.tsx`), wire `frontend/src/api/client.ts`
- [x] T017 [US3] Announce helper uses server template when set (render `{nome}`) in the BE helper from T006/T007
- [x] T018 [P] [US3] Contract test: owner patches template → next join uses new text; non-owner cannot patch (`backend/tests/contract/`)

**Checkpoint**: Quickstart C passes.

---

## Phase 6: User Story 4 - Destino configurável pelo dono (Priority: P2)

**Goal**: Owner sets `welcome_channel_id`; takes priority over `geral` and invite channel.

**Independent Test**: [quickstart.md](./quickstart.md) D.

### Implementation for User Story 4

- [x] T019 [US4] Include `welcome_channel_id` in owner welcome GET/PATCH in `backend/src/api/servers.rs` (validate text channel on server)
- [x] T020 [US4] Channel select on welcome settings page in `frontend/src/pages/` welcome settings page + client types
- [x] T021 [P] [US4] Contract test: owner destination overrides `geral` on join (`backend/tests/contract/`)

**Checkpoint**: Quickstart D passes; invite create no longer requires channel when owner destination set.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation and project docs.

- [x] T022 Confirm system messages skip mention/notif user paths in `backend/src/api/messages.rs` / announce helper (FR-010)
- [x] T023 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`
- [x] T024 Run relevant `cargo test --test contract` for 077 welcome/invite tests
- [x] T025 Walk [quickstart.md](./quickstart.md) A–E manually
- [x] T026 Update `docs/daily/2026-09-08.md` with Speckit implement subsection for 077
- [x] T027 Update `CHANGELOG.md` `[Unreleased]` for 077

**Checkpoint**: Feature ready for review.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T006)** → stories
- **US1** needs T002–T003, T006 (announce + FE render)
- **US2** needs T004 + US1 announce path (or T006/T007)
- **US3** needs T005 + announce using template
- **US4** extends US3 settings API/UI
- **Polish** last

### User Story Dependencies

```text
Foundation → US1 (system message on join + FE)
           → US2 (per-invite channel) [after create/accept plumbing]
           → US3 (template settings) → US4 (destination settings)
```

### Parallel Opportunities

- T004 ∥ T005 after T002
- T011 ∥ T009–T010 after BE announce works
- T014 ∥ T013 after T012
- T018 ∥ T016 after T015

### Suggested MVP

**T001–T011 (Foundation + US1)** — welcome appears in `#geral` on join with system UI; then US2–US4.

---

## Implementation Strategy

1. Migration + system message model + resolve/render helper.
2. Post-join announce + FE centered row (US1).
3. Per-invite channel create/accept (US2).
4. Owner template settings (US3) then destination (US4).
5. Contract tests, tsc, quickstart, daily, CHANGELOG.

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001 | 1 |
| Foundational | T002–T006 | 5 |
| US1 | T007–T011 | 5 |
| US2 | T012–T014 | 3 |
| US3 | T015–T018 | 4 |
| US4 | T019–T021 | 3 |
| Polish | T022–T027 | 6 |
| **Total** | | **27** |

**Format validation**: All tasks use `- [ ]`, Task ID, optional `[P]` / `[USn]`, and file paths.
