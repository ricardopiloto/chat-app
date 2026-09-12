---
description: "Task list for 099-user-display-name"
---

# Tasks: User Display Name

**Input**: Design documents from `/specs/099-user-display-name/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `cargo test` (account/API) + `cd frontend && npm run build`. No formal TDD suite required beyond existing backend test patterns.

**Organization**: Setup → Foundational (migration + AuthAccount + helper) → **US1 settings** → **US2 user panel** → **US3 signed-in-as** → **US4 peer surfaces** → polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/migrations/`, `backend/src/domain/account.rs`, `backend/src/db/account.rs`, `backend/src/api/auth/`, `backend/src/api/channel_roles.rs`, `backend/src/domain/voice_occupancy.rs`, `backend/src/db/voice_occupancy.rs`, `backend/src/api/welcome.rs`, `frontend/src/api/client.ts`, `frontend/src/lib/displayName.ts`, `frontend/src/components/AccountMenu.tsx`, `frontend/src/shell/UserPanel.tsx`, `frontend/src/components/MembersPanel.tsx`, `frontend/src/pages/Channel.tsx`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/i18n/catalogs/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Lock feature pointer and skim current handle-only surfaces.

- [X] T001 Confirm `.specify/feature.json` → `specs/099-user-display-name` and skim `AuthAccount` / `AccountMenu` / `UserPanel` / members / `displayHandle` / occupancy against [research.md](./research.md) and [contracts/](./contracts/)

**Checkpoint**: Clear that today only `handle` exists; signed-in-as already uses handle.

---

## Phase 2: Foundational — storage + API + label helper (Blocking)

**Purpose**: Persist `display_name`, expose on auth account, shared FE label helper — **blocks** all user stories.

**⚠️ CRITICAL**: Do not ship UI that cannot persist or that renames `handle`.

- [X] T002 Add SQLite migration `backend/migrations/0021_account_display_name.sql` adding nullable `account.display_name TEXT`
- [X] T003 Extend `AccountRecord` / `AuthAccount` / DB `COLS` + `set_display_name` (trim → NULL; max 64) in `backend/src/domain/account.rs` and `backend/src/db/account.rs` ([data-model.md](./data-model.md))
- [X] T004 Add authenticated PATCH/PUT display-name route returning `AuthAccount` in `backend/src/api/auth/mod.rs` (ADN-01–03); ensure login/register/`/me` serialize `display_name`
- [X] T005 [P] Add FE types + `patchDisplayName` (or equivalent) in `frontend/src/api/client.ts`; add `publicDisplayLabel` helper in `frontend/src/lib/displayName.ts` (PDL-01)
- [X] T006 [P] Add i18n strings for display-name field (label/hint/error) in `frontend/src/i18n/catalogs/en.ts` and `frontend/src/i18n/catalogs/pt-BR.ts`

**Checkpoint**: Can persist/read `display_name` via API; helper ready for UI.

---

## Phase 3: User Story 1 - Set display name in settings (Priority: P1) 🎯 MVP

**Goal**: Account menu can create/edit/clear display name; username not editable; value persists.

**Independent Test**: [quickstart.md](./quickstart.md) US1; SC-001/SC-004/SC-005; [contracts/account-display-name.md](./contracts/account-display-name.md).

### Implementation for User Story 1

- [X] T007 [US1] Add display-name input + save/clear in `frontend/src/components/AccountMenu.tsx` (near avatar); call API; update local `me` account state; no username edit control (FR-001/002)
- [X] T008 [US1] Wire parent that owns `me` (e.g. AppShell / auth context consumers of AccountMenu) so saved `display_name` updates session account after PATCH
- [X] T009 [US1] Run backend validation tests if present (or add focused test for trim/NULL/max length) under `backend/`; `cd frontend && npm run build`; quickstart US1 set/clear/persist

**Checkpoint**: Settings write path works; MVP settings done.

---

## Phase 4: User Story 2 - User panel shows display name (Priority: P1)

**Goal**: User panel primary identity uses `publicDisplayLabel`.

**Independent Test**: Quickstart US2; SC-002/SC-003; PDL-02.

### Implementation for User Story 2

- [X] T010 [US2] Change user panel primary name (and related aria/initials as appropriate) to `publicDisplayLabel` in `frontend/src/shell/UserPanel.tsx` (FR-003/004)
- [X] T011 [US2] Verify truncation/ellipsis still works with long display names on the panel (CSS unchanged unless broken) in `frontend/src/styles/mesa-theme.css` / UserPanel
- [X] T012 [US2] `npm run build`; quickstart panel shows display name then falls back after clear

