---
description: "Task list for Nome de canal (32 / hífen) e cadeado à direita (072)"
---

# Tasks: Nome de canal (32 / hífen) e cadeado à direita

**Input**: Design documents from `/specs/072-channel-name-lock/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) A–E + `tsc --noEmit` + BE contract tests for name rules. No formal TDD beyond contracts in plan.

**Organization**: Setup → Foundational (`channelName` helper + BE validate) → US1 live normalize/cap → US2 lock layout → US3 create/rename parity polish → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/lib/channelName.ts`, `frontend/src/shell/Sidebar.tsx`, `frontend/src/styles/mesa-theme.css`, `backend/src/api/channel_provision.rs`, `backend/src/api/channels.rs`, `backend/tests/contract/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and current create/rename/lock touch points.

- [x] T001 Confirm `.specify/feature.json` → `specs/072-channel-name-lock` and skim create/rename inputs + lock placement in `frontend/src/shell/Sidebar.tsx` and `.channel-item` rules in `frontend/src/styles/mesa-theme.css` against [research.md](./research.md)

**Checkpoint**: Understood current lock-before-name layout and unbounded name inputs.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared normalize/validate helpers FE + BE — **blocks** story wiring.

**⚠️ CRITICAL**: Complete before US1–US3 input/BE work.

- [x] T002 Create `frontend/src/lib/channelName.ts` with `normalizeChannelNameDraft` (whitespace→`-`, truncate to 32 Unicode scalars) and `validateChannelName` (reject empty / only-`-`) per [data-model.md](./data-model.md) and [contracts/channel-name-normalize.md](./contracts/channel-name-normalize.md)
- [x] T003 [P] Add shared BE name normalize+validate (module fn or inline twin rules) used by create/patch — e.g. helper near `backend/src/api/channel_provision.rs` / small `channel_name` util — matching FE scalar count + rules in [contracts/channel-name-normalize.md](./contracts/channel-name-normalize.md)

**Checkpoint**: Helpers importable; no UI change yet.

---

## Phase 3: User Story 1 - Nome ≤32 e espaços → hífen (Priority: P1) 🎯 MVP

**Goal**: Live normalize + hard 32 while typing; reject invalid names on submit; BE enforces.

**Independent Test**: [quickstart.md](./quickstart.md) A–C.

### Implementation for User Story 1

- [x] T004 [US1] Wire create-channel name `onInput` (and emoji insert) in `frontend/src/shell/Sidebar.tsx` through `normalizeChannelNameDraft`; block submit via `validateChannelName` with clear PT error
- [x] T005 [US1] Wire rename draft `onInput` / emoji insert / `commitRename` in `frontend/src/shell/Sidebar.tsx` through the same helpers; seed rename draft via normalize when starting rename
- [x] T006 [US1] Call BE validate in `backend/src/api/channel_provision.rs` on create and in `backend/src/api/channels.rs` on PATCH `name` (normalize then reject invalid → 400)
- [x] T007 [P] [US1] Add/extend contract tests in `backend/tests/contract/` (e.g. `channel_rename.rs` or new module) for spaces rejected/normalized, >32 rejected, hyphen-only rejected

**Checkpoint**: Create/rename cannot persist spaces or >32; `---` rejected.

---

## Phase 4: User Story 2 - Cadeado à direita + fade (Priority: P1)

**Goal**: Private lock right-aligned; name under lock with soft fade; public unchanged.

**Independent Test**: [quickstart.md](./quickstart.md) D.

### Implementation for User Story 2

- [x] T008 [US2] Move private `IconLockClosed` to the **right** of the name (after name label / rename input) for text and voice rows in `frontend/src/shell/Sidebar.tsx` per [contracts/channel-lock-layout.md](./contracts/channel-lock-layout.md)
- [x] T009 [US2] Update `.channel-item` layout in `frontend/src/styles/mesa-theme.css`: name `flex:1; min-width:0; overflow:hidden` + fade/mask under lock zone; lock right-aligned/`absolute` so text paints under icon and nothing is readable to the right of the lock; public rows keep ellipsis without lock
- [x] T010 [P] [US2] Ensure renaming private row keeps lock on the right in `Sidebar.tsx` + CSS (`.channel-item-renaming`)

**Checkpoint**: Visual review matches SC-003/SC-004.

---

## Phase 5: User Story 3 - Paridade create/rename (Priority: P2)

**Goal**: Same rules on both flows (and text + voice) without drift.

**Independent Test**: [quickstart.md](./quickstart.md) E.

### Implementation for User Story 3

- [x] T011 [US3] Audit create modal + rename paths in `frontend/src/shell/Sidebar.tsx` share one helper path (no duplicate normalize); voice create uses same name field rules
- [x] T012 [US3] Confirm error copy for empty/hyphen-only is consistent on create vs rename in `Sidebar.tsx`

**Checkpoint**: Quickstart E passes for create and rename.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and project docs.

- [x] T013 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`
- [x] T014 Run relevant `cargo test --test contract` name-rule tests
- [x] T015 Walk [quickstart.md](./quickstart.md) A–E manually
- [x] T016 Update `docs/daily/2026-09-08.md` with Speckit implement subsection for 072
- [x] T017 Update `CHANGELOG.md` `[Unreleased]` for 072

