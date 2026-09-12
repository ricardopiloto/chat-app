---
description: "Task list for 098-pip-above-topbar"
---

# Tasks: Floating PiP Above Top Bar

**Input**: Design documents from `/specs/098-pip-above-topbar/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/shell-stacking.md](./contracts/shell-stacking.md), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `cd frontend && npm run build`. No formal TDD in spec.

**Organization**: Setup → Foundational (inventory stacking) → **US1 stacking fix** → polish. CSS-first; portal menus only if CSS fails FR-006.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/styles/mesa-theme.css`, `frontend/src/styles/nocturne.css`, `frontend/src/shell/FloatingVoicePip.tsx`, `frontend/src/shell/TopBar.tsx`, `frontend/src/shell/AppShell.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and skim current z-index values against the contract.

- [X] T001 Confirm `.specify/feature.json` → `specs/098-pip-above-topbar` and note current `.topbar` / `.voice-pip` / `.topbar-notif-panel` / `.topbar-search-results` / `.account-menu` / `.dialog-backdrop` / `.context-menu-root` z-index values in `frontend/src/styles/mesa-theme.css` and `frontend/src/styles/nocturne.css` against [contracts/shell-stacking.md](./contracts/shell-stacking.md)

**Checkpoint**: Clear map of today’s stacking trap (topbar 50 &gt; pip 40).

---

## Phase 2: Foundational — inventory (Blocking)

**Purpose**: Confirm DOM nesting (menus inside `.topbar`) so the CSS escape plan is correct before editing.

**⚠️ CRITICAL**: Do not raise only `.voice-pip` without clearing the `.topbar` stacking-context trap (FR-006).

- [X] T002 Trace PiP mount and top-bar menu markup: `.voice-pip` from `frontend/src/shell/FloatingVoicePip.tsx` / `frontend/src/shell/AppShell.tsx`; notif/search/account panels under `frontend/src/shell/TopBar.tsx` — confirm menus are descendants of `.topbar` (research R2)
- [X] T003 Record target layer order to apply in CSS: dialogs (~100) ≥ context (~80) &gt; top-bar menus (≥70) &gt; `.voice-pip` (~55) &gt; `.topbar` chrome (`z-index: auto` / no trap) per [research.md](./research.md) R3 and [contracts/shell-stacking.md](./contracts/shell-stacking.md)

**Checkpoint**: Inventory complete; ready for US1 CSS edits.

---

## Phase 3: User Story 1 - PiP above top bar (Priority: P1) 🎯 MVP

**Goal**: Floating PiP paints and receives clicks above the top bar chrome; open top-bar menus still beat the PiP; dialogs stay on top; both themes.

**Independent Test**: [quickstart.md](./quickstart.md) US1 + open-menus section; SC-001–SC-003; SS-01–SS-04.

### Implementation for User Story 1

- [X] T004 [US1] Remove or set `.topbar` `z-index` to `auto` in `frontend/src/styles/mesa-theme.css` while keeping `position: relative` and `overflow: visible` (clear stacking-context trap; SS-01 + FR-006 prep)
- [X] T005 [US1] Raise `.voice-pip` `z-index` to the mid shell layer (~55) in `frontend/src/styles/mesa-theme.css` so PiP stacks above top bar chrome (SS-01, FR-001/002)
- [X] T006 [US1] Raise top-bar menu panels (`.topbar-notif-panel`, `.topbar-search-results`, `.account-menu` as used under topbar) to `z-index` ≥70 in `frontend/src/styles/mesa-theme.css` so open menus paint above PiP (SS-02, FR-006)
- [X] T007 [US1] Verify `.dialog-backdrop` / `.context-menu-root` remain above PiP (~100 / ~80); adjust only if broken in `frontend/src/styles/nocturne.css` and/or `frontend/src/styles/mesa-theme.css` (SS-03)
- [X] T008 [US1] Only if CSS cannot satisfy FR-006 after T004–T007: portal top-bar menus out of `.topbar` in `frontend/src/shell/TopBar.tsx` (and related) with fixed stacking ≥70; otherwise skip and note in tasks — **skipped** (CSS layer order sufficient)
- [X] T009 [US1] Run `cd frontend && npm run build`; execute [quickstart.md](./quickstart.md) (overlap, drag, controls, both themes, open menus, dialog regression)

**Checkpoint**: PiP usable over top bar; menus and dialogs correctly layered — MVP done.

---

## Phase 4: Polish & docs

**Purpose**: Docs after US1 green.

- [X] T010 [P] Update `docs/daily/2026-09-11.md` (or session date) Speckit implement subsection for 098-pip-above-topbar
- [X] T011 [P] Update `CHANGELOG.md` `[Unreleased]` Fixed entry for PiP above top bar
- [X] T012 Final sign-off: all required tasks `[X]` in `specs/098-pip-above-topbar/tasks.md`; quickstart regression checklist (corner memory, non-overlap top bar, narrow layout)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** → **Phase 3 (US1)** → **Phase 4**
- US1 is the only story; MVP = Phase 3 complete + build/quickstart green

### User Story Dependencies

- **US1**: After foundational inventory (T002–T003). No other stories.

### Parallel Opportunities

- Within US1: T004–T006 are sequential in the same CSS file (do in order); T007 can follow immediately; T008 only if needed
- Polish: T010 and T011 can run in parallel after T009

### Independent Test Criteria

| Story | Test |
|-------|------|
| US1 | Quickstart: PiP overlaps top bar → visible + drag + control click; menus above PiP; both themes; dialog still on top |

### Implementation Strategy

1. Inventory stacking (T001–T003)
2. CSS layer order (T004–T007); portal fallback only if needed (T008)
3. Build + manual quickstart (T009)
4. Daily + CHANGELOG (T010–T012)

**Suggested MVP**: T001–T009 (US1 stacking fix validated).