**Checkpoint**: Self chrome primary label correct.

---

## Phase 5: User Story 3 - Username only under «Ligado como» (Priority: P1)

**Goal**: Signed-in-as always shows handle when display name is set.

**Independent Test**: Quickstart US2/US3; SC-002; PDL-03.

### Implementation for User Story 3

- [X] T013 [US3] Confirm `account-menu-handle` / signed-in-as block always renders `props.me.handle` (not display name) in `frontend/src/components/AccountMenu.tsx` (FR-005/006)
- [X] T014 [US3] Manual check: with display name set, panel ≠ handle and signed-in-as = handle; document pass in quickstart run

**Checkpoint**: Self username placement locked.

---

## Phase 6: User Story 4 - Peers see display name (Priority: P2)

**Goal**: Member list, chat authorship, voice/presence (and welcome `{nome}`) use public label; mentions stay `@handle`.

**Independent Test**: Quickstart US4; SC-006; ADN-04; PDL-02/03.

### Implementation for User Story 4

- [X] T015 [US4] Extend `MemberView` + mentionables SQL/JSON with `display_name` in `backend/src/api/channel_roles.rs` (and related DB queries)
- [X] T016 [US4] Extend `OccupantView` + JOIN in `backend/src/domain/voice_occupancy.rs` / `backend/src/db/voice_occupancy.rs` with `display_name`
- [X] T017 [US4] Use public label for welcome `{nome}` in `backend/src/api/welcome.rs`; optionally LiveKit token name in `backend/src/api/voice.rs` (research R6)
- [X] T018 [P] [US4] Update FE types (`ServerMember`, occupancy, mentionables) in `frontend/src/api/client.ts`
- [X] T019 [US4] Apply `publicDisplayLabel` in `frontend/src/components/MembersPanel.tsx`, `frontend/src/pages/MembersManagePage.tsx` (and other member rows as needed)
- [X] T020 [US4] Apply `publicDisplayLabel` via handle maps / `displayHandle` in `frontend/src/pages/Channel.tsx`; keep `@handle` mention insert in `frontend/src/components/MentionPicker.tsx` / `frontend/src/lib/mentionParse.ts` (FR-010)
- [X] T021 [US4] Apply `publicDisplayLabel` in voice roster / Grade maps: `frontend/src/shell/Sidebar.tsx`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/components/CameraGrid.tsx` / `CallBank.tsx` as they consume handle maps
- [X] T022 [US4] Run `cargo test` + `npm run build`; quickstart two-browser peer check (members + chat; voice optional)

**Checkpoint**: Public Discord-style presentation complete.

---

## Phase 7: Polish & docs

**Purpose**: Docs after stories green.

- [X] T023 [P] Update `docs/daily/2026-09-11.md` (or session date) Speckit implement subsection for 099-user-display-name
- [X] T024 [P] Update `CHANGELOG.md` `[Unreleased]` Added/Changed entry for display name
- [X] T025 Final sign-off: all required tasks `[X]` in `specs/099-user-display-name/tasks.md`; quickstart regression (login handle, mentions, avatar)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** → **US1** → **US2** → **US3** → **US4** → **Polish**
- US2/US3 need US1 save path (or seeded API) to verify labels
- US4 needs foundational API fields on member/occupancy (T015–T016) after AuthAccount exists

### User Story Dependencies

- **US1**: After T002–T006. **MVP** (settings + persist).
- **US2**: After US1 (needs `me.display_name` in client state).
- **US3**: After US1; mostly verify AccountMenu (can parallel US2).
- **US4**: After foundational peer payload fields; can start T015–T016 once T003 done.

### Parallel Opportunities

- T005 ∥ T006 after T004
- T013 ∥ T010 (panel vs menu) after US1
- T015 ∥ T016 ∥ T017 (backend peer surfaces)
- T019 ∥ T020 ∥ T021 after T018
- T023 ∥ T024 after T022

### Independent Test Criteria

| Story | Test |
|-------|------|
| US1 | Set/clear/persist in account menu; no username edit |
| US2 | Panel primary = display name / fallback handle |
| US3 | Signed-in-as always handle |
| US4 | Peer members + chat (voice) show display name |

### Implementation Strategy

1. Migration + AuthAccount + PATCH + FE helper (T001–T006)
2. AccountMenu editor (T007–T009) — **MVP**
3. UserPanel + signed-in-as confirm (T010–T014)
4. Peer payloads + all label surfaces (T015–T022)
5. Daily + CHANGELOG (T023–T025)

**Suggested MVP**: T001–T009 (persist + settings). Ship US2/US3 before calling self-chrome done; US4 for full public scope.
