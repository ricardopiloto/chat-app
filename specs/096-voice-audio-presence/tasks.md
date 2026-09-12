---
description: "Task list for 096-voice-audio-presence"
---

# Tasks: Voice Audio & Occupant Presence

**Input**: Design documents from `/specs/096-voice-audio-presence/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `cd frontend && npm run build`. No formal TDD in spec.

**Organization**: Setup → Foundational (map audio + presence paths) → **US1 audio** → **US2 presence** → polish. FE-first; backend only if T014 proves needed.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US2]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/pages/VoiceChannel.tsx`, `frontend/src/voice/VoiceSession.tsx`, `frontend/src/video/liveClient.ts`, `frontend/src/lib/safeMedia.ts`, `frontend/src/components/CallBank.tsx`, `frontend/src/components/CameraGrid.tsx`, `frontend/src/shell/Sidebar.tsx`, optionally `backend/src/api/voice.rs`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Lock feature pointer and skim hotspots against research/contracts.

- [X] T001 Confirm `.specify/feature.json` → `specs/096-voice-audio-presence` and skim `placeTrack` / `audioHost` / `refreshInCall` / `refreshGradeLists` / `attachRemote` / `safePlay` / deafen volumes / `deriveBank` / Sidebar `transmitting` in the paths above against [research.md](./research.md) and [contracts/](./contracts/)

**Checkpoint**: Clear map of audio sink vs aura vs bank/Grade refresh gaps.

---

## Phase 2: Foundational — inventory (Blocking)

**Purpose**: Document exact early-return / refresh / publish failure points before coding — **blocks** US1 and US2.

**⚠️ CRITICAL**: Do not ship presence-only or audio-only without knowing both paths.

- [X] T002 Trace remote audio: subscribe → `placeTrack` → `attachRemote` → `.voice-audio-host` → `safePlay`; note deafen `setVolume(0)` and any page-unmount host loss in `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/video/liveClient.ts`, `frontend/src/lib/safeMedia.ts`, `frontend/src/voice/VoiceSession.tsx` (RA-01–04)
- [X] T003 Trace presence: audio early-return skipping `refreshInCall`/`refreshGradeLists`; missing `ParticipantConnected`; `bankIds`/`deriveBank`; Grade list sources; Sidebar roster filter in `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/components/CallBank.tsx`, `frontend/src/components/CameraGrid.tsx`, `frontend/src/shell/Sidebar.tsx` (OP-01–05)
- [X] T004 Confirm server cam-off join stays off primary grid and cam-on patch auto-assigns when unlocked in `backend/src/api/voice.rs` (or tests) — FE-only unless broken (research R9)

**Checkpoint**: Inventory complete; ready for US1.

---

## Phase 3: User Story 1 - Hear call audio (Priority: P1) 🎯 MVP

**Goal**: Bidirectional mic audio audible in browser; aura ≠ success; mute/deafen preserved.

**Independent Test**: [quickstart.md](./quickstart.md) US1; SC-001/SC-002; [contracts/remote-audio-playback.md](./contracts/remote-audio-playback.md), [contracts/mic-publish.md](./contracts/mic-publish.md).

### Implementation for User Story 1

- [X] T005 [US1] Ensure every subscribed remote mic track attaches to a live audio sink while in call (fix missing host / layoutMedia gaps; consider session-level host if page unmounts) in `frontend/src/pages/VoiceChannel.tsx` and/or `frontend/src/voice/VoiceSession.tsx` / `frontend/src/shell/FloatingVoicePip.tsx` as needed (RA-01)
- [X] T006 [US1] Harden `attachRemote` / `safePlay` so play failures are retried on undeafen or normal in-call gesture; keep deafen at volume 0 without breaking aura in `frontend/src/video/liveClient.ts`, `frontend/src/lib/safeMedia.ts`, `frontend/src/voice/VoiceSession.tsx` (RA-02–04, FR-003)
- [X] T007 [US1] Verify/fix local mic publish when product mic is on (incl. cam-off join): `joinLiveRoom` publish / `setMicrophoneEnabled` / prefs after join in `frontend/src/video/liveClient.ts`, `frontend/src/voice/VoiceSession.tsx`, `frontend/src/pages/VoiceChannel.tsx` (MP-01–03, FR-001a)
- [X] T008 [US1] Run `cd frontend && npm run build`; quickstart US1 bidirectional + deafen regression; do not claim done on aura-only

