---
description: "Task list for 080-call-controls-restore"
---

# Tasks: Restaurar controlos de chamada (sair, câmara, blur)

**Input**: Design documents from `/specs/080-call-controls-restore/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) A–G + `tsc --noEmit`. No formal TDD suite requested in plan/spec.

**Organization**: Setup → Foundational (VoiceSession prefs API) → US1 leave → US6 mic/deafen prefs+join → US2 bottom bar cam → US3 blur on bar → US4 blur menu stacking → US5 panel shape polish → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US6]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/shell/UserPanel.tsx`, `frontend/src/voice/VoiceSession.tsx`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/components/CameraBlurMenu.tsx`, `frontend/src/styles/mesa-theme.css`, `frontend/src/i18n/catalogs/{en,pt-BR}.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and current regression points.

- [x] T001 Confirm `.specify/feature.json` → `specs/080-call-controls-restore` and skim `showLeave` / mic-disable / chevrons in `frontend/src/shell/UserPanel.tsx`, `toggleMic`/`setDeafened`/`bindLive` in `frontend/src/voice/VoiceSession.tsx`, in-call footer gap in `frontend/src/pages/VoiceChannel.tsx`, and `.camera-blur-menu` / `.pane-header` in `frontend/src/styles/mesa-theme.css` against [research.md](./research.md) R1–R5

**Checkpoint**: Clear map of leave gate, disabled mic, missing bottom bar, and blur stacking.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Session-level mic/deafen preference API in `VoiceSession` so US6 (and join) can apply prefs; enables panel toggles without LiveKit.

**⚠️ CRITICAL**: Complete before US6 panel wiring and join inheritance. US1 can start in parallel after T001 if needed, but prefer finishing T002–T003 first to avoid conflicting `VoiceSession` edits.

- [x] T002 Extend `toggleMic` / `toggleDeafen` / `setDeafened` in `frontend/src/voice/VoiceSession.tsx` so when `!live` / no session they update in-memory preferred `micOn` / `deafened` (do not force-clear deafen; no localStorage) per [contracts/mic-deafen-session-prefs.md](./contracts/mic-deafen-session-prefs.md) MD-01–02, MD-05 and [data-model.md](./data-model.md)
- [x] T003 Apply preferred deafen after `bindLive` (and expose/use preferred mic for join consumers) in `frontend/src/voice/VoiceSession.tsx` so live session inherits prefs without resetting deafen to false unconditionally (MD-03–04)

**Checkpoint**: Off-call toggles mutate session signals; bindLive can honor preferred deafen.

---

## Phase 3: User Story 1 - Desligar da sala a qualquer momento (Priority: P1) 🎯 MVP

**Goal**: Leave always on user panel while in call, including stage mode.

**Independent Test**: [quickstart.md](./quickstart.md) A; [contracts/user-panel-controls.md](./contracts/user-panel-controls.md) UP80-02–03.

### Implementation for User Story 1

- [x] T004 [US1] Change leave visibility in `frontend/src/shell/UserPanel.tsx` to `voice.live()` only (remove `!stageMode()` gate); keep hang-up → `voice.hangup()`; leave may drop unused stage-only leave logic if obsolete (UP80-02)
- [x] T005 [US1] Confirm panel leave layout still sits left of mic→deafen→settings in stage and off-stage via `frontend/src/styles/mesa-theme.css` (`.user-panel-leave`) — adjust only if stage chrome collisions appear

**Checkpoint**: Stage and off-stage can hang up from the user panel.

---

## Phase 4: User Story 6 - Mic e ensurdecer fora de chamada e na entrada (Priority: P1)

**Goal**: Panel mic/deafen work out of call; join respects preferred state; listen-only stays coherent.

**Independent Test**: [quickstart.md](./quickstart.md) C (+ G optional); MD-01–07; UP80-04–05.

### Implementation for User Story 6

