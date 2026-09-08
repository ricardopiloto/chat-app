---
description: "Task list for Paridade de edição nas permissões do canal (063)"
---

# Tasks: Paridade de edição nas permissões do canal

**Input**: Design documents from `/specs/063-channel-acl-edit-parity/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Contract tests per [channel-manage-authz.md](./contracts/channel-manage-authz.md); `tsc --noEmit`; [quickstart.md](./quickstart.md).

**Organization**: Setup → Foundational (unified manage + hierarchy-vs-creator) → US1 ACL → US2 FE UI → US4 delete → US5 subject hierarchy + rename → US3 semantics check → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US5]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/src/domain/permissions.rs`, `backend/src/api/channels.rs`, `backend/src/api/authz.rs`, `backend/tests/contract/`, `frontend/src/lib/capabilities.ts`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/components/ChannelAclPanel.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature dir and current auth mismatch (ACL vs rename/delete).

- [X] T001 Confirm `.specify/feature.json` → `specs/063-channel-acl-edit-parity` and skim `can_manage_channel_acl` / `can_rename_channel` in `backend/src/domain/permissions.rs`, `require_acl_manager` / `delete_channel` / `get_channel_access` in `backend/src/api/channels.rs`, and `canDeleteChannel` / `canRenameChannel` / permissions menu in `frontend/src/shell/Sidebar.tsx` against [research.md](./research.md)

**Checkpoint**: Baseline understood (ACL owner|creator; rename triad; delete BE has manage_channels, FE owner|creator).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Domain predicates for unified manage + hierarchy vs creator — **blocks** all stories.

**⚠️ CRITICAL**: No endpoint/UI work until helpers exist.

- [X] T002 Add `can_manage_channel(is_owner, is_creator, can_manage_channels, actor_pos, creator_pos) -> bool` in `backend/src/domain/permissions.rs` per [channel-manage-authz.md](./contracts/channel-manage-authz.md) (owner|creator|manage_channels∧actor_pos>creator_pos)
- [X] T003 [P] Add `can_acl_overwrite_subject(is_owner, is_creator, actor_pos, subject_pos) -> bool` in `backend/src/domain/permissions.rs` for FR-010(b) (everyone skipped at call site)
- [X] T004 Implement async helper in `backend/src/api/channels.rs` (or `authz.rs`) that loads server/channel/caps/positions and returns whether caller may manage the channel (reuse `position_for_account` / `aggregated_caps` / `effective_position`)

**Checkpoint**: Pure + async manage checks callable from handlers.

---

## Phase 3: User Story 1 - Gerir permissões com o mesmo direito (Priority: P1) 🎯 MVP

**Goal**: GET/PUT ACL authorized by unified gate (manage_channels + hierarchy vs creator).

**Independent Test**: [quickstart.md](./quickstart.md) A (permissions save) + C owner/creator; ManagerLow denied on ACL.

### Tests for User Story 1

- [X] T005 [P] [US1] Contract tests: manage_channels above creator can GET/PUT ACL; below creator 403; owner/creator still OK — in `backend/tests/contract/` per [channel-manage-authz.md](./contracts/channel-manage-authz.md); register in `backend/tests/contract/mod.rs`

### Implementation for User Story 1

- [X] T006 [US1] Replace `require_acl_manager` / `can_manage_channel_acl`-only checks in `backend/src/api/channels.rs` with the unified helper from T004 for `get_acl` and `put_acl`
- [X] T007 [US1] Keep existing PUT ACL validation (level/type, deny_view_public, membership) in `backend/src/api/channels.rs` unchanged aside from auth gate

**Checkpoint**: ManagerHigh can edit ACL; ManagerLow cannot; overwrite semantics untouched.

---

## Phase 4: User Story 2 - UI e servidor alinhados (Priority: P1)

**Goal**: Sidebar shows «Permissões do canal» only when manage gate passes (approx + API truth).

**Independent Test**: [quickstart.md](./quickstart.md) A/B/C menu visibility matches save success/failure.

### Implementation for User Story 2

- [X] T008 [US2] Add `canManageChannel(...)` (or extend helpers) in `frontend/src/lib/capabilities.ts` using owner ∪ creator ∪ `can_manage_channels` and role `position` when available per [channel-acl-ui.md](./contracts/channel-acl-ui.md)
- [X] T009 [US2] Wire context menu «Permissões do canal» in `frontend/src/shell/Sidebar.tsx` to `canManageChannel` instead of `canDeleteChannel` / owner-creator-only
- [X] T010 [P] [US2] Ensure `ChannelAclPanel` save errors surface 403 clearly via existing error path in `frontend/src/components/ChannelAclPanel.tsx` (no silent fail)

**Checkpoint**: Menu and API agree for the four profiles.

---

## Phase 5: User Story 4 - Apagar canal com o mesmo modelo (Priority: P1)

**Goal**: Delete uses unified gate + hierarchy; FE matches.

**Independent Test**: [quickstart.md](./quickstart.md) A delete + B blocked; last-of-type still 409.

