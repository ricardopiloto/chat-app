---
description: "Task list for 088-clear-ended-screen-tile"
---

# Tasks: Clear Ended Screen Share from Grade

**Input**: Design documents from `/specs/088-clear-ended-screen-tile/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `npx tsc --noEmit`. No formal TDD requested in spec.

**Organization**: Setup → Foundational (unsubscribe wiring) → US1 local stop → US2 viewer clear → US3 re-share → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/video/liveClient.ts`, `frontend/src/voice/VoiceSession.tsx`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/shell/Sidebar.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and ghost-tile hotspots.

- [x] T001 Confirm `.specify/feature.json` → `specs/088-clear-ended-screen-tile` and skim `placeTrack` / `remotesScreen` / `joinLiveRoom` TrackSubscribed-only path in `frontend/src/pages/VoiceChannel.tsx` + `frontend/src/video/liveClient.ts` against [research.md](./research.md) R1–R5

**Checkpoint**: Clear map of missing TrackUnsubscribed → stale Grade screen tiles.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: LiveKit unsubscribe callback plumbing — **blocks** reliable viewer Grade clear (US2) and clean re-share (US3).

**⚠️ CRITICAL**: Subscribe/unsubscribe must be symmetric before story polish.

- [x] T002 Add optional `onTrackUnsubscribed?: (track, participant) => void` to `joinLiveRoom` in `frontend/src/video/liveClient.ts` and register `RoomEvent.TrackUnsubscribed` (detach/callback) per [contracts/grade-screen-clear.md](./contracts/grade-screen-clear.md)
- [x] T003 Extend `VoiceTrackHandlers` + `dispatchTrackUnsubscribed` (or equivalent) in `frontend/src/voice/VoiceSession.tsx` so channel handlers receive unsubscribe events
- [x] T004 Wire `onTrackUnsubscribed` from `joinLiveRoom` call site in `frontend/src/pages/VoiceChannel.tsx` through `voice.dispatchTrackUnsubscribed` (mirror `onTrack`)

**Checkpoint**: Unsubscribe events reach VoiceChannel.

---

## Phase 3: User Story 1 - Stop share removes my screen tile (Priority: P1) 🎯 MVP

**Goal**: In-app or browser stop clears local Grade screen tile + share indicators.

**Independent Test**: [quickstart.md](./quickstart.md) §1–§2; SC-001, SC-005, SC-006 (sharer).

### Implementation for User Story 1

- [x] T005 [US1] Verify/ harden `stopScreenShare` in `frontend/src/voice/VoiceSession.tsx`: clear local screen el, `screenOn=false`, LiveKit disable, `patchVoiceMedia({ screen_on: false })` on both in-app toggle and track `ended` (FR-001, FR-007, FR-008; [contracts/share-indicators-clear.md](./contracts/share-indicators-clear.md))
- [x] T006 [US1] Ensure `refreshGradeLists` in `frontend/src/pages/VoiceChannel.tsx` drops `me.id` from `gradeScreenIds` when `voice.screenOn()` is false and clears spotlight if it pointed at local screen (FR-002, FR-006)

**Checkpoint**: Sharer Grade + indicators clear without refresh.

---

## Phase 4: User Story 2 - Viewers lose the ended share tile (Priority: P1)

**Goal**: Remote Grade drops ended screen tile; camera remains; spotlight empty share clears.

**Independent Test**: Quickstart §1 viewer; SC-002–SC-003, SC-005–SC-006.

### Implementation for User Story 2

- [x] T007 [US2] Implement `removeTrack` (or `placeTrack` inverse) in `frontend/src/pages/VoiceChannel.tsx`: on ScreenShare unsubscribe, remove track from `remotesScreen`, delete empty keys, `refreshGradeLists` + `layoutMedia` (FR-001–FR-004)
- [x] T008 [US2] On screen clear, clear `spotlightId` when it referenced the ended screen identity in `frontend/src/pages/VoiceChannel.tsx` (FR-006; already partially via `refreshGradeLists` / occupancy WS)
- [x] T009 [P] [US2] Confirm Sidebar/channel share indicators clear via occupancy `screen_on` in `frontend/src/shell/Sidebar.tsx` + `applyOccupancyScreenFlag` in `VoiceChannel.tsx` after publisher patch (FR-007); fix only if a bug remains

**Checkpoint**: Viewer Grade has no ghost «Tela» tile; indicators off.

---

## Phase 5: User Story 3 - Starting share again works cleanly (Priority: P2)

**Goal**: After stop, re-share yields a single live tile (no zombie duplicate).

**Independent Test**: Quickstart §3; SC-004.

### Implementation for User Story 3

- [x] T010 [US3] Ensure `placeTrack` + empty-key delete leave Maps clean so a new ScreenShare subscribe adds exactly one identity entry in `frontend/src/pages/VoiceChannel.tsx` (FR-005)
- [x] T011 [US3] Optional defensive: on remote participant disconnect, wipe that identity from `remotesScreen` in `frontend/src/pages/VoiceChannel.tsx` / `liveClient.ts` if TrackUnsubscribed alone is insufficient (edge: leave while sharing)

**Checkpoint**: Stop → start again → one live screen tile.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Typecheck, docs, mark tasks.

- [x] T012 Run `cd frontend && npx tsc --noEmit`
- [x] T013 [P] Update `docs/daily/2026-09-10.md` Speckit implement subsection for 088
- [x] T014 [P] Update `CHANGELOG.md` `[Unreleased]` Fixed for 088 ghost screen tile clear
- [x] T015 Mark all tasks `[x]` in `specs/088-clear-ended-screen-tile/tasks.md`

---

## Dependencies & Execution Order

- Phase 1 → 2 → 3 (MVP) → 4 → 5 → 6
- US2 depends on T002–T004
- US1 can validate local path after T005–T006 even before unsubscribe if local-only; full E2E needs Phase 2
- US3 depends on US2 map cleanup

## Parallel Opportunities

- T009 vs T007–T008 (different files)
- T013 / T014 after T012

## Implementation Strategy

**MVP**: T001–T008 (unsubscribe + local stop + viewer clear). Then US3 + polish.

## MVP scope

User Story 1 + foundational unsubscribe (enables US2).
