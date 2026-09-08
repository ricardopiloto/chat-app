---
description: "Task list for Renomear canais com hierarquia"
---

# Tasks: Renomear canais com hierarquia

**Input**: Design documents from `/specs/054-channel-rename/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Contratos backend para auth matrix + validação. UI: [quickstart.md](./quickstart.md) + `tsc --noEmit`.

**Organization**: Setup → Foundational (PATCH name + DB + client) → US1 criador UI → US2 dono → US3 gerir canais → US4 feedback → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/src/api/channels.rs`, `backend/src/db/channel.rs`, `backend/src/domain/permissions.rs`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/api/client.ts`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar feature e baseline PATCH só-visibilidade.

- [x] T001 Confirm `.specify/feature.json` points at `specs/054-channel-rename` and skim `patch_channel` / `PatchChannelBody` in `backend/src/api/channels.rs`, `canDeleteChannel` / channel row rendering in `frontend/src/shell/Sidebar.tsx`, and create-name trim in `backend/src/api/channel_provision.rs`

**Checkpoint**: Baseline understood; feature dir correcto.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: API + DB + client helper para `name` — **bloqueia** US1–US4.

**⚠️ CRITICAL**: Sem PATCH `name` + auth unificada, a UI não pode cumprir FR-009.

- [x] T002 Add `update_name` in `backend/src/db/channel.rs` (`UPDATE channel SET name = ? WHERE id = ?`)
- [x] T003 Extend `PatchChannelBody` with `name: Option<String>` and apply trim/non-empty validation + `update_name` in `backend/src/api/channels.rs` per [contracts/channel-rename-api.md](./contracts/channel-rename-api.md); keep existing visibility path
- [x] T004 Ensure rename auth in `backend/src/api/channels.rs` is owner **or** channel creator **or** `aggregated_caps.can_manage_channels` (reuse/`can_manage_channel_acl` + caps pattern from current `patch_channel`); optionally extract helper in `backend/src/domain/permissions.rs`
- [x] T005 [P] Add `patchChannel(channelId, { name })` (or extend existing patch helper) in `frontend/src/api/client.ts`
- [x] T006 [P] Add contract tests for rename success/403/400 (empty name; duplicate allowed) under `backend/tests/contract/` and register in `backend/tests/contract/mod.rs`

**Checkpoint**: Creator/owner/manage-channels can PATCH name; empty → 400; stranger → 403.

---

## Phase 3: User Story 1 - Criador renomeia o seu canal (Priority: P1) 🎯 MVP

**Goal**: Duplo-clique / duplo-toque no nome → edição inline → save para o criador.

**Independent Test**: [quickstart.md](./quickstart.md) A (+ E touch smoke).

### Implementation for User Story 1

- [x] T007 [US1] Add `canRenameChannel(c)` in `frontend/src/shell/Sidebar.tsx` (owner ∪ creator ∪ `can_manage_channels` via roles resource, mirroring backend)
- [x] T008 [US1] Implement inline rename state + dblclick handler on channel name labels (text and voice rows) in `frontend/src/shell/Sidebar.tsx` per [contracts/channel-rename-ui.md](./contracts/channel-rename-ui.md); Enter saves via `patchChannel`; Escape cancels
- [x] T009 [US1] Add double-tap (~300ms) on channel name for touch in `frontend/src/shell/Sidebar.tsx` without breaking single-tap navigation
- [x] T010 [P] [US1] Style inline rename input in `frontend/src/styles/mesa-theme.css`
- [x] T011 [US1] On successful rename, update local channels list / `refetchChannels` so Sidebar + active views show new name (FR-008)

**Checkpoint**: Channel creator renames via dblclick/dbltap; list updates.

---

## Phase 4: User Story 2 - Dono renomeia qualquer canal (Priority: P1)

**Goal**: Dono usa o mesmo UI para canais de outros.

**Independent Test**: [quickstart.md](./quickstart.md) B.

### Implementation for User Story 2

- [x] T012 [US2] Verify `canRenameChannel` treats `selected().owner_account_id === me.id` as always true in `frontend/src/shell/Sidebar.tsx`; adjust if owner-only edge cases fail with creator-only checks
- [x] T013 [US2] Confirm contract/owner path already covered by T006; extend test only if owner-renames-others missing in `backend/tests/contract/`

**Checkpoint**: Owner renames member-created channel.

---

## Phase 5: User Story 3 - Gerenciar canal pode renomear (Priority: P1)

**Goal**: Membro com `can_manage_channels` renomeia; sem permissão não edita.

**Independent Test**: [quickstart.md](./quickstart.md) C.

### Implementation for User Story 3

- [x] T014 [US3] Wire `canRenameChannel` to roles/`capabilities.can_manage_channels` + `member_ids` (same pattern as `canCreateChannels`) in `frontend/src/shell/Sidebar.tsx`
- [x] T015 [US3] Ensure unauthorized users do not enter saveable edit mode on dblclick/dbltap in `frontend/src/shell/Sidebar.tsx` (FR-005)

**Checkpoint**: Manage-channels member can rename; plain member cannot.

---

## Phase 6: User Story 4 - Nome inválido e feedback (Priority: P2)

**Goal**: Feedback claro; restaurar nome; duplicados OK.

**Independent Test**: [quickstart.md](./quickstart.md) D.

### Implementation for User Story 4

- [x] T016 [US4] On empty/invalid client or 400 from API, restore previous name and show error (toast or inline) in `frontend/src/shell/Sidebar.tsx`
- [x] T017 [US4] On 403 mid-edit, restore previous name and inform user in `frontend/src/shell/Sidebar.tsx`
- [x] T018 [US4] Blur behaviour: valid → save; invalid/empty → restore (no silent empty) in `frontend/src/shell/Sidebar.tsx`

**Checkpoint**: Invalid/forbidden paths never corrupt the displayed name.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Types, regressões, docs Speckit.

- [x] T019 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and `cargo test --test contract` filters for channel rename; smoke [quickstart.md](./quickstart.md) A–E
- [x] T020 [P] Update `docs/daily/2026-09-08.md` (criar se necessário) and `CHANGELOG.md` `[Unreleased]` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: Immediate
- **Foundational**: After Setup — **BLOCKS** all stories
- **US1**: After Foundational — MVP UI
- **US2 / US3**: Mostly verification on shared `canRenameChannel` after US1
- **US4**: After US1 inline path exists
- **Polish**: After desired stories

### User Story Dependencies

- **US1**: Needs T002–T005
- **US2**: Depends on US1 UI + owner flag
- **US3**: Depends on US1 UI + roles gate
- **US4**: Depends on US1 edit/save path

### Parallel Opportunities

- T005 ∥ T006 after T003
- T010 ∥ T008–T009
- T012–T013 ∥ T014–T015 after T007

---

## Parallel Example: After Foundational

```bash
Task: "T007 canRenameChannel in frontend/src/shell/Sidebar.tsx"
Task: "T010 Styles in frontend/src/styles/mesa-theme.css"
```

---

## Implementation Strategy

### MVP First (US1)

1. T001–T006 (API + tests + client)
2. T007–T011 (Sidebar inline for creator)
3. **STOP** — quickstart A
4. Then US2/US3 gates, US4 feedback, polish

### Incremental Delivery

1. Foundational → rename works via API
2. US1 → creator UX
3. US2/US3 → full hierarchy
4. US4 → polish validation UX
5. Docs

---

## Notes

- Suggested MVP: Foundational + US1.
- No DB migration expected.
- Format: all tasks use `- [ ]`, TaskID, optional `[P]` / `[Story]`, and file paths.
