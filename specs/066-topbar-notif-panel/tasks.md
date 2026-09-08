---
description: "Task list for Painel de Notificações visível (066)"
---

# Tasks: Painel de Notificações visível sobre o topbar

**Input**: Design documents from `/specs/066-topbar-notif-panel/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `cd frontend && ./node_modules/.bin/tsc --noEmit`. No formal TDD requested.

**Organization**: Setup → Foundational (confirm clip cause) → US1 visibility CSS → US2 click-through → US3 no ghost / narrow → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/styles/mesa-theme.css`, `frontend/src/shell/TopBar.tsx` (only if CSS-only fix insufficient)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and clip root cause.

- [x] T001 Confirm `.specify/feature.json` → `specs/066-topbar-notif-panel` and skim `.topbar` / `.topbar-notif-panel` in `frontend/src/styles/mesa-theme.css` plus notif markup in `frontend/src/shell/TopBar.tsx` against [research.md](./research.md) R1

**Checkpoint**: Understood — panel clipped by `.topbar { overflow: hidden }`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Choose CSS strategy before story polish — **blocks** UI verification stories.

**⚠️ CRITICAL**: Prefer CSS-only; do not portal until overflow fix is proven insufficient.

- [x] T002 Decide overflow strategy for `frontend/src/styles/mesa-theme.css` per [research.md](./research.md) R2: `.topbar { overflow: visible }` and/or visible overflow on `.topbar-actions` / `.topbar-notif` while preserving rounded chrome as much as possible

**Checkpoint**: Clear CSS change plan; TopBar.tsx untouched unless later needed.

---

## Phase 3: User Story 1 - Ver a lista ao abrir Notificações (Priority: P1) 🎯 MVP

**Goal**: Open Notificações → panel fully visible, not clipped by topbar.

**Independent Test**: [quickstart.md](./quickstart.md) A.

### Implementation for User Story 1

- [x] T003 [US1] Apply overflow/stacking fix in `frontend/src/styles/mesa-theme.css` so `.topbar-notif-panel` paints outside the topbar box per [contracts/notif-panel-visibility.md](./contracts/notif-panel-visibility.md)
- [x] T004 [P] [US1] Ensure `.topbar-notif-panel` `z-index` / shadow remain sufficient above main content in `frontend/src/styles/mesa-theme.css` after overflow change
- [x] T005 [US1] If CSS-only still clips (verify visually), escalate minimally in `frontend/src/shell/TopBar.tsx` (portal/reparent) per [research.md](./research.md) R2 fallback — only if T003 fails

**Checkpoint**: Panel readable below button; not hidden behind/inside topbar clip.

---

## Phase 4: User Story 2 - Interagir com itens (Priority: P1)

**Goal**: Clicks reach list items; empty state also fully visible.

**Independent Test**: [quickstart.md](./quickstart.md) B.

### Implementation for User Story 2

- [x] T006 [US2] Confirm open panel items in `frontend/src/shell/TopBar.tsx` receive clicks (no opaque topbar layer intercepting); adjust CSS pointer-events/`z-index` in `frontend/src/styles/mesa-theme.css` only if needed
- [x] T007 [P] [US2] Spot-check empty-state copy visibility when no durable notifs / no unseen channels ([quickstart.md](./quickstart.md) B)

**Checkpoint**: Item click navigates per 062; empty message not clipped.

---

## Phase 5: User Story 3 - Sem regressão / viewport estreito (Priority: P2)

**Goal**: No ghost overlay; narrow viewport usable; other topbar controls OK.

**Independent Test**: [quickstart.md](./quickstart.md) C.

### Implementation for User Story 3

- [x] T008 [US3] Add `max-height` + `overflow-y: auto` on `.topbar-notif-panel` in `frontend/src/styles/mesa-theme.css` if long lists overflow the viewport (FR-005)
- [x] T009 [US3] Verify closed panel unmounts (existing `Show when={notifOpen()}` in `frontend/src/shell/TopBar.tsx`) — no residual hit-target; open/close does not break theme/brand controls
- [x] T010 [P] [US3] Spot-check light/dark + narrow window per [quickstart.md](./quickstart.md) C

**Checkpoint**: No ghost; scrollable if needed; chrome intact.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and Speckit docs.

- [x] T011 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and complete [quickstart.md](./quickstart.md) A–C
- [x] T012 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup** → **Foundational** → **US1** (MVP visibility)
- **US2** after US1 (clicks need visible panel)
- **US3** after US1 (narrow/ghost)
- **Polish** last

### User Story Dependencies

- **US1**: Foundational CSS strategy
- **US2**: US1 visibility
- **US3**: US1 visibility

### Parallel Opportunities

- T004 ∥ T003 (same CSS file → sequential preferred; mark careful)
- T007 ∥ T006
- T010 ∥ T008/T009
- T012 ∥ T011

### Parallel Example: After Foundational

```bash
Task: "Set .topbar overflow visible / notif panel escapes clip"
Task: "Confirm z-index of .topbar-notif-panel above main pane"
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1–2 confirm clip  
2. Phase 3 CSS overflow fix  
3. **STOP** — quickstart A  
4. Then US2 → US3 → polish  

### Incremental Delivery

1. Unclip panel  
2. Click-through check  
3. max-height + regression  
4. Docs  

---

## Notes

- No backend  
- Prefer not editing TopBar.tsx  
- Do not change notification data/062 semantics