- [x] T006 [US6] Enable mic/deafen when `!voice.live()` in `frontend/src/shell/UserPanel.tsx` (remove `callControlsDisabled = !live`); keep listen-only mic disabled when `permission() === "listen"`; wire clicks to `toggleMic` / `toggleDeafen` (UP80-04)
- [x] T007 [US6] On connect/join in `frontend/src/pages/VoiceChannel.tsx`, use `voice.micOn()` (session preferred) for capture/join `mic_on` / `bindLive` mic instead of a disconnected local default that ignores panel prefs (MD-03)
- [x] T008 [US6] After successful `bindLive` in `frontend/src/pages/VoiceChannel.tsx` (or inside VoiceSession per T003), apply preferred deafen so remotes mute and mic follows live deafen semantics (MD-04); ensure listen-only path never publishes (MD-06)

**Checkpoint**: Mute/deafen out of call → join matches; in-call toggles still work; reload resets prefs.

---

## Phase 5: User Story 2 - Ligar a câmara depois de entrar sem ela (Priority: P1)

**Goal**: Restore voice-pane bottom bar with hang-up + mid-call camera toggle.

**Independent Test**: [quickstart.md](./quickstart.md) B (hang-up + camera steps); [contracts/voice-pane-bottom-bar.md](./contracts/voice-pane-bottom-bar.md) VB-01–03, VB-06.

### Implementation for User Story 2

- [x] T009 [US2] Add in-call bottom control bar to `frontend/src/pages/VoiceChannel.tsx` when live on this channel: hang-up (`voice.hangup` / existing leave) + camera (`voice.toggleCam`); keep camera/blur off UserPanel (VB-01–03, VB-06)
- [x] T010 [US2] Style the in-call bottom bar in `frontend/src/styles/mesa-theme.css` (footer of `.voice-pane`, reuse `.call-ctrl` patterns; do not block stage content)

**Checkpoint**: Audio-only join → enable camera mid-call from bottom bar; hang-up works from bar.

---

## Phase 6: User Story 3 - Efeitos de blur após ligar / com câmara disponível (Priority: P1)

**Goal**: Blur on bottom bar only when camera is on; apply blur to local track.

**Independent Test**: Quickstart B (blur steps); VB-04–05.

### Implementation for User Story 3

- [x] T011 [US3] Add blur control + `CameraBlurMenu` to the in-call bottom bar in `frontend/src/pages/VoiceChannel.tsx`, visible only when `voice.camOn()`; on select write blur pref and `applyBlurMode` on local cam track when supported (hide when cam off — FR-007 / VB-04)
- [x] T012 [US3] Ensure turning camera off hides blur UI and does not leave a stuck open menu in `frontend/src/pages/VoiceChannel.tsx`

**Checkpoint**: Blur appears only with camera on; choosing an effect applies or shows unavailable.

---

## Phase 7: User Story 4 - Menu de blur visível sobre o chrome da sala (Priority: P1)

**Goal**: Blur menu fully visible and clickable above pane header / voice chrome.

**Independent Test**: [quickstart.md](./quickstart.md) E; [contracts/blur-menu-visibility.md](./contracts/blur-menu-visibility.md) BM-01–04.

### Implementation for User Story 4

- [x] T013 [US4] Fix blur menu stacking/clipping vs `.pane-header` in `frontend/src/styles/mesa-theme.css` (z-index, overflow on `.voice-pane` / anchors, open direction) so `.camera-blur-menu` is fully visible (BM-01–02)
- [x] T014 [P] [US4] If CSS alone is insufficient, adjust open direction or portal behaviour in `frontend/src/components/CameraBlurMenu.tsx` so menu stays interactive above header (BM-02–03)

**Checkpoint**: Open blur near header/preview — full menu, clicks work.

---

## Phase 8: User Story 5 - Bordas arredondadas no microfone e ensurdecer (Priority: P2)

**Goal**: Soft rounded mic/deafen; remove decorative chevrons; not pill.

