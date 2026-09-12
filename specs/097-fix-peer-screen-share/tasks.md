---
description: "Task list for 097-fix-peer-screen-share"
---

# Tasks: Fix Peer Screen Share Visibility

**Input**: Design documents from `/specs/097-fix-peer-screen-share/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `cd frontend && npm run build`. No formal TDD in spec.

**Organization**: Setup → Foundational (diagnose dual-path / blank-tile class) → **US1 peer receive (A→B)** → **US2 reverse + mid-share** → **US3 indicators smoke** → polish. FE-first; backend only if subscribe/publish grants broken.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/pages/VoiceChannel.tsx`, `frontend/src/voice/VoiceSession.tsx`, `frontend/src/video/liveClient.ts`, `frontend/src/lib/safeMedia.ts`, `frontend/src/components/CameraGrid.tsx`, `frontend/src/shell/UserPanel.tsx`, optionally `backend/src/token/mod.rs` / `backend/src/api/voice.rs`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Lock feature pointer and skim remote vs local screen paths against research/contracts.

- [X] T001 Confirm `.specify/feature.json` → `specs/097-fix-peer-screen-share` and skim `toggleScreenShare` / `localScreenVideoEl` / `dispatchTrack` / `attachSessionRemoteAudio` / `placeTrack` / `remotesScreen` / `layoutMedia` / `attachGradeTile` / `attachRemote` / `screenTileKey` in the paths above against [research.md](./research.md) and [contracts/](./contracts/)

**Checkpoint**: Clear that self-preview ≠ peer delivery (dual-path).

---

## Phase 2: Foundational — diagnosis (Blocking)

**Purpose**: Classify blank peer tile (missing `<video>` vs black undecoded) and confirm ScreenShareAudio + E2EE surfaces before coding — **blocks** US1–US3.

**⚠️ CRITICAL**: Do not ship video-only or assume leave/rejoin unlocks peers (clarify).

- [X] T002 Trace peer **screen video**: `TrackSubscribed` → `placeTrack` (`Track.Source.ScreenShare`) → `remotesScreen` → `refreshGradeLists` / `gradeScreenIds` → `gradeTileEls` → `layoutMedia` `attachRemote` in `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/video/liveClient.ts`, `frontend/src/components/CameraGrid.tsx` (PSV; research R3 H1/H5)
- [X] T003 Trace peer **share audio**: `ScreenShareAudio` / any `Kind.Audio` → `attachSessionRemoteAudio` → `.voice-audio-host--session` → `safePlay`; note 096 host vs removed page rebind in `frontend/src/voice/VoiceSession.tsx`, `frontend/src/video/liveClient.ts`, `frontend/src/lib/safeMedia.ts` (PSA; research R3 H4)
- [X] T004 Note E2EE / publish surfaces: room E2EE setup in `frontend/src/video/liveClient.ts`; LiveKit `can_publish` / `can_subscribe` in `backend/src/token/mod.rs` — FE-first unless subscribe never fires (research R3 H2/H3)

**Checkpoint**: Hypothesis ranked; ready to harden peer attach/audio.

---

## Phase 3: User Story 1 - Peers see my live screen share (Priority: P1) 🎯 MVP

**Goal**: When A shares in Grade, B gets **live** screen-tile video and **share/system audio** (when included) within ~5s—no leave/rejoin workaround.

**Independent Test**: [quickstart.md](./quickstart.md) US1 steps A→B; SC-001/SC-006; [contracts/peer-screen-video.md](./contracts/peer-screen-video.md), [contracts/peer-share-audio.md](./contracts/peer-share-audio.md).

### Implementation for User Story 1

- [X] T005 [US1] Harden remote screen **video** attach: ensure every `remotesScreen` video binds into mounted `screen:{id}` hosts; re-run `layoutMedia` on Grade host mount and when remote screen identity set changes (reactive if needed) in `frontend/src/pages/VoiceChannel.tsx` / `frontend/src/components/CameraGrid.tsx` (PSV-01, R3 H1)
- [X] T006 [US1] Ensure `layoutMedia` + `clearOrphanVideos` always re-`attachRemote` remote screen videos after clearing screen tiles (viewer `localScreen` null) in `frontend/src/pages/VoiceChannel.tsx` (PSV-01, R3 H5) — attach-before-clear + keep attached remote video
- [X] T007 [US1] Harden peer **share audio**: subscribed `ScreenShareAudio` (and mic) attach to session audio host with `safePlay`; re-attach on host mount if needed; do not drop share audio while accepting mic in `frontend/src/voice/VoiceSession.tsx`, `frontend/src/video/liveClient.ts`, `frontend/src/lib/safeMedia.ts` (PSA-01–02)
- [X] T008 [US1] If blank tile has `<video>` but never decodes: investigate/fix E2EE or publish options for `ScreenShare` / `ScreenShareAudio` in `frontend/src/video/liveClient.ts` (and token only if required) (R3 H2/H3) — **deferred**: FE attach/rebind fix first; revisit if manual still black with `<video>` present
- [X] T009 [US1] Only if FE cannot subscribe screen tracks at all: fix publish/subscribe grants in `backend/src/token/mod.rs` (or related); otherwise skip and note in tasks — **skipped** (token already `can_publish` + `can_subscribe`)
- [X] T010 [US1] Run `cd frontend && npm run build`; quickstart A shares → B live video + share audio (when included); do not claim done on A self-preview alone

