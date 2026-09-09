---
description: "Task list for 078-user-panel-discord"
---

# Tasks: User Panel Discord + Defer Collapse + Voice Join Opt-in

**Input**: Design documents from `/specs/078-user-panel-discord/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) A–E + `tsc --noEmit`; optional reuse of 032 `cam_on` contract tests. No formal TDD suite requested in plan.

**Organization**: Setup → Foundational (i18n keys) → US1 collapse off → US2 identity → US3 Discord trio → US4 cam/blur off panel + leave → US5 JOIN opt-in → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US5]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/shell/{AppShell,Sidebar,UserPanel}.tsx`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/preferences/uiPrefs.ts`, `frontend/src/styles/mesa-theme.css`, `frontend/src/i18n/catalogs/{en,pt-BR}.ts`, `frontend/src/components/CameraBlurMenu.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and touch points.

- [x] T001 Confirm `.specify/feature.json` → `specs/078-user-panel-discord` and skim collapse toggle in `frontend/src/shell/Sidebar.tsx` / `AppShell.tsx`, panel markup in `frontend/src/shell/UserPanel.tsx`, and dual join buttons in `frontend/src/pages/VoiceChannel.tsx` against [research.md](./research.md) R1–R5

**Checkpoint**: Understood collapse, panel, and pre-join surfaces.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared i18n strings for status + JOIN opt-in — **blocks** story polish copy.

**⚠️ CRITICAL**: Complete before relying on new labels in US2/US5.

- [x] T002 [P] Add i18n keys for user-panel online status, JOIN, camera opt-in, and retire usage notes for hide-channels / dual-join labels in `frontend/src/i18n/catalogs/en.ts`
- [x] T003 [P] Mirror the same i18n keys in `frontend/src/i18n/catalogs/pt-BR.ts`

**Checkpoint**: Catalogs compile; keys ready for panel + join UI.

---

## Phase 3: User Story 1 - Channel list always visible; collapse deferred (Priority: P1) 🎯 MVP

**Goal**: Remove hide/collapse from product; list always expanded; legacy pref ignored.

**Independent Test**: [quickstart.md](./quickstart.md) A; [contracts/channels-collapse-defer.md](./contracts/channels-collapse-defer.md).

### Implementation for User Story 1

- [x] T004 [US1] Force channels always expanded and stop applying `channels-collapsed` in `frontend/src/shell/AppShell.tsx` (ignore `channelsListExpanded === false`) per [research.md](./research.md) R1
- [x] T005 [US1] Remove hide-channels toggle, peek affordances, and related handlers from `frontend/src/shell/Sidebar.tsx`
- [x] T006 [US1] Ignore and/or clear legacy `mesa.channelsListExpanded` collapse behavior in `frontend/src/preferences/uiPrefs.ts` (CC-04)
- [x] T007 [US1] Remove or inert dead `.shell.channels-collapsed` / peek CSS paths in `frontend/src/styles/mesa-theme.css` per research R7

**Checkpoint**: No way to collapse channel list; reload stays expanded.

---

## Phase 4: User Story 2 - Discord-like user bar identity (Priority: P1)

**Goal**: Avatar + online + two-line identity (handle / online); hover + account menu.

**Independent Test**: [quickstart.md](./quickstart.md) B (identity half); [contracts/user-panel-discord.md](./contracts/user-panel-discord.md) UP-06–07.

### Implementation for User Story 2

- [x] T008 [US2] Restructure identity block in `frontend/src/shell/UserPanel.tsx`: primary handle + secondary online status; keep avatar online indicator; account menu on identity activate
- [x] T009 [US2] Style identity hover inset + two-line typography in `frontend/src/styles/mesa-theme.css` (Discord-like, Mesa tokens)

**Checkpoint**: Identity matches Discord composition for left cluster.

---

## Phase 5: User Story 3 - Always-visible mic, deafen, settings (Priority: P1)

**Goal**: Right cluster mic▾ → deafen▾ → settings always; disabled when idle; visual-only chevrons.

**Independent Test**: Quickstart B + in-call mic/deafen; UP-02–05.

### Implementation for User Story 3

- [x] T010 [US3] Always render mic + deafen + settings in `frontend/src/shell/UserPanel.tsx` (not only when `voice.live()`); disable mic/deafen when `!live`; keep settings → account menu
- [x] T011 [US3] Add icon+chevron visual groups for mic and deafen without device menus in `frontend/src/shell/UserPanel.tsx` (UP-05)
- [x] T012 [US3] Style Discord-order control cluster (and decorative chevrons) in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Idle bar shows trio; live mic/deafen work including on stage.

---

## Phase 6: User Story 4 - Camera/blur only on voice; leave off-stage on panel (Priority: P1)