**Checkpoint**: A↔B hear each other; MVP audio ready.

---

## Phase 4: User Story 2 - Cam-off presence (Priority: P1)

**Goal**: Cam-off joiners in Composition bank + Grade/roster; cam on promotes to free seat.

**Independent Test**: Quickstart US2; SC-003–SC-005; [contracts/occupant-presence.md](./contracts/occupant-presence.md).

### Implementation for User Story 2

- [X] T009 [US2] Refresh `inCallIds` / bank on remote participant connect and on audio (and video) subscribe/unsubscribe/disconnect — not only video `placeTrack` — in `frontend/src/pages/VoiceChannel.tsx` (OP-01, R5)
- [X] T010 [US2] Refresh Grade camera identity list the same way so cam-off occupants always appear (video optional) in `frontend/src/pages/VoiceChannel.tsx` / `frontend/src/components/CameraGrid.tsx` (OP-02, FR-005)
- [X] T011 [US2] Confirm cam-off never auto-fills a primary Composition seat solely because seats are free; bank via `deriveBank` in `frontend/src/components/CallBank.tsx` + grid from server (OP-01, clarify B)
- [X] T012 [US2] Align Sidebar voice roster so live cam-off occupants are listed (widen `transmitting` / occupancy filter as needed) in `frontend/src/shell/Sidebar.tsx` (OP-03, FR-005)
- [X] T013 [US2] On cam on: refresh grid/bank so free seat promotes bank→seat with video and no duplicate identity; full seats keep bank+video — wire FE after patch/WS in `frontend/src/pages/VoiceChannel.tsx` (and backend only if assign missing) (OP-04, FR-007)
- [X] T014 [US2] Only if FE cannot see cam-off presence or cam-on assign fails: fix join/patch/occupancy in `backend/src/api/voice.rs`; otherwise skip and note in tasks
- [X] T015 [US2] Run `npm run build`; quickstart US2 + leave clears presence; regression cam on↔off

**Checkpoint**: Cam-off visible bank+Grade+roster; promote rule works.

---

## Phase 5: Polish & docs

**Purpose**: Docs after both stories green.

- [X] T016 [P] Update `docs/daily/2026-09-11.md` (or session date) Speckit implement subsection for 096
- [X] T017 [P] Update `CHANGELOG.md` `[Unreleased]` for voice audio + cam-off presence
- [X] T018 Final sign-off: all required tasks `[X]` in `specs/096-voice-audio-presence/tasks.md`; FR-008 capability checklist from quickstart

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup → Foundational inventory → **US1 (MVP)** → **US2** → docs
- US2 can start after T002/T003; prefer US1 audio sink stable first if sharing `VoiceChannel.tsx`
- T014 only if US2 FE path insufficient

### Parallel Opportunities

- T002 / T003 inventory reads can be parallel
- T016 / T017 parallel at end
- Within US1, T005–T007 touch overlapping files — prefer sequential on `VoiceChannel.tsx`

### Parallel Example: Foundational

```text
T002 audio path trace
T003 presence path trace
(same time; different notes)
```

---

## Implementation Strategy

### MVP

**US1 only**: bidirectional audible mic + deafen/mute preserved.

### Incremental

US2 presence refresh + bank/Grade/roster + promote; then docs.

### Stop conditions

Halt if `npm run build` fails; never treat ActiveSpeakers aura as audio success; never auto-seat cam-off into primary slots.
