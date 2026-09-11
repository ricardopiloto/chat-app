---
description: "Task list for 082-screen-share"
---

# Tasks: Compartilhamento de tela no canal de voz

**Input**: Design documents from `/specs/082-screen-share/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `cargo test` + `tsc --noEmit`. No formal TDD suite requested in spec.

**Organization**: Setup → Foundational (DB + occupancy API + LiveKit toggle + FE types) → US1 publish/UI → US2 multi-share (mostly layout/state already) → US3 Grade vs Composição → US4 indicators → US5 spotlight → US6 visual priority → Polish (E2EE spike + daily/CHANGELOG on implement).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US6]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/migrations/`, `backend/src/domain/voice_occupancy.rs`, `backend/src/api/voice.rs`, `frontend/src/api/client.ts`, `frontend/src/voice/{VoiceSession,releaseLocalCapture}.tsx` / `.ts`, `frontend/src/video/liveClient.ts`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/components/CameraGrid.tsx`, `frontend/src/shell/{UserPanel,Sidebar}.tsx`, `frontend/src/preferences/uiPrefs.ts`, `frontend/src/styles/mesa-theme.css`, `frontend/src/i18n/catalogs/{en,pt-BR}.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and map hotspots against research.

- [x] T001 Confirm `.specify/feature.json` → `specs/082-screen-share` and skim occupancy (`backend/src/domain/voice_occupancy.rs`, `backend/src/api/voice.rs`), LiveKit publish (`frontend/src/video/liveClient.ts`, `frontend/src/voice/VoiceSession.tsx`), grade layout (`frontend/src/pages/VoiceChannel.tsx`, `frontend/src/components/CameraGrid.tsx`), panel/sidebar (`frontend/src/shell/UserPanel.tsx`, `frontend/src/shell/Sidebar.tsx`), and `mesa.viewMode` in `frontend/src/preferences/uiPrefs.ts` against [research.md](./research.md) R1–R8

**Checkpoint**: Clear map of where `screen_on`, toggle, tiles, and indicators land.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Server `screen_on` + FE session publish API + client types — **blocks** all user stories.

**⚠️ CRITICAL**: Finish before US1 UI wiring.

- [x] T002 Add migration `backend/migrations/0020_voice_occupant_screen_on.sql` (`screen_on BOOLEAN NOT NULL DEFAULT FALSE` on `voice_occupant`) per [data-model.md](./data-model.md)
- [x] T003 Extend `VoiceOccupant` / `OccupantView` / SQL read-write with `screen_on` in `backend/src/domain/voice_occupancy.rs` and related DB helpers used by voice API
- [x] T004 Implement idempotent screen-share start/stop (dedicated routes **or** `PATCH .../voice/media` with `screen_on`) in `backend/src/api/voice.rs`; clear `screen_on` on leave/stale; broadcast via existing `voice.occupancy` per [contracts/screen-share-api.md](./contracts/screen-share-api.md) and [contracts/screen-share-ws.md](./contracts/screen-share-ws.md)
- [x] T005 [P] Add/adjust `cargo test` coverage for start/stop idempotence and leave clearing `screen_on` under `backend/` (voice occupancy / API tests)
- [x] T006 [P] Extend `VoiceOccupantView` / API helpers with `screen_on` and start/stop (or patch) client methods in `frontend/src/api/client.ts`
- [x] T007 Add `screenOn` signal + `toggleScreenShare` in `frontend/src/voice/VoiceSession.tsx` using LiveKit `setScreenShareEnabled` (prefer system/tab audio when offered), set `contentHint = 'detail'` on screen video when possible, call server start only after successful enable, stop on track end / toggle off; do **not** change `camOn` per [research.md](./research.md) R3
- [x] T008 Stop screen share on hangup in `frontend/src/voice/releaseLocalCapture.ts` and/or hangup path in `frontend/src/voice/VoiceSession.tsx` (LiveKit disable + server stop)
- [x] T009 Expose reactive view mode for panel gating: ensure `VoiceChannel` `setMode` notifies readers and `UserPanel` can observe Grade vs Composição (extend `frontend/src/preferences/uiPrefs.ts` and/or a thin shared signal) per [research.md](./research.md) R5

**Checkpoint**: Occupancy carries `screen_on`; session can publish/stop screen; FE types compile.

---

## Phase 3: User Story 1 - Partilhar o ecrã na chamada (Priority: P1) 🎯 MVP

**Goal**: Start/stop screen share from UserPanel in Grade while live; others in Grade see the screen; camera independent; no auto mode change.

**Independent Test**: [quickstart.md](./quickstart.md) scenarios 1–2, 7; [contracts/screen-share-ui.md](./contracts/screen-share-ui.md) UP-SS-*.

### Implementation for User Story 1

