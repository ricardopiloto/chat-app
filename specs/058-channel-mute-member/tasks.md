---
description: "Task list for Silenciar no canal e remoção de membro"
---

# Tasks: Silenciar no canal e remoção de membro

**Input**: Design documents from `/specs/058-channel-mute-member/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Backend contract tests for kick (account retained) and mute API/enforcement. Frontend: `tsc --noEmit` + [quickstart.md](./quickstart.md).

**Organization**: Setup → Foundational (migration + `can_mute_members` + mute DB) → US1 kick copy/contract → US2 mute API + send gate + panel UI → US3 unmute menu + composer → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/migrations/0015_channel_mute_and_cap.sql`, `backend/src/domain/server_role.rs`, `backend/src/db/{server_role,channel_mute}.rs`, `backend/src/api/{messages,mod}.rs`, `backend/src/api/mute.rs` (or channels), `frontend/src/api/client.ts`, `frontend/src/pages/{RolePermissionsPage,MembersManagePage,Channel}.tsx`, `frontend/src/components/MembersPanel.tsx`, `frontend/src/shell/AppShell.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature dir and baseline kick/caps.

- [X] T001 Confirm `.specify/feature.json` points at `specs/058-channel-mute-member` and skim `delete_member` in `backend/src/api/roles.rs`, `RoleCapabilities` in `backend/src/domain/server_role.rs`, kick copy in `frontend/src/components/MembersPanel.tsx` / `frontend/src/pages/MembersManagePage.tsx`, and `post_message` in `backend/src/api/messages.rs`

**Checkpoint**: Baseline understood.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema + capability plumbing — **blocks** mute stories (US2–US3). US1 can start in parallel after T001 for FE copy only.

**⚠️ CRITICAL**: Without migration + `can_mute_members` + mute table, mute API cannot ship.

- [X] T002 Add migration `backend/migrations/0015_channel_mute_and_cap.sql`: `server_role.can_mute_members` DEFAULT 0; table `channel_mute` per [data-model.md](./data-model.md)
- [X] T003 Extend `RoleCapabilities` (`can_mute_members`) in `backend/src/domain/server_role.rs` (`open_defaults`, `owner_all`, `or_with`) and wire insert/update/select/aggregate in `backend/src/db/server_role.rs`
- [X] T004 [P] Add `backend/src/db/channel_mute.rs` (upsert, get active, delete, optional list) and register in `backend/src/db/mod.rs`
- [X] T005 [P] Extend `RoleCapabilities` + `OPEN_ROLE_CAPABILITIES` in `frontend/src/api/client.ts`

**Checkpoint**: Migrated DB; caps round-trip; mute CRUD helpers callable from API layer.

---

## Phase 3: User Story 1 - Remover membro = só servidor (Priority: P1)

**Goal**: Prove and communicate kick never deletes account.

**Independent Test**: [quickstart.md](./quickstart.md) A.

### Tests for User Story 1

- [X] T006 [P] [US1] Add contract test that after `DELETE …/members/{id}`, account still exists / login works in `backend/tests/contract/` per [contracts/kick-membership-only.md](./contracts/kick-membership-only.md); register in `backend/tests/contract/mod.rs`

### Implementation for User Story 1

- [X] T007 [P] [US1] Update kick confirm copy to «Remover … do servidor» (never apagar conta) in `frontend/src/components/MembersPanel.tsx` and `frontend/src/pages/MembersManagePage.tsx`
- [X] T008 [US1] Audit `delete_member` in `backend/src/api/roles.rs` — ensure only `membership::delete` (no account delete); adjust only if a bug is found

**Checkpoint**: Kick retains account; UI wording correct.

---

## Phase 4: User Story 2 - Silenciar com duração (Priority: P1) 🎯 MVP mute

**Goal**: Authorized actors mute a member in a channel; target cannot send new messages there for the duration.

**Independent Test**: [quickstart.md](./quickstart.md) B + D.

### Tests for User Story 2

- [X] T009 [P] [US2] Add contract tests for PUT mute (presets/custom/403/400), POST message 403 while muted, other channel OK in `backend/tests/contract/` per [contracts/channel-mute-api.md](./contracts/channel-mute-api.md)

### Implementation for User Story 2

- [X] T010 [US2] Implement mute API handlers (`PUT`/`GET me`) in `backend/src/api/mute.rs` (or `channels.rs`) with authZ owner ∪ `can_mute_members`; validate duration; register routes in `backend/src/api/mod.rs`
- [X] T011 [US2] Reject `post_message` when active mute in `backend/src/api/messages.rs` (403 + clear message); do **not** block own edit/delete
- [X] T012 [US2] Add client helpers `putChannelMute` / `fetchMyChannelMute` in `frontend/src/api/client.ts`
- [X] T013 [US2] Add **Silenciar membros** toggle to `frontend/src/pages/RolePermissionsPage.tsx` (Geral)
- [X] T014 [US2] Pass active `channelId` into `MembersPanel` from `frontend/src/shell/AppShell.tsx` (from route/params)
- [X] T015 [US2] Add Silenciar action + duration presets/custom UI on member rows in `frontend/src/components/MembersPanel.tsx` when `channelId` set and actor may mute; hide for self/owner/unauthorized
- [X] T016 [P] [US2] Style mute duration dialog/menu in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Cap holder can mute; muted user cannot POST messages in that channel.

---

## Phase 5: User Story 3 - Estado, levantar, composer (Priority: P2)

**Goal**: Menu shows mute state + unmute; composer disabled with end time for muted user.

**Independent Test**: [quickstart.md](./quickstart.md) C.

### Implementation for User Story 3

- [X] T017 [US3] Add `DELETE` unmute handler in `backend/src/api/mute.rs` (same authZ as PUT); extend contract coverage if not in T009
- [X] T018 [US3] In `frontend/src/components/MembersPanel.tsx`, when target muted: show remaining time + **Levantar silêncio** calling DELETE
- [X] T019 [US3] In `frontend/src/pages/Channel.tsx`, fetch `/mutes/me` and **disable composer** with mute banner/ends_at; refetch on focus/interval or after unmute event
- [X] T020 [US3] Ensure expired mutes treated as inactive in DB helpers + composer (lazy expiry)

**Checkpoint**: Unmute restores send; muted user sees blocked composer.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, validation, docs Speckit.

- [X] T021 On successful kick, delete `channel_mute` rows for that account/server channels (or document lazy irrelevance) in `backend/src/api/roles.rs` / `db/channel_mute.rs`
- [X] T022 Run `cargo test --test contract` (kick + mute filters) and `cd frontend && ./node_modules/.bin/tsc --noEmit`; smoke [quickstart.md](./quickstart.md) A–D
- [X] T023 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup** → **Foundational** (T002–T005)
- **US1**: After T001; T006–T008 independent of mute table (can parallel Foundational)
- **US2**: After Foundational T002–T005
- **US3**: After US2 mute API + panel entry (T010–T015)
- **Polish**: After US1–US3

### User Story Dependencies

- **US1**: No dependency on mute
- **US2**: Needs Foundational
- **US3**: Needs US2 mute create + GET me

### Parallel Opportunities

- US1 (T006–T008) ∥ Foundational (T002–T005)
- T004 ∥ T005 after T003 sketched
- T012 ∥ T013 after T005
- T016 ∥ T015

---

## Parallel Example: After Foundational

```bash
Task: "T006 Kick contract test"
Task: "T007 Kick UI copy"
Task: "T010 Mute API handlers"
```

---

## Implementation Strategy

### MVP First

1. Foundational T002–T005
2. US2 T009–T015 (mute works end-to-end)
3. US3 composer + unmute
4. US1 copy/contract anytime in parallel
5. Polish + docs

Suggested stop point after US2: mute + send gate + panel Silenciar.

### Incremental Delivery

1. Caps + table  
2. API + message 403  
3. Panel mute UI  
4. Composer + unmute  
5. Kick clarity  

---

## Notes

- Suggested MVP: Foundational + **US2** (mute core); US1 is small and parallelizable.
- Format: all tasks use `- [ ]`, TaskID, optional `[P]` / `[Story]`, and file paths.