**Goal**: Remove cam/blur from user panel; leave left of trio when live off-stage; stage owns leave/cam/blur.

**Independent Test**: [quickstart.md](./quickstart.md) C; UP-01, UP-08–09.

### Implementation for User Story 4

- [x] T013 [US4] Remove camera, blur split, and `CameraBlurMenu` from `frontend/src/shell/UserPanel.tsx`; ensure cam/blur remain only on voice/stage chrome
- [x] T014 [US4] Show leave on panel only when `voice.live()` and not stage-mode, placed left of mic→deafen→settings in `frontend/src/shell/UserPanel.tsx`
- [x] T015 [US4] Adjust panel CSS for leave-left-of-trio layout (and drop obsolete panel cam-split / collapse-centering rules) in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Panel never shows cam/blur; off-stage leave works; stage leave not duplicated on panel.

---

## Phase 7: User Story 5 - Single JOIN with camera opt-in (Priority: P1)

**Goal**: Replace dual join buttons with JOIN + camera opt-in + lazy preview; blur gated on opt-in; 032 bank/stage semantics.

**Independent Test**: [quickstart.md](./quickstart.md) D–E; [contracts/voice-join-optin.md](./contracts/voice-join-optin.md).

### Implementation for User Story 5

- [x] T016 [US5] Replace dual primary join buttons with camera opt-in (default off) + single JOIN calling `connect("audio"|"camera")` in `frontend/src/pages/VoiceChannel.tsx`; keep test-video secondary; listen-only path unchanged
- [x] T017 [US5] Add lazy local self-preview after camera opt-in only (no getUserMedia on default-off open) in `frontend/src/pages/VoiceChannel.tsx` per FR-021
- [x] T018 [US5] Wire pre-join blur controls (reuse `CameraBlurMenu` / blur preference) interactive only when camera opted in in `frontend/src/pages/VoiceChannel.tsx` (FR-026)
- [x] T019 [P] [US5] Style pre-join JOIN / camera / preview / blur surface in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: One JOIN path; camera-off → banco; camera-on → palco rules; blur gated.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validation and project docs.

- [x] T020 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`
- [x] T021 [P] Optionally run existing 032 join contract filter (`cargo test --test contract` for `cam_on` / occupancy) if unchanged semantics need regression check
- [x] T022 Walk [quickstart.md](./quickstart.md) A–E manually
- [x] T023 Update `docs/daily/2026-09-08.md` with Speckit implement subsection for 078 (after implement)
- [x] T024 [P] Update `CHANGELOG.md` `[Unreleased]` for 078 (after implement)

**Checkpoint**: Typecheck clean; quickstart green; docs ready post-implement.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — i18n before US2/US5 copy
- **US1**: After Foundational (can start in parallel with US2–US3 once prefs/shell known)
- **US2 → US3 → US4**: Prefer sequential on `UserPanel.tsx` / shared CSS to avoid merge thrash
- **US5**: Independent of panel stories after Foundational (VoiceChannel); can parallel with US1
- **Polish**: After desired stories complete

### User Story Dependencies

| Story | Depends on |
|-------|------------|
| US1 collapse | Foundational |
| US2 identity | Foundational; shares `UserPanel` with US3–US4 |
| US3 trio | US2 identity structure helpful first |
| US4 leave / no cam | US3 trio present |
| US5 JOIN | Foundational; independent of US2–US4 |

### Parallel Opportunities

- T002 ∥ T003 (catalogs)
- US1 (shell/sidebar/prefs) ∥ US5 (VoiceChannel) after Foundational
- T019 CSS ∥ after T016–T018 logic
- T021 ∥ T022 during polish
- T023 ∥ T024 after implement

### Parallel Example: After Foundational

```bash
# Developer A — collapse
Task: T004–T007 AppShell / Sidebar / uiPrefs / CSS

# Developer B — join opt-in
Task: T016–T019 VoiceChannel + CSS
```

---

## Implementation Strategy

### MVP First

1. Setup + Foundational  
2. **US1** collapse off → validate quickstart A  
3. Stop / demo if needed  

### Incremental Delivery

1. US1 collapse  
2. US2–US4 user panel Discord (identity → trio → leave/no-cam) → quickstart B–C  
3. US5 JOIN opt-in → quickstart D–E  
4. Polish (tsc, docs)

### Suggested MVP scope

**US1 only** (collapse deferred) is the smallest shippable slice; product value for Discord bar + JOIN needs **US2–US5**.

---

## Notes

- No backend tasks expected (032 `cam_on` retained)
- Do not reintroduce panel camera/blur
- Mic/deafen chevrons are decorative only
- Mark tasks `[X]` during `/speckit-implement`