- [x] T010 [US1] Add screen-share control on `frontend/src/shell/UserPanel.tsx` (near cam) wired to `voice.toggleScreenShare()`; show only when `voice.live()` and view mode is Grade; hide in Composição without stopping active share; disable for listen-only if cam is (UP-SS-01–06)
- [x] T011 [US1] In `frontend/src/pages/VoiceChannel.tsx` `layoutMedia` / track placement, distinguish `Track.Source.ScreenShare` from Camera so Grade can show screen tiles (including local); keep Camera filter for composition slots / bank as today until US3 refines
- [x] T012 [P] [US1] Add i18n strings for screen share on/off (+ aria) in `frontend/src/i18n/catalogs/en.ts` and `frontend/src/i18n/catalogs/pt-BR.ts`
- [x] T013 [P] [US1] Style panel screen-share control in `frontend/src/styles/mesa-theme.css` consistent with mic/cam panel controls

**Checkpoint**: Grade + live → share works; cancel picker leaves occupancy clean; cam unchanged; mode unchanged.

---

## Phase 4: User Story 2 - Vários partilhadores em simultâneo (Priority: P1)

**Goal**: Multiple `screen_on` occupants; both screens visible in Grade; partial stop does not clear others.

**Independent Test**: Quickstart scenario 6 (first half); FR-005/006.

### Implementation for User Story 2

- [x] T014 [US2] Ensure occupancy merge in `frontend/src/shell/Sidebar.tsx` and voice consumers treat multiple `screen_on` occupants correctly (no «single sharer» assumption)
- [x] T015 [US2] Ensure Grade layout path in `frontend/src/pages/VoiceChannel.tsx` / `frontend/src/components/CameraGrid.tsx` can host **N** screen tiles from different identities without one replacing the other (equal split OK until US6 polish)

**Checkpoint**: A+B share → both tiles; A stops → B remains; snapshot lists both.

---

## Phase 5: User Story 3 - Telas só na Grade; Composição sem tiles; sem auto-modo (Priority: P1)

**Goal**: Screen **video** only in Grade; Composição shows composition/cameras only; share audio still plays in Composição; start/stop never flips view mode.

**Independent Test**: Quickstart scenarios 3–4; LY-SS-01–04 in [contracts/screen-share-ui.md](./contracts/screen-share-ui.md).

### Implementation for User Story 3

- [x] T016 [US3] Gate ScreenShare **video** attachment to Grade only in `frontend/src/pages/VoiceChannel.tsx` `layoutMedia` (and `CameraGrid` if needed); in Composição do not place screen video in scene slots or call bank
- [x] T017 [US3] Keep ScreenShareAudio (and mic) subscribed/playing while in Composição in `frontend/src/pages/VoiceChannel.tsx` / LiveKit bind path so share audio continues (FR-003)
- [x] T018 [US3] Verify `setMode` / share start-stop paths in `frontend/src/pages/VoiceChannel.tsx` and `frontend/src/voice/VoiceSession.tsx` never write view mode from share events; document assert in code comments only if helpful
- [x] T019 [US3] Confirm `frontend/src/shell/FloatingVoicePip.tsx` (or equivalent) stays camera-only and does not show screen tiles

**Checkpoint**: Composição = no screen tiles + audio OK; Grade = tiles; mode sticky.

---

## Phase 6: User Story 4 - Indicadores de partilha activa (Priority: P1)

**Goal**: Presence indicator on Grade seg-opt and voice channel-item while any `screen_on`.

**Independent Test**: Quickstart scenario 5; VC-SS-* / SB-SS-* contracts.

### Implementation for User Story 4

- [x] T020 [US4] Add share-active indicator on Grade `.seg-opt` in `frontend/src/pages/VoiceChannel.tsx` when current channel occupancy has any `screen_on`; `aria-label` via i18n (VC-SS-01–03)
- [x] T021 [US4] Add share-active indicator on voice `a.channel-item` in `frontend/src/shell/Sidebar.tsx` from occupancy map (visible even off-channel / in Composição) (SB-SS-01–03)
- [x] T022 [P] [US4] Style indicators in `frontend/src/styles/mesa-theme.css` (dot/icon; presence sufficient)
- [x] T023 [P] [US4] Add i18n for indicator labels in `frontend/src/i18n/catalogs/en.ts` and `frontend/src/i18n/catalogs/pt-BR.ts`

**Checkpoint**: Indicators appear/clear with share set; no forced navigation.

---

## Phase 7: User Story 5 - Destacar transmissão localmente (Priority: P2)

**Goal**: Local spotlight of an active screen sharer in Grade only; clears when they stop; not synced.

**Independent Test**: Quickstart scenario 6 (spotlight half); [contracts/grade-layout-spotlight.md](./contracts/grade-layout-spotlight.md) SP-*.

### Implementation for User Story 5

- [x] T024 [US5] Add local `spotlightedAccountId` state and Grade-only UI to set/clear spotlight in `frontend/src/pages/VoiceChannel.tsx` (and/or `CameraGrid.tsx`); only allow accounts with active screen share (SP-01–03)
- [x] T025 [US5] Clear spotlight when spotlighted occupant loses `screen_on` / track (occupancy or track-ended) in `frontend/src/pages/VoiceChannel.tsx` — do not auto-select another (SP-04)
- [x] T026 [P] [US5] Add i18n for spotlight control labels in `frontend/src/i18n/catalogs/en.ts` and `frontend/src/i18n/catalogs/pt-BR.ts`

