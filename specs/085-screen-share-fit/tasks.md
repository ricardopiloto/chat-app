---
description: "Task list for 085-screen-share-fit"
---

# Tasks: Partilha de ecrã sem o «zoom» das câmaras

**Input**: Design documents from `/specs/085-screen-share-fit/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `tsc --noEmit`. No formal TDD suite requested.

**Organization**: Setup → Foundational (confirm screen tile class) → US1 show-all fit → US2 local preview → Polish (spotlight + typecheck).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US2]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/styles/mesa-theme.css`, `frontend/src/components/CameraGrid.tsx`, `frontend/src/pages/VoiceChannel.tsx` (only if attach path fails to inherit), `frontend/src/voice/VoiceSession.tsx` (fallback only)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and current cover rule on Grade videos.

- [x] T001 Confirm `.specify/feature.json` → `specs/085-screen-share-fit` and skim `.slot-media video { object-fit: cover }` plus `.grade-screen-tile` in `frontend/src/styles/mesa-theme.css` / `frontend/src/components/CameraGrid.tsx` against [research.md](./research.md) R1–R6

**Checkpoint**: Clear map of the cover rule to override and the screen-tile class to target.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ensure screen cells are identifiable for CSS — **blocks** US1–US2.

**⚠️ CRITICAL**: Do not change camera cover globally.

- [x] T002 Verify Grade screen slots render with class `grade-screen-tile` (and camera slots do not) in `frontend/src/components/CameraGrid.tsx`; fix only if the class is missing so CSS can target screen videos per [data-model.md](./data-model.md)

**Checkpoint**: Screen tiles are selectable via `.grade-screen-tile` without affecting camera tiles.

---

## Phase 3: User Story 1 - Ver o ecrã completo no tile (Priority: P1) 🎯 MVP

**Goal**: Grade screen tiles show the full shared frame (`contain`) with neutral dark letterbox; cameras stay fill/crop.

**Independent Test**: [quickstart.md](./quickstart.md) §1; [contracts/grade-screen-fit.md](./contracts/grade-screen-fit.md) SF-01–SF-03, SF-07.

### Implementation for User Story 1

- [x] T003 [US1] Add CSS under `.grade-screen-tile` in `frontend/src/styles/mesa-theme.css` so screen `.slot-media video` uses `object-fit: contain`, centered, with neutral dark / slot-like letterbox background; leave global camera `.slot-media video` on `cover` (SF-01–SF-03, SF-07; research R1/R4)
- [x] T004 [P] [US1] Confirm no horizontal mirror (`scaleX(-1)` or equivalent) applies to Grade screen videos in `frontend/src/styles/mesa-theme.css` (and CameraGrid markup if any); exclude `.grade-screen-tile` if a shared rule would flip screen content (SF-07)

**Checkpoint**: Remote screen tile shows full frame + dark letterbox; camera tiles still crop-to-fill.

---

## Phase 4: User Story 2 - Pré-visualização local coerente (Priority: P2)

**Goal**: Local sharer screen preview in Grade uses the same show-all fit as remotes.

**Independent Test**: Quickstart §2; SF-04.

### Implementation for User Story 2

- [x] T005 [US2] Verify local screen `<video>` attaches inside a `.grade-screen-tile .slot-media` node via `frontend/src/pages/VoiceChannel.tsx` (`screen:` tile key) / `frontend/src/voice/VoiceSession.tsx`; if styles do not apply, add a minimal class or style only on the screen video element (prefer CSS inheritance first) (SF-04; research R3)

**Checkpoint**: Sharer’s own screen tile matches remote show-all behavior.

---

## Phase 5: Polish & Cross-Cutting

**Purpose**: Spotlight, regressions, mark tasks.

- [x] T006 [P] Confirm spotlight-enlarged screen tiles still use contain/letterbox (no cover regression) via existing `.grade-screen-tile` rules in `frontend/src/styles/mesa-theme.css` (quickstart §3; SF-05)
- [x] T007 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and fix any errors from CameraGrid/VoiceChannel touches
- [x] T008 Manually walk [quickstart.md](./quickstart.md) scenarios 1–5 (multi-share §4 + Composition/PiP out-of-scope §5); fix regressions
- [x] T009 [P] Mark completed tasks in `specs/085-screen-share-fit/tasks.md` as work finishes (implement phase)

**Checkpoint**: Ready for `/speckit-implement` (daily + CHANGELOG on successful implement).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundation (T002)** → US1
- **US1** (T003–T004): requires T002
- **US2** (T005): after US1 CSS exists (inherits same rules)
- **Polish**: after US1 (US2 ideally done)

### User Story Dependencies

```text
Foundation → US1 → US2 → Polish
```

### Parallel Opportunities

- T004 ∥ T003 once T002 done (CSS vs mirror audit; same file — prefer sequential if both edit `mesa-theme.css`)
- T006 ∥ T007 after US1 CSS landed
- T009 ∥ T007–T008

### Parallel Example

```bash
# After T002:
# Dev: T003 CSS contain+letterbox, then T004 mirror check in mesa-theme.css
# Then T005 verify local attach inheritance
# Polish: T006 spotlight + T007 tsc + T008 quickstart
```

### Independent Test Criteria

| Story | Test |
|-------|------|
| US1 | Quickstart 1 — full screen frame; cams still cover |
| US2 | Quickstart 2 — local preview show-all |

### Suggested MVP

**Foundation + US1** (T002–T004) — screen contain + letterbox. Next: US2 local verify → Polish.

---

## Implementation Strategy

1. Confirm `.grade-screen-tile` targeting.
2. CSS `contain` + dark letterbox for screen videos only (MVP).
3. Verify local preview inherits; fix attach only if needed.
4. Spotlight + `tsc` + quickstart 1–5; implement updates daily + CHANGELOG.

---

## Notes

- Presentation-only; no LiveKit/occupancy/Composition/PiP changes.
- Format validation: all tasks use `- [ ]`, IDs T001–T009, story labels on US phases only, file paths in every description.
