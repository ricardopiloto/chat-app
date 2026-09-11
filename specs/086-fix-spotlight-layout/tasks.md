---
description: "Task list for 086-fix-spotlight-layout"
---

# Tasks: Destaque de ecrã visível na Grade

**Input**: Design documents from `/specs/086-fix-spotlight-layout/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `tsc --noEmit`. No formal TDD suite requested.

**Organization**: Setup → Foundational (derive main/strip; remove span) → US1 main+bottom strip → US2 anti-hide verify → US3 strip multi-tile + unified restore → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/components/CameraGrid.tsx`, `frontend/src/styles/mesa-theme.css`, `frontend/src/pages/VoiceChannel.tsx` (only if needed)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and current broken span spotlight.

- [x] T001 Confirm `.specify/feature.json` → `specs/086-fix-spotlight-layout` and skim `tileStyle` span-2 + unified grid in `frontend/src/components/CameraGrid.tsx` against [research.md](./research.md) R1–R6

**Checkpoint**: Clear map of span crush to remove and dual layout to add.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Derive main/strip tile lists and stop span enlargement — **blocks** US1–US3.

**⚠️ CRITICAL**: Do not keep `grid-row: span 2` as the spotlight mechanism.

- [x] T002 In `frontend/src/components/CameraGrid.tsx`, add helpers to derive `mainTile` (screen with `accountId === spotlightId`) and `stripTiles` (remaining tiles: cameras first, then other screens) per [data-model.md](./data-model.md); if spotlight target missing, treat as unified mode
- [x] T003 Remove `tileStyle` / `grid-column`/`grid-row` span spotlight enlargement from `frontend/src/components/CameraGrid.tsx` (SL-07; research R1)

**Checkpoint**: CameraGrid can classify tiles for spotlight mode; no span-2 path remains.

---

## Phase 3: User Story 1 - Destacar torna o ecrã grande e visível (Priority: P1) 🎯 MVP

**Goal**: Spotlight-on Grade = main stage (highlighted screen) on top + bottom filmstrip.

**Independent Test**: [quickstart.md](./quickstart.md) §1; [contracts/spotlight-main-strip.md](./contracts/spotlight-main-strip.md) SL-01–SL-02, SL-04.

### Implementation for User Story 1

- [x] T004 [US1] When spotlight mode is active, render Grade in `frontend/src/components/CameraGrid.tsx` as main stage (spotlight screen tile with chip + attach) above a bottom strip container for other tiles; keep unified equal grid when spotlight is off (SL-01, SL-05, FR-009)
- [x] T005 [P] [US1] Add CSS for `.grade-stage-spotlight`, `.grade-spotlight-main`, and `.grade-spotlight-strip` (flex column; main majority height; strip compact bottom; `min-height: 0`) in `frontend/src/styles/mesa-theme.css` (SL-02; research R4)
- [x] T006 [US1] Ensure screen chips + spotlight toggle still work on the main screen tile in `frontend/src/components/CameraGrid.tsx`; preserve 085 `.grade-screen-tile` contain fit on main (SL-06, SL-08)

**Checkpoint**: Spotlight → large visible screen on top + cams in bottom strip; no ~8px crush.

---

## Phase 4: User Story 2 - Destaque não esconde o ecrã (Priority: P1)

**Goal**: Spotlight never shrinks the share into an unusable/hidden tile.

**Independent Test**: Quickstart §1 step 4; SL-04.

### Implementation for User Story 2

- [x] T007 [US2] Verify/adjust main-stage flex so spotlighted screen useful area is larger than pre-spotlight equal-grid cell in typical cams+share layouts; fix any CSS that could crush main in `frontend/src/styles/mesa-theme.css` / `CameraGrid.tsx` (SL-04, FR-003)

**Checkpoint**: Before/after spotlight, screen area grows (anti-hide).

---

## Phase 5: User Story 3 - Câmaras e partilha continuam utilizáveis (Priority: P2)

**Goal**: Strip shows remaining tiles; clearing spotlight restores 083 grid; multi-share / empty strip edge cases.

**Independent Test**: Quickstart §2–§4; SL-03, SL-05, SL-09.

### Implementation for User Story 3

- [x] T008 [US3] Render `stripTiles` in the bottom filmstrip in `frontend/src/components/CameraGrid.tsx` with same chip/attach patterns (cams + non-spotlight screens); omit strip when empty (SL-03, SL-09)
- [x] T009 [US3] Confirm clearing spotlight restores unified grid only (no leftover spotlight chrome) in `frontend/src/components/CameraGrid.tsx`; keep VoiceChannel `spotlightId` clear-on-stop behavior in `frontend/src/pages/VoiceChannel.tsx` if already correct (SL-05)

**Checkpoint**: Strip usable; off → 083 grid; solo screen has no empty strip.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Typecheck, regressions, mark tasks.

- [x] T010 [P] Confirm 085 contain/letterbox still applies to screen tiles in main and strip via existing `.grade-screen-tile` rules in `frontend/src/styles/mesa-theme.css` (SL-08; quickstart §5)
- [x] T011 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and fix errors from CameraGrid changes
- [x] T012 Manually walk [quickstart.md](./quickstart.md) scenarios 1–5; fix regressions
- [x] T013 [P] Mark completed tasks in `specs/086-fix-spotlight-layout/tasks.md` as work finishes (implement phase)

**Checkpoint**: Ready for `/speckit-implement` (daily + CHANGELOG on successful implement).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundation (T002–T003)** → US1
- **US1** (T004–T006): requires T002–T003
- **US2** (T007): after US1 layout exists
- **US3** (T008–T009): after US1 (strip + restore)
- **Polish**: after stories

### User Story Dependencies

```text
Foundation → US1 → US2 → US3 → Polish
```

### Parallel Opportunities

- T005 ∥ T004 once API shape known (CSS vs TSX; coordinate class names)
- T010 ∥ T011 after layout landed
- T013 ∥ T011–T012

### Parallel Example

```bash
# After T003:
# Dev A: T004–T006 CameraGrid main+strip + chips
# Dev B: T005 CSS stage-spotlight / main / strip
# Then T007 anti-hide, T008–T009 strip + restore, polish
```

### Independent Test Criteria

| Story | Test |
|-------|------|
| US1 | Quickstart 1 — main + bottom strip; screen readable |
| US2 | Quickstart 1.4 — area grows (anti-hide) |
| US3 | Quickstart 2–4 — restore grid; multi strip; solo |

### Suggested MVP

**Foundation + US1** (T002–T006) — main+strip visible spotlight. Next: US2 verify → US3 strip/restore → Polish.

---

## Implementation Strategy

1. Derive main/strip; delete span-2.
2. Render spotlight layout + CSS (MVP).
3. Confirm anti-hide; strip multi-tile + clear restores 083.
4. `tsc` + quickstart 1–5; implement updates daily + CHANGELOG.

---

## Notes

- Supersedes 083 span-enlarge spotlight approach only; unified grid when off unchanged.
- Format validation: all tasks use `- [ ]`, IDs T001–T013, story labels on US phases only, file paths in every description.
