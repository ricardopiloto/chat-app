---
description: "Task list for 083-grade-screen-tiles"
---

# Tasks: Telas partilhadas como tiles iguais na Grade

**Input**: Design documents from `/specs/083-grade-screen-tiles/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `tsc --noEmit`. No formal TDD suite requested.

**Organization**: Setup → Foundational (GradeTile list model) → US1 unified equal grid → US2 multi/dual + chips → US3 spotlight on unified grid → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/components/CameraGrid.tsx`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/styles/mesa-theme.css`, `frontend/src/i18n/catalogs/{en,pt-BR}.ts`, `frontend/src/components/icons/IconScreenShare.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and current 082 split Grade hotspots.

- [x] T001 Confirm `.specify/feature.json` → `specs/083-grade-screen-tiles` and skim split Grade (`grade-stage-split`, `gradeScreenIds`/`gradeCameraIds`, spotlight) in `frontend/src/components/CameraGrid.tsx`, `frontend/src/pages/VoiceChannel.tsx`, and band CSS in `frontend/src/styles/mesa-theme.css` against [research.md](./research.md) R1–R6

**Checkpoint**: Clear map of band layout to remove and attach points to keep.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Client tile list model (cameras then screens) — **blocks** US1–US3 rendering.

**⚠️ CRITICAL**: Finish before rewriting CameraGrid Grade UI.

- [x] T002 Introduce a typed Grade tile list builder in `frontend/src/pages/VoiceChannel.tsx` (or small helper colocated) producing ordered `{ key, kind: "camera"|"screen", accountId }[]` = all cameras then all screens per [data-model.md](./data-model.md) and [research.md](./research.md) R2–R3
- [x] T003 Wire `layoutMedia` / attach maps in `frontend/src/pages/VoiceChannel.tsx` to tile keys (`cam:` / `screen:`) so Camera vs ScreenShare tracks still attach correctly without the band layout

**Checkpoint**: VoiceChannel can supply one ordered tile list; media still attaches by kind.

---

## Phase 3: User Story 1 - Grade trata tela como mais um tile (Priority: P1) 🎯 MVP

**Goal**: Single equal CSS grid for cameras + screens; remove fixed screen/camera bands.

**Independent Test**: [quickstart.md](./quickstart.md) §1; [contracts/unified-grade-grid.md](./contracts/unified-grade-grid.md) UG-01–UG-07, UG-11.

### Implementation for User Story 1

- [x] T004 [US1] Rewrite Grade branch in `frontend/src/components/CameraGrid.tsx` to render one equal `1fr` CSS grid from the ordered tile list (same column heuristic as legacy Grade, e.g. ≤3 cols); remove `grade-stage-split` / screen-band / camera-band UI (UG-01–UG-02, UG-11)
- [x] T005 [US1] Update Grade props usage in `frontend/src/pages/VoiceChannel.tsx` to pass the unified tile list (and attach callbacks by tile key) instead of separate band props driving split layout
- [x] T006 [P] [US1] Remove or inert `.grade-stage-split`, `.grade-screen-band`, `.grade-camera-band`, and related flex-crush rules in `frontend/src/styles/mesa-theme.css`; keep/adjust equal-grid stage styles (UG-11)

**Checkpoint**: 1 share + N cams → one balanced grid; no fat screen band.

---

## Phase 4: User Story 2 - Várias telas/câmaras + chip de ecrã (Priority: P1)

**Goal**: Multi-share and dual tiles (cam+screen) in the same grid; screen chips show handle + share affordance.

**Independent Test**: Quickstart §2; UG-03–UG-04; [contracts/screen-tile-chip.md](./contracts/screen-tile-chip.md).

### Implementation for User Story 2

- [x] T007 [US2] Ensure multi-share + cam+screen dual tiles appear correctly via the ordered list in `frontend/src/pages/VoiceChannel.tsx` / `CameraGrid.tsx` (cameras block then screens block; two tiles for same account when both publish)
- [x] T008 [US2] Render screen-tile chips with handle + share indicator (reuse `IconScreenShare` and/or short label) in `frontend/src/components/CameraGrid.tsx`; camera chips stay handle-only (SC-01–SC-02)
- [x] T009 [P] [US2] Add i18n for screen chip label/aria in `frontend/src/i18n/catalogs/en.ts` and `frontend/src/i18n/catalogs/pt-BR.ts` (SC-03)

**Checkpoint**: Two sharers + cams; dual tiles labeled; order cams → screens.

---

## Phase 5: User Story 3 - Destaque no grid unificado (Priority: P2)

**Goal**: Spotlight only on screen tiles; enlarges that cell inside the unified grid (no bands).

**Independent Test**: Quickstart §3; [contracts/spotlight-unified.md](./contracts/spotlight-unified.md).

### Implementation for User Story 3

- [x] T010 [US3] Adapt spotlight UI in `frontend/src/components/CameraGrid.tsx` so only screen tiles expose the control; spotlight enlarges that screen cell in the unified grid (span / emphasis) without restoring bands (SP-01–SP-02, SP-05)
- [x] T011 [US3] Keep clear-on-stop and local-only behavior for `spotlightId` in `frontend/src/pages/VoiceChannel.tsx` (SP-03–SP-04)
- [x] T012 [P] [US3] Add/adjust CSS for spotlight-within-unified-grid in `frontend/src/styles/mesa-theme.css` (no `.grade-screen-band` dependency)

**Checkpoint**: Spotlight grows screen tile locally; cams have no spotlight; stop clears.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Typecheck, Composition regression, mark tasks.

- [x] T013 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and fix errors from CameraGrid / VoiceChannel changes
- [x] T014 Manually walk [quickstart.md](./quickstart.md) scenarios 1–5 (Composition §4 + CSS cleanup §5); fix regressions
- [x] T015 [P] Mark completed tasks in `specs/083-grade-screen-tiles/tasks.md` as work finishes (implement phase)

**Checkpoint**: Ready for `/speckit-implement` (daily + CHANGELOG on successful implement).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundation (T002–T003)** → US1
- **US1** (T004–T006): requires T002–T003
- **US2** (T007–T009): after US1 grid exists
- **US3** (T010–T012): after US1 (ideally after US2 chips)
- **Polish**: after stories

### User Story Dependencies

```text
Foundation → US1 → US2 → US3 → Polish
```

### Parallel Opportunities

- T006 ∥ T004–T005 once API shape known
- T009 ∥ T007–T008
- T012 ∥ T010–T011
- T015 ∥ T013

### Parallel Example

```bash
# After T003:
# Dev A: T004–T005 (CameraGrid + VoiceChannel) then T007–T008
# Dev B: T006 CSS retirement, then T009 i18n, then T012 spotlight CSS
```

### Independent Test Criteria

| Story | Test |
|-------|------|
| US1 | Quickstart 1 — single equal grid; no bands |
| US2 | Quickstart 2 — multi/dual + screen chip |
| US3 | Quickstart 3 — spotlight on screen only |

### Suggested MVP

**Foundation + US1** (T002–T006) — unified equal grid, bands gone. Next: US2 chips → US3 spotlight.

---

## Implementation Strategy

1. Build ordered GradeTile list + attach-by-key.
2. Replace split Grade UI with one equal grid (MVP).
3. Screen chips + verify multi/dual tiles.
4. Spotlight inside unified grid.
5. `tsc` + quickstart 1–5; implement updates daily + CHANGELOG.

---

## Notes

- Supersedes 082 Grade **band** visual contracts only; capture/Composition/indicators unchanged.
- Format validation: all tasks use `- [ ]`, IDs T001–T015, story labels on US phases only, file paths in every description.