**Checkpoint**: Feature ready for review.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T003)** → stories
- **US1** needs T002–T003
- **US2** can start after T001 (layout-only) but prefer after US1 if touching same `Sidebar.tsx` rows — serialize Sidebar edits: US1 then US2 then US3
- **US3** after US1 (parity audit)
- **Polish** last

### User Story Dependencies

```text
Foundation → US1 (normalize) → US3 (parity audit)
           → US2 (lock layout) [after/with Sidebar row edits]
```

### Parallel Opportunities

- T002 ∥ T003 (FE helper vs BE helper)
- T007 ∥ T004–T006 after T003 exists
- T009 ∥ T008 carefully (CSS vs DOM order)
- T013–T017 after code complete

### Suggested MVP

**T001–T007 (Foundation + US1)** — name rules working end-to-end; then US2 lock polish.

---

## Implementation Strategy

1. Shared FE + BE name helpers.
2. Wire create/rename + contract tests (US1).
3. Lock right + fade CSS (US2).
4. Parity audit (US3).
5. tsc, cargo test, quickstart, daily, CHANGELOG.

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001 | 1 |
| Foundational | T002–T003 | 2 |
| US1 | T004–T007 | 4 |
| US2 | T008–T010 | 3 |
| US3 | T011–T012 | 2 |
| Polish | T013–T017 | 5 |
| **Total** | | **17** |

**Format validation**: All tasks use `- [ ]`, Task ID, optional `[P]` / `[USn]`, and file paths.

---

## Phase 7: Convergence

**Purpose**: Close amendment gaps — clear lock reserve (FR-006) and no container horizontal scroll while editing (FR-009 / US4).

- [x] T018 [US2] Enlarge private-name **clear reserve** under/before the lock in `frontend/src/styles/mesa-theme.css` (`.channel-item-private` name/voice name + rename wrap padding/mask) so glyphs do not mix with the lock icon; fade MAY only in the reserved band per FR-006 / US2/AC2 / SC-003 (`partial`)
- [x] T019 [US4] Constrain create/rename name fields so typing ≤32 chars does **not** cause horizontal scroll of `.sidebar-nav` / channel row / form container in `frontend/src/styles/mesa-theme.css` and `frontend/src/shell/Sidebar.tsx` (wrap `flex:1; min-width:0; overflow:hidden`; input width capped; caret may scroll inside input) per FR-009 / US4 / SC-005 (`partial`)
- [x] T020 [P] Align `specs/072-channel-name-lock/contracts/channel-lock-layout.md` (+ quickstart visual notes if needed) with amended **reserva clara** + no-container-scroll editing rules (`partial`)
- [x] T021 Re-check quickstart D–E visually; run `cd frontend && ./node_modules/.bin/tsc --noEmit`; update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` for 072 amendment polish (`partial`)

