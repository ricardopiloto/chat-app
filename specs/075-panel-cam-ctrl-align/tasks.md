---
description: "Task list for Controlo de câmara do painel — tamanho e alinhamento (075)"
---

# Tasks: Controlo de câmara do painel — tamanho e alinhamento

**Input**: Design documents from `/specs/075-panel-cam-ctrl-align/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) A–D; `cd frontend && npx tsc --noEmit` if TS touched. No new automated suite / TDD requested.

**Organization**: Setup → Foundational (CSS targeting inventory) → US1 height/split → US2 narrow center → US3 overflow → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/styles/mesa-theme.css`, `frontend/src/shell/UserPanel.tsx`, `frontend/src/shell/AppShell.tsx` (class toggles only — usually untouched)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Feature pointer and confirm current markup/CSS touch points.

- [X] T001 Confirm `.specify/feature.json` → `specs/075-panel-cam-ctrl-align` and skim `.user-panel-calls` / `.user-panel-cam-split` in `frontend/src/shell/UserPanel.tsx` + related rules in `frontend/src/styles/mesa-theme.css` against [research.md](./research.md) R1

**Checkpoint**: Know cascade conflict (global `.call-ctrl-split` 44px vs `.user-panel-ctrl` 32px).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish the CSS override strategy before story tweaks.

**⚠️ CRITICAL**: Do not change global stage `.call-ctrl-split` sizes used outside the user panel.

- [X] T002 Document (brief comment block or adjacent rules) the override target under `.user-panel .call-ctrl-split` / `.user-panel-cam-split` in `frontend/src/styles/mesa-theme.css` per [research.md](./research.md) R2 and [contracts/panel-call-ctrl-layout.md](./contracts/panel-call-ctrl-layout.md)
- [X] T003 Verify shell already sets both `stage-mode` and `channels-collapsed` on `.shell` in `frontend/src/shell/AppShell.tsx` (no API change expected); note selectors for US2/US3

**Checkpoint**: Ready to implement panel-scoped CSS without breaking stage chrome.

---

## Phase 3: User Story 1 - Câmara com o mesmo porte dos outros controlos (Priority: P1) 🎯 MVP

**Goal**: Camera (+ blur chevron) exterior height matches mic/deafen/leave (32×32 peers); keep compact horizontal split; blur still via chevron.

**Independent Test**: [quickstart.md](./quickstart.md) A–B.

### Implementation for User Story 1

- [X] T004 [US1] Override `.user-panel .call-ctrl-split` / `.user-panel-cam-split` in `frontend/src/styles/mesa-theme.css` so split exterior **height = 32px** (reset global `min-height: 44px` / padding on children) per FR-001 / FR-006
- [X] T005 [US1] Force camera main `.btn` / `.call-ctrl` inside `.user-panel-cam-split` to **32×32** (`min-width`/`width`/`padding`/`min-height`) in `frontend/src/styles/mesa-theme.css` so it matches `.user-panel-ctrl`
- [X] T006 [US1] Keep chevron **horizontal** and compact (same 32px height; narrow width ~18–22px) under `.user-panel-cam-split .call-ctrl-chevron` in `frontend/src/styles/mesa-theme.css` per FR-002 / FR-003; do not remove blur menu wiring in `frontend/src/shell/UserPanel.tsx`
- [X] T007 [US1] Confirm `CameraBlurMenu` still opens from chevron in `frontend/src/shell/UserPanel.tsx` / `frontend/src/components/CameraBlurMenu.tsx` (no long-press redesign)

**Checkpoint**: Quickstart A–B — same height as peers; blur menu still works.

---

## Phase 4: User Story 2 - Ícones centrados na coluna estreita (Priority: P1)

**Goal**: In stage + channels collapsed, center call control icons in the narrow column; with channels open, centering not required.

**Independent Test**: [quickstart.md](./quickstart.md) C (center) + D (wide optional).

### Implementation for User Story 2