### Tests for User Story 4

- [X] T011 [P] [US4] Contract tests: manage_channels above creator can DELETE (non-last); below creator 403; last_channel_of_type unchanged — in `backend/tests/contract/` per [channel-delete-parity.md](./contracts/channel-delete-parity.md)

### Implementation for User Story 4

- [X] T012 [US4] Route `delete_channel` in `backend/src/api/channels.rs` through unified manage helper (add FR-010a; keep last-of-type / last-channel conflicts)
- [X] T013 [US4] Align `canDeleteChannel` in `frontend/src/shell/Sidebar.tsx` with `canManageChannel` from T008

**Checkpoint**: Delete parity with permissions menu.

---

## Phase 6: User Story 5 - Hierarquia limita «Gerenciar canal» (Priority: P1)

**Goal**: Subject-level hierarchy on PUT ACL; inspect + rename use same channel gate.

**Independent Test**: [quickstart.md](./quickstart.md) B, D, E.

### Tests for User Story 5

- [X] T014 [P] [US5] Contract tests: PUT ACL targeting equal/higher role or member → 403 for non-owner/non-creator; inspect uses unified gate; rename/patch hierarchy — in `backend/tests/contract/` per [channel-manage-authz.md](./contracts/channel-manage-authz.md)

### Implementation for User Story 5

- [X] T015 [US5] In `put_acl` (`backend/src/api/channels.rs`), after channel gate, enforce `can_acl_overwrite_subject` for account/role entries (skip everyone)
- [X] T016 [US5] Align `get_channel_access` in `backend/src/api/channels.rs` to unified manage gate (FR-009; drop manage_roles-only shortcut unless also passing manage gate)
- [X] T017 [US5] Align `patch_channel` / rename auth in `backend/src/api/channels.rs` to unified helper (hierarchy on manage_channels path)
- [X] T018 [P] [US5] Align `canRenameChannel` in `frontend/src/shell/Sidebar.tsx` with `canManageChannel` so rename UI matches hierarchy

**Checkpoint**: FR-010 fully enforced; rename/inspect/ACL/delete share one model.

---

## Phase 7: User Story 3 - Restantes regras intactas (Priority: P2)

**Goal**: Confirm overwrite semantics and member view access unchanged.

**Independent Test**: [quickstart.md](./quickstart.md) smoke that public deny-view rule and private visibility still behave; ordinary members unchanged.

### Implementation for User Story 3

- [X] T019 [US3] Re-run / spot-check existing overwrite/deny_view_public contract coverage still passes after auth changes (`cargo test --test contract` filters for ACL/overwrite) — no semantic edits to resolve path in `backend/src/domain/permissions.rs`
- [X] T020 [P] [US3] Confirm member without manage caps still cannot open permissions UI in `frontend/src/shell/Sidebar.tsx`

**Checkpoint**: US3 acceptance scenarios hold.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Full validation and Speckit docs.

- [X] T021 Run `cargo test --test contract` and `cd frontend && ./node_modules/.bin/tsc --noEmit`; smoke [quickstart.md](./quickstart.md) A–E
- [X] T022 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup** → **Foundational** (blocks all)
- **US1** after Foundational (MVP ACL)
- **US2** after US1 (or after T004 if UI can ship against API) — prefer after T006
- **US4** after Foundational (can parallel US1 once T004 done; prefer after US1)
- **US5** after US1 (extends PUT + other endpoints)
- **US3** after US1–US5 auth changes
- **Polish** last

### User Story Dependencies

- **US1**: Foundational
- **US2**: US1 API (or T004) for meaningful E2E
- **US4**: Foundational (+ FE helper from US2 ideal)
- **US5**: US1 PUT path + Foundational subject helper T003
- **US3**: Verification after manage paths wired

### Parallel Opportunities

- T003 ∥ T002 after types agreed
- T005 ∥ T006 once helper stable
- T011 ∥ T012
- T014 tests ∥ T015–T017 carefully (same files → sequential for channels.rs)
- T018 ∥ backend US5 if Sidebar free
- T022 ∥ T021

### Parallel Example: After Foundational

```bash
Task: "Contract tests ACL manage gate in backend/tests/contract/"
Task: "Wire require_acl_manager to unified helper in backend/src/api/channels.rs"
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1–2 helpers  
2. Phase 3 ACL API + tests  
3. **STOP** — ManagerHigh can save ACL  
4. Then US2 UI → US4 delete → US5 hierarchy subjects/rename/inspect → US3 → polish  

### Incremental Delivery

1. Foundational predicates  
2. ACL parity (US1)  
3. Sidebar menu (US2)  
4. Delete parity (US4)  
5. Full hierarchy + rename/inspect (US5)  
6. Regression check (US3) + docs  

---

## Notes

- No DB migration  
- Prefer one helper for rename/ACL/delete/inspect  
- Creator always manages own channel; owner always; manage_channels needs `actor_pos > creator_pos`  
- Commit after each logical group when implementing