**Checkpoint**: A→B peer media works; MVP core ready.

---

## Phase 4: User Story 2 - I see peers’ live screen shares (Priority: P1)

**Goal**: Same remote pipeline works B→A; mid-share Grade entry; Composition hears share audio; stop clears peers; cam/mic unharmed.

**Independent Test**: Quickstart reverse + mid-share + Composition; SC-002–SC-005; PSV-02–06, PSA-03–05.

### Implementation for User Story 2

- [X] T011 [US2] Verify/fix bidirectional path (B shares → A live video + share audio) using the same remote attach code paths in `frontend/src/pages/VoiceChannel.tsx` / `frontend/src/voice/VoiceSession.tsx` (PSV-02, FR-002)
- [X] T012 [US2] Ensure mid-share / return-to-Grade replays or rebinds existing remote ScreenShare (+ audio) without sharer restart in `frontend/src/pages/VoiceChannel.tsx` (PSV-03, FR-008) — remount uses `dispatchTrack` + `scheduleLayoutBurst`
- [X] T013 [US2] Confirm Composition: no screen **video** tiles; share **audio** still plays via session host in `frontend/src/pages/VoiceChannel.tsx` / `frontend/src/voice/VoiceSession.tsx` (FR-006, PSA-02)
- [X] T014 [US2] Confirm stop-share clears peer screen tile + share audio (088 regression) in `frontend/src/pages/VoiceChannel.tsx` / `frontend/src/voice/VoiceSession.tsx` (PSV-04, FR-005) — scrub on ScreenShare unsubscribe
- [X] T015 [US2] Run `npm run build`; quickstart B→A + mid-share + Composition audio; cam/mic smoke (FR-007); camera not flipped by share

**Checkpoint**: Bidirectional + mid-share + Composition audio green.

---

## Phase 5: User Story 3 - Share indicators smoke (Priority: P3)

**Goal**: Existing share indicators still toggle; no redesign.

**Independent Test**: Quickstart US3; FR-009.

### Implementation for User Story 3

- [X] T016 [US3] Smoke existing Grade/channel share indicators on start/stop after media fix; no new indicator UX in `frontend/src/shell/UserPanel.tsx` / sidebar/voice header as currently wired (FR-009) — unchanged occupancy `screen_on` path
- [X] T017 [US3] Confirm no lingering empty share cell after stop (088) during the same smoke in Grade (`frontend/src/pages/VoiceChannel.tsx` / `frontend/src/components/CameraGrid.tsx`)

**Checkpoint**: Indicators no worse than today.

---

## Phase 6: Polish & docs

**Purpose**: Docs after stories green.

- [X] T018 [P] Update `docs/daily/2026-09-11.md` (or session date) Speckit implement subsection for 097-fix-peer-screen-share
- [X] T019 [P] Update `CHANGELOG.md` `[Unreleased]` Fixed entry for peer screen share video + share audio
- [X] T020 Final sign-off: all required tasks `[X]` in `specs/097-fix-peer-screen-share/tasks.md`; quickstart regression checklist complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** → **Phase 3 (US1)** → **Phase 4 (US2)** → **Phase 5 (US3)** → **Phase 6**
- US2 assumes US1 remote pipeline hardened; US3 is smoke after media works

### User Story Dependencies

- **US1**: After foundational diagnosis (T002–T004). MVP.
- **US2**: After US1 media path (T005–T010).
- **US3**: After US1 (ideally after US2) — regression only.

### Parallel Opportunities

- T002 ∥ T003 during foundational (different concerns; same files—prefer sequential if one agent)
- T018 ∥ T019 after T017
- T008/T009 only if diagnosis requires

### Independent Test Criteria

| Story | Test |
|-------|------|
| US1 | A shares → B live Grade tile + share audio ≤~5s |
| US2 | B→A same; mid-share Grade entry; Composition hears audio; stop clears; cam/mic OK |
| US3 | Indicators on/off smoke; no ghost empty screen tile |

### Implementation Strategy

1. Diagnose blank-tile class + audio path (T001–T004)
2. Fix peer video attach/rebind + share audio (T005–T010) — **MVP**
3. Bidirectional / mid-share / Composition / stop / cam regression (T011–T015)
4. Indicator smoke (T016–T017)
5. Daily + CHANGELOG (T018–T020)

**Suggested MVP**: T001–T010 (US1 peer live video + share audio).