**Checkpoint**: Spotlight is local-only; clears on stop; unavailable outside Grade / non-sharers.

---

## Phase 8: User Story 6 - Prioridade visual das telas na grade (Priority: P2)

**Goal**: Screens dominate Grade layout; cameras secondary; multi-screen balanced without spotlight.

**Independent Test**: Quickstart scenario 6 layout expectations; GL-01–04.

### Implementation for User Story 6

- [x] T027 [US6] Implement screen-priority Grade layout (primary screen band + secondary camera row) in `frontend/src/components/CameraGrid.tsx` and/or `frontend/src/pages/VoiceChannel.tsx` per [contracts/grade-layout-spotlight.md](./contracts/grade-layout-spotlight.md)
- [x] T028 [US6] Integrate spotlight enlargement with the priority layout in `frontend/src/components/CameraGrid.tsx` / `VoiceChannel.tsx` CSS (spotlighted screen large; others reduced)
- [x] T029 [P] [US6] Add/adjust CSS for screen band / camera strip / spotlight in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: One share → screen dominant; two shares → balanced screens; cameras secondary but visible.

---

## Phase 9: Polish & Cross-Cutting

**Purpose**: E2EE gate, typecheck, tests, manual quickstart; daily/CHANGELOG on successful implement.

- [x] T030 Spike/manual verify ScreenShare (+ audio) decrypts on `e2ee_enabled` channel; if broken, extend E2EE path in `frontend/src/video/liveClient.ts` / worker before calling encrypted rooms done ([research.md](./research.md) R4; quickstart §8)
- [x] T031 Run `cd backend && cargo test` and `cd frontend && ./node_modules/.bin/tsc --noEmit`; fix regressions
- [x] T032 Manually walk [quickstart.md](./quickstart.md) scenarios 1–7 (8 if E2EE available); fix gaps
- [x] T033 [P] Mark completed tasks in `specs/082-screen-share/tasks.md` as work finishes (implement phase)

**Checkpoint**: Ready for `/speckit-implement` completion (daily + CHANGELOG per workspace rule).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundation (T002–T009)** → user stories
- **US1** (T010–T013): requires T006–T009
- **US2** (T014–T015): after US1 tile path exists
- **US3** (T016–T019): after US1/US2 layout hooks
- **US4** (T020–T023): needs occupancy `screen_on` (foundation); can parallel US3 after T004/T006
- **US5** (T024–T026): after Grade multi-tile (US2); better after US3 mode gating
- **US6** (T027–T029): after US5 spotlight state (or stub spotlight null first)
- **Polish**: after stories

### User Story Dependencies

```text
Foundation → US1 → US2 → US3
                ↘ US4 (∥ after foundation + occupancy on FE)
US3/US2 → US5 → US6 → Polish
```

### Parallel Opportunities

- T005 ∥ T006 after T004 shape known
- T012 ∥ T013 ∥ T010–T011
- T022 ∥ T023 ∥ T020–T021
- T026 ∥ T024–T025
- T029 ∥ T027–T028
- US4 can proceed while US3 audio work continues if occupancy UI is ready

### Parallel Example

```bash
# After T009:
# Dev A: T010–T013 (US1) → T014–T015 (US2) → T016–T019 (US3)
# Dev B: T020–T023 (US4 indicators) once T006 occupancy types land
# Then: US5 → US6 → Polish
```

### Independent Test Criteria

| Story | Test |
|-------|------|
| US1 | Quickstart 1–2, 7 — start/stop in Grade; control hidden in Composição |
| US2 | Two sharers both visible; partial stop |
| US3 | Quickstart 3–4 — no tiles in Composição; audio OK; no auto-mode |
| US4 | Quickstart 5 — Grade seg + channel-item indicators |
| US5 | Spotlight local; clears on stop |
| US6 | Screen priority + balanced multi-screen |

### Suggested MVP

**Foundation + US1** (T002–T013) — publish/stop + Grade panel control + basic Grade tile. Next: US2 → US3 → US4, then US5/US6 polish.

---

## Implementation Strategy

1. Land migration + occupancy `screen_on` + LiveKit toggle + FE API.
2. Panel control (Grade-only) + basic Grade screen tile (MVP).
3. Multi-share tiles; Composition hides video / keeps audio; no mode writes.
4. Indicators on Grade + sidebar.
5. Spotlight + screen-priority layout.
6. E2EE check, `cargo test`, `tsc`, quickstart; implement updates daily + CHANGELOG.

---

## Notes

- Spec clarifications supersede PRD auto-layout / pre_share / follow_channel_layout.
- Prefer extending `voice.occupancy` over a parallel WS event ([research.md](./research.md) R1).
- Format validation: all tasks use `- [ ]`, IDs T001–T033, story labels on US phases only, file paths in every description.
