---
description: "Task list for 084-user-panel-stack"
---

# Tasks: User Panel Stack for Control Overflow

**Input**: Design documents from `/specs/084-user-panel-stack/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/user-panel-stack.md](./contracts/user-panel-stack.md), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) Q1–Q5 + `tsc --noEmit`. No formal TDD / backend contracts (FE-only).

**Organization**: Setup → Foundational (DOM split + CSS tokens) → US1 readable name / measure → US2 stacked row + reflow → US3 account affordances → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/shell/UserPanel.tsx`, `frontend/src/styles/mesa-theme.css` (`.user-panel`, `.shell-nav`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and current panel structure.

- [x] T001 Confirm `.specify/feature.json` → `specs/084-user-panel-stack` and skim current single-row DOM/CSS in `frontend/src/shell/UserPanel.tsx` + `.user-panel` / `.shell-nav` in `frontend/src/styles/mesa-theme.css` against [research.md](./research.md) R2–R3

**Checkpoint**: Understood identity | calls (incl. settings) | flow height on grid row 2.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Restructure panel so Settings can stay with identity and call actions can move independently — **blocks** stack measure/CSS.

**⚠️ CRITICAL**: Complete before US1 measure / US2 stacked chrome.

- [x] T002 Move Settings out of `.user-panel-calls` so it lives in a main/identity row beside identity in `frontend/src/shell/UserPanel.tsx` (call actions remain leave/mic/deafen/cam/screen only) per [contracts/user-panel-stack.md](./contracts/user-panel-stack.md) UPS-03
- [x] T003 [P] Add CSS tokens `--user-panel-name-min: 6ch` and hysteresis buffer (e.g. `--user-panel-name-unstack: 7.5ch`) on `.user-panel` in `frontend/src/styles/mesa-theme.css` per [research.md](./research.md) R1/R4
- [x] T004 [P] Adjust `.user-panel` / `.user-panel-calls` / `.user-panel-settings` single-row flex so idle layout still matches Discord-like identity | actions | settings in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Settings not inside the call-actions group; single-row still looks correct; tokens present.

---

## Phase 3: User Story 1 - Display name stays readable (Priority: P1) 🎯 MVP

**Goal**: When single-row would crush the handle below min readable width, switch to stacked mode so the name stays recognizable.

**Independent Test**: [quickstart.md](./quickstart.md) Q1–Q2 (idle single-row; crowded → readable handle).

### Implementation for User Story 1

- [x] T005 [US1] Add stacked state + `ResizeObserver` (panel/handle) in `frontend/src/shell/UserPanel.tsx` that compares available name width to `--user-panel-name-min` / unstack threshold per [research.md](./research.md) R1 and [data-model.md](./data-model.md)
- [x] T006 [US1] Apply `.user-panel--stacked` (or equivalent) when measure says stack; ensure identity/`user-panel-handle` gets remaining main-row width with ellipsis (FR-009) in `frontend/src/shell/UserPanel.tsx` + `frontend/src/styles/mesa-theme.css`
- [x] T007 [US1] Verify idle/minimal icon set stays single-row (no gratuitous stack) for typical panel widths in `frontend/src/shell/UserPanel.tsx` (UPS-01, UPS-06 / SC-004)

**Checkpoint**: Crowded panel stacks and handle remains recognizable; idle stays one row.

---

## Phase 4: User Story 2 - Extra icon row above, centered (Priority: P1)

**Goal**: Stacked mode shows centered upper call actions; Settings + identity on lower row; panel height reflows shell-nav; returns to single-row when space allows.

**Independent Test**: [quickstart.md](./quickstart.md) Q2–Q5.

### Implementation for User Story 2

- [x] T008 [US2] Style `.user-panel--stacked` as column: upper `.user-panel-calls` full-width + `justify-content: center`; lower main row = identity + Settings in `frontend/src/styles/mesa-theme.css` (UPS-02, UPS-03)
- [x] T009 [US2] Confirm stacked height uses normal flow on `.shell-nav` row 2 (`auto`) with no absolute/fixed overlay over the channel list; fix CSS if needed in `frontend/src/styles/mesa-theme.css` (UPS-07 / FR-010)
- [x] T010 [US2] Ensure hysteresis unstacks cleanly (no empty upper row; no flicker) when leaving call / fewer icons in `frontend/src/shell/UserPanel.tsx` (UPS-06)
- [x] T011 [US2] Confirm call control click handlers unchanged when relocated to upper row in `frontend/src/shell/UserPanel.tsx` (UPS-05)

**Checkpoint**: Centered upper strip; Settings lower; channel list pushed up not covered; unstack works.

---

## Phase 5: User Story 3 - Stable identity affordances (Priority: P2)

**Goal**: Identity and Settings still open the account menu in both layouts.

**Independent Test**: [quickstart.md](./quickstart.md) Q3.

### Implementation for User Story 3

- [x] T012 [US3] Verify identity button + Settings both call `openAccount` / `AccountMenu` in single and stacked layouts in `frontend/src/shell/UserPanel.tsx` (UPS-08); fix wiring if DOM move broke anchors
- [x] T013 [P] [US3] Ensure `.user-panel .account-menu` positioning still opens above the panel in stacked mode in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Account menu opens from identity and Settings in both modes.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation and contract checklist.

- [x] T014 Run `npx tsc --noEmit` in `frontend/`
- [x] T015 [P] Walk [quickstart.md](./quickstart.md) Q1–Q5 and tick UPS-01…09 in [contracts/user-panel-stack.md](./contracts/user-panel-stack.md)
- [x] T016 [P] Update `docs/daily/yyyy-mm-dd.md` + `CHANGELOG.md` [Unreleased] when implement completes (per workspace changelog-and-daily rule)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **BLOCKS** US1–US3
- **US1 (Phase 3)**: After Foundational — MVP (measure + stack for readable name)
- **US2 (Phase 4)**: After US1 stacked class exists — polish placement + reflow
- **US3 (Phase 5)**: After Foundational DOM split (can follow US2)
- **Polish (Phase 6)**: After desired stories

### User Story Dependencies

- **US1 (P1)**: Foundational only
- **US2 (P1)**: Builds on US1 stacked state/CSS class
- **US3 (P2)**: Needs Settings/identity DOM from Foundational; verify after stack CSS stable

### Parallel Opportunities

- T003 ∥ T004 after T002 (or T004 after T002; T003 independent of T002)
- T013 ∥ T012 within US3
- T015 ∥ T016 in Polish (after T014)

### Parallel Example: Foundational CSS

```bash
# After T002 DOM split:
Task: "Add --user-panel-name-min tokens in mesa-theme.css"
Task: "Adjust single-row flex for identity | actions | settings in mesa-theme.css"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1–2 → Settings split + tokens  
2. Phase 3 → Measure + `.user-panel--stacked` frees name  
3. **STOP**: Q1–Q2 pass  

### Incremental Delivery

1. US2 → centered upper row + reflow + unstack  
2. US3 → account menu check  
3. Polish → tsc + quickstart + daily/CHANGELOG  

---

## Notes

- No backend tasks
- Do not move Settings into the upper centered strip
- Prefer one action-button tree; CSS/structure places it upper vs mid-row
- Exact `6ch` floor adjustable only if quickstart shows unreadable stubs
