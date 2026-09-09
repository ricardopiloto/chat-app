---
description: "Task list for 081-panel-cam-header-blur"
---

# Tasks: Câmara no painel + blur no cabeçalho

**Input**: Design documents from `/specs/081-panel-cam-header-blur/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) A–E + `tsc --noEmit`. No formal TDD suite requested.

**Organization**: Setup → Foundational (preferred cam) → US1 panel cam + JOIN + pre-join strip → US3 remove bottom bar → US2 header blur select → US4 retire stage → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/shell/{UserPanel,AppShell}.tsx`, `frontend/src/voice/VoiceSession.tsx`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/preferences/uiPrefs.ts`, `frontend/src/styles/mesa-theme.css`, `frontend/src/i18n/catalogs/{en,pt-BR}.ts`, `frontend/src/blur/blurPreference.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and current chrome to change.

- [x] T001 Confirm `.specify/feature.json` → `specs/081-panel-cam-header-blur` and skim panel controls in `frontend/src/shell/UserPanel.tsx`, `toggleCam`/`camOn` in `frontend/src/voice/VoiceSession.tsx`, pre-join + `voice-in-call-bar` + stage button + `requestStageMode` in `frontend/src/pages/VoiceChannel.tsx`, and stage helpers in `frontend/src/shell/AppShell.tsx` / `frontend/src/preferences/uiPrefs.ts` against [research.md](./research.md) R1–R6

**Checkpoint**: Map of panel, bottom bar, pre-join opt-in, and stage entry points.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Session preferred camera API — **blocks** US1 JOIN inheritance and panel idle toggles.

**⚠️ CRITICAL**: Finish before US1 panel/join wiring.

- [x] T002 Change default `camOn` to `false` and extend `toggleCam` in `frontend/src/voice/VoiceSession.tsx` so when `!live` / no session it flips in-memory preferred camera only (no localStorage) per [data-model.md](./data-model.md) and [research.md](./research.md) R1
- [x] T003 Ensure live `toggleCam` path in `frontend/src/voice/VoiceSession.tsx` still publishes/mutes when session exists; hangup/disconnect MUST preserve preferred `camOn` (same spirit as mic prefs in 080)

**Checkpoint**: Idle toggle flips `voice.camOn()`; default off after load.

---

## Phase 3: User Story 1 - Câmara no painel + JOIN + pré-entrada limpo (Priority: P1) 🎯 MVP

**Goal**: Camera button on user panel (after deafen); session pref; JOIN uses it; pre-join has no cam opt-in/blur/preview.

**Independent Test**: [quickstart.md](./quickstart.md) A; [contracts/user-panel-camera.md](./contracts/user-panel-camera.md); [contracts/prejoin-join-only.md](./contracts/prejoin-join-only.md).

### Implementation for User Story 1

- [x] T004 [US1] Add camera control after deafen / before settings in `frontend/src/shell/UserPanel.tsx` (same `.user-panel-ctrl` model; no blur/chevron); wire `voice.toggleCam()`; disable for listen-only when `permission() === "listen"` (PC-01–05)
- [x] T005 [US1] Drive `connect` / JOIN from `voice.camOn()` in `frontend/src/pages/VoiceChannel.tsx` (`connect(camera|audio)` + join `cam_on`); remove `cameraIntent` state and pre-join camera opt-in UI, blur split, and lazy preview (PJ-01–03, FR-004b/c)
- [x] T006 [US1] Keep listen-only join and optional test-video secondary in `frontend/src/pages/VoiceChannel.tsx` without restoring cam opt-in (PJ-04–05)
- [x] T007 [P] [US1] Add i18n labels if needed for panel camera aria in `frontend/src/i18n/catalogs/en.ts` and `frontend/src/i18n/catalogs/pt-BR.ts` (reuse `shell.camOn` / `shell.camOff` when possible)

**Checkpoint**: Panel cam toggles pref; JOIN respects; pre-join is JOIN-only (+ test).

---

## Phase 4: User Story 3 - Remover barra inferior de chamada (Priority: P1)

**Goal**: Delete `voice-in-call-bar`; leave stays on panel/PiP.

**Independent Test**: Quickstart B (no bottom bar); FR-007 / FR-009.

### Implementation for User Story 3

- [x] T008 [US3] Remove `voice-in-call-bar` markup and related in-call cam/blur/hang-up handlers unique to that bar from `frontend/src/pages/VoiceChannel.tsx`
- [x] T009 [P] [US3] Remove or inert unused `.voice-in-call-bar` / `.voice-in-call-blur` CSS in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: In-call bottom toolbar gone; panel leave still works.

---

## Phase 5: User Story 2 - Blur no cabeçalho como select (Priority: P1)

**Goal**: Native blur select in voice `pane-header` while live.