**Independent Test**: [quickstart.md](./quickstart.md) D; UP80-06–07.

### Implementation for User Story 5

- [x] T015 [US5] Remove decorative mic/deafen chevron spans and unused chevron imports from `frontend/src/shell/UserPanel.tsx` (UP80-06)
- [x] T016 [US5] Restyle `.user-panel-ctrl` / former split containers in `frontend/src/styles/mesa-theme.css` for soft rounded rectangles (not sharp square, not `border-radius: 50%` / full pill); drop obsolete `.user-panel-ctrl-chevron` rules if unused (UP80-07)

**Checkpoint**: Panel mic/deafen look rounded and chevron-free.

---

## Phase 9: Polish & Cross-Cutting

**Purpose**: Typecheck, manual quickstart, docs if delivering implement.

- [x] T017 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and fix any type errors from VoiceSession / VoiceChannel / UserPanel changes
- [x] T018 Manually walk [quickstart.md](./quickstart.md) A–F (and G if listen-only available); fix regressions
- [x] T019 [P] Add/adjust i18n only if new labels were introduced in `frontend/src/i18n/catalogs/en.ts` and `frontend/src/i18n/catalogs/pt-BR.ts` (prefer reuse `shell.*` / `voice.*`)

**Checkpoint**: Feature ready for `/speckit-implement` completion (daily + CHANGELOG done in implement skill).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → Foundation (T002–T003) → stories
- **US1** (T004–T005): after T001 (can overlap foundation carefully); MVP
- **US6** (T006–T008): requires T002–T003
- **US2** (T009–T010): independent of US1/US6 after T001
- **US3** (T011–T012): requires US2 bottom bar (T009)
- **US4** (T013–T014): after blur exists (US3) or can start on pre-join blur CSS in parallel with US3
- **US5** (T015–T016): independent panel polish; can parallel US2–US4
- **Polish** (T017–T019): after story work

### User Story Dependencies

```text
T001 → T002/T003 → US6
T001 → US1 (MVP)
T001 → US2 → US3 → US4
US5 ∥ (panel-only)
```

### Parallel Opportunities

- After T001: US1 panel leave ∥ start T002 VoiceSession
- After foundation: US6 panel enable ∥ US2 bottom bar shell
- US5 CSS/markup ∥ US2/US3/US4
- T014 ∥ T013 only if different files and CSS path clear; else sequential CSS then component
- T019 ∥ after UI strings known

### Parallel Example

```bash
# After T003:
# Dev A: T004–T005 (US1) then T006–T008 (US6)
# Dev B: T009–T012 (US2–US3) then T013–T014 (US4)
# Dev C: T015–T016 (US5)
```

### Independent Test Criteria

| Story | Test |
|-------|------|
| US1 | Quickstart A — leave on stage + off-stage |
| US2 | Quickstart B — bottom bar hang-up + mid-call cam |
| US3 | Quickstart B — blur only when cam on |
| US4 | Quickstart E — menu above header |
| US5 | Quickstart D — rounded, no chevron |
| US6 | Quickstart C — prefs out of call + join inherit |

### Suggested MVP

**US1 only (T004–T005)** — unblocks users stuck on stage. Next: US6 + US2 for full call-control restore.

---

## Implementation Strategy

1. Ship **US1** immediately (leave on panel).
2. Land **VoiceSession prefs + US6** so panel mic/deafen are real.
3. Restore **bottom bar (US2→US3)** then **blur stacking (US4)**.
4. **US5** polish last (P2).
5. **tsc** + quickstart A–F before marking implement done.

---

## Notes

- Supersedes 078 UP-03 / UP-05 / UP-09 where this feature conflicts (see contracts).
- Do not put camera/blur back on `UserPanel`.
- No backend tasks.
- Format validation: all tasks use `- [ ]`, Task IDs T001–T019, story labels on US phases only, file paths in every description.