- [X] T008 [US2] Add `.shell.stage-mode.channels-collapsed .user-panel-calls { justify-content: center; … }` in `frontend/src/styles/mesa-theme.css` per FR-004 / [research.md](./research.md) R3
- [X] T009 [US2] Neutralize `.user-panel-leave { margin-left: auto }` under the same narrow-column selector in `frontend/src/styles/mesa-theme.css` so leave does not sit alone on the far right
- [X] T010 [US2] Ensure wide / channels-expanded layout still allows leave `margin-left: auto` (no global removal of `.user-panel-leave` auto margin) in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Stage + collapsed → centered row; expanded → prior horizontal leave alignment OK.

---

## Phase 5: User Story 3 - Sem overflow da borda no painel estreito (Priority: P1)

**Goal**: Closed camera split border stays inside `.user-panel` when stage + channels collapsed; all controls fit width.

**Independent Test**: [quickstart.md](./quickstart.md) C (overflow).

### Implementation for User Story 3

- [X] T011 [US3] Ensure closed `.user-panel-cam-split` uses `box-sizing: border-box` and total width (cam + chevron + border) fits narrow panel content in `frontend/src/styles/mesa-theme.css` per FR-005 / R4
- [X] T012 [US3] If overflow remains after T011, tighten chevron width / `.user-panel-calls` gap / padding under `.shell.stage-mode.channels-collapsed` in `frontend/src/styles/mesa-theme.css` — prefer fitting over clipping speaking ring / open blur menu
- [X] T013 [US3] Verify speaking aura (`.user-panel-ctrl.is-speaking::before`) does not force camera split to grow or overflow in `frontend/src/styles/mesa-theme.css` / visual check; open blur menu MAY escape card

**Checkpoint**: Closed split border ⊆ user-panel; menu overlay escape allowed.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Regression, docs on implement.

- [X] T014 Visual sweep: stage chrome / non-panel `.call-ctrl-split` still at existing large size (no accidental global shrink) in `frontend/src/styles/mesa-theme.css`
- [X] T015 [P] Run `cd frontend && npx tsc --noEmit` if `UserPanel.tsx` or other TS changed; otherwise note CSS-only
- [X] T016 [P] Smoke [quickstart.md](./quickstart.md) A–D manually
- [X] T017 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when `/speckit-implement` completes

**Checkpoint**: Feature ready for implement completion report.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **BLOCKS** story CSS
- **US1 (Phase 3)**: After Foundational — height/split (MVP)
- **US2 (Phase 4)**: After US1 preferred (same CSS file; centering on correct sizes)
- **US3 (Phase 5)**: After US1 (fit depends on compact size); can refine with US2
- **Polish (Phase 6)**: After desired stories

### User Story Dependencies

- **US1 (P1)**: Foundational — size parity + horizontal split
- **US2 (P1)**: Best after US1 so centered row uses correct tile sizes
- **US3 (P1)**: Needs US1 compact width; validate with US2 narrow column

### Parallel Opportunities

- T015 ∥ T016 ∥ T017 on polish
- US2/US3 both edit `mesa-theme.css` → **sequential** on that file (do not parallelize conflicting CSS edits)

### Parallel Example: Foundational

```bash
# After T001: T002 CSS comment + T003 AppShell verify can be sequential quick checks
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1–2 → inventory + override strategy  
2. Phase 3 US1 → panel-scoped 32px camera split  
3. **STOP** — validate quickstart A–B  

### Incremental Delivery

1. US1 height/split  
2. US2 narrow centering  
3. US3 overflow fit  
4. Polish + daily/CHANGELOG on implement  

### Suggested MVP scope

**Foundational + US1** (T001–T007) — camera matches peers. Then US2 + US3 for full Done criteria.

---

## Notes

- Prefer **CSS-only**; touch `UserPanel.tsx` only if a class is required  
- Do **not** enlarge mic/deafen/leave to match old camera  
- Do **not** stack or remove blur chevron  
- Format validation: all tasks use `- [ ]`, `Tnnn`, optional `[P]`, story `[USn]` on story phases, concrete paths