**Independent Test**: Quickstart B (blur steps); [contracts/header-blur-select.md](./contracts/header-blur-select.md).

### Implementation for User Story 2

- [x] T010 [US2] Add blur `<select>` (off / light / strong) to live `pane-header` in `frontend/src/pages/VoiceChannel.tsx`; bind `readBlurMode`/`writeBlurMode`; on change apply `applyBlurMode` when cam on + local track (HB-01–04)
- [x] T011 [US2] Style header blur select in `frontend/src/styles/mesa-theme.css` so it fits pane-header chrome without covering other controls
- [x] T012 [P] [US2] Add i18n option labels for blur select (none / light / strong) in `frontend/src/i18n/catalogs/en.ts` and `frontend/src/i18n/catalogs/pt-BR.ts`

**Checkpoint**: In-call header select changes blur preference and live effect when cam on.

---

## Phase 6: User Story 4 - Retirar modo palco (Priority: P1)

**Goal**: No stage button; shell never enters stage mode.

**Independent Test**: Quickstart C; [contracts/stage-mode-retired.md](./contracts/stage-mode-retired.md).

### Implementation for User Story 4

- [x] T013 [US4] Remove «Modo palco» / stage toggle button from `frontend/src/pages/VoiceChannel.tsx` header (SM-01)
- [x] T014 [US4] Stop calling `requestStageMode(true)` on join/focus paths in `frontend/src/pages/VoiceChannel.tsx`; ensure leave/error paths leave stage off (SM-03)
- [x] T015 [US4] Force stage mode off in `frontend/src/shell/AppShell.tsx` (`requestStageMode`/`toggleStageMode` never enable; no `stage-mode` class) per research R5
- [x] T016 [P] [US4] Make `readStageMode()` always return `false` (and/or ignore writes) in `frontend/src/preferences/uiPrefs.ts` so legacy `mesa.stageMode` cannot re-enable layout (SM-04)

**Checkpoint**: No stage button; JOIN never enters stage layout.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Typecheck, manual quickstart, dead CSS/i18n cleanup.

- [x] T017 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and fix type errors from VoiceSession / VoiceChannel / UserPanel / AppShell changes
- [x] T018 Manually walk [quickstart.md](./quickstart.md) A–D (E if listen-only); fix regressions
- [x] T019 [P] Drop unused pre-join cam/stage string usages if orphaned in `frontend/src/i18n/catalogs/en.ts` and `frontend/src/i18n/catalogs/pt-BR.ts` (optional; keep keys if PiP/other still reference)

**Checkpoint**: Ready for `/speckit-implement` completion (daily + CHANGELOG in implement).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → Foundation (T002–T003) → US1
- **US1** (T004–T007): requires T002–T003
- **US3** (T008–T009): after US1 preferred (panel owns cam before bar removal)
- **US2** (T010–T012): after US3 recommended (no duplicate blur UI); can start after US1 if careful
- **US4** (T013–T016): independent of US2 after T001; can parallel US1 after foundation if avoiding VoiceChannel conflicts — prefer after US1/US3 VoiceChannel edits settle
- **Polish**: after stories

### User Story Dependencies

```text
T001 → T002/T003 → US1 → US3 → US2
US4 ∥ after VoiceChannel cam/bar work (or carefully parallel)
```

### Parallel Opportunities

- T007 ∥ T004–T006 once keys known
- T009 ∥ T008
- T012 ∥ T010–T011
- T016 ∥ T015
- T019 ∥ T017

### Parallel Example

```bash
# After T003:
# Dev A: T004–T007 (US1) then T008–T009 (US3) then T010–T012 (US2)
# Dev B: T015–T016 (US4 AppShell/prefs) then T013–T014 once VoiceChannel free
```

### Independent Test Criteria

| Story | Test |
|-------|------|
| US1 | Quickstart A — panel cam + JOIN + no pre-join cam UI |
| US2 | Quickstart B — header blur select |
| US3 | Quickstart B — no bottom bar; leave on panel |
| US4 | Quickstart C — no stage button/layout |

### Suggested MVP

**US1 only (T002–T007)** — panel camera + JOIN preference + clean pre-join. Next: US3 → US2 → US4.

---

## Implementation Strategy

1. Land preferred cam + panel button + JOIN (MVP).
2. Remove bottom bar so cam/blur aren’t duplicated.
3. Add header blur select.
4. Retire stage mode completely.
5. `tsc` + quickstart A–D.

---

## Notes

- Supersedes 078 “no cam on panel” and 078/080 pre-join opt-in / bottom-bar cam ownership where they conflict.
- Hang-up remains on UserPanel (+ PiP).
- No backend tasks.
- Format validation: all tasks use `- [ ]`, IDs T001–T019, story labels on US phases only, file paths in every description.
