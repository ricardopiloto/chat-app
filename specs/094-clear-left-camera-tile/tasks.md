---
description: "Task list for 094-clear-left-camera-tile"
---

# Tasks: Clear Left Participant Camera from Stage

**Input**: Design documents from `/specs/094-clear-left-camera-tile/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `npx tsc --noEmit`. No formal TDD requested in spec.

**Organization**: Setup → Foundational (scrub helper + verify LiveKit wiring) → US1 peer leave clear → US2 leaver path / rejoin → US3 cam-off ≠ leave → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/pages/VoiceChannel.tsx`, `frontend/src/shell/FloatingVoicePip.tsx`, `frontend/src/video/liveClient.ts`, `frontend/src/components/CameraGrid.tsx` (only if needed)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and frozen-frame hotspots.

- [x] T001 Confirm `.specify/feature.json` → `specs/094-clear-left-camera-tile` and skim `remotesCam` / `removeTrack` / `clearRemoteParticipantMedia` / `refreshGradeLists` / `clearOrphanVideos` in `frontend/src/pages/VoiceChannel.tsx`, PIP tile refresh in `frontend/src/shell/FloatingVoicePip.tsx`, and unsubscribe/disconnect wiring in `frontend/src/video/liveClient.ts` against [research.md](./research.md) R1–R8

**Checkpoint**: Clear map of Map-delete vs missing DOM scrub / PIP disconnect gaps.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Identity-scoped video scrub + confirmed LiveKit callbacks — **blocks** reliable Grade/Composição/PIP clear.

**⚠️ CRITICAL**: Scrub + disconnect paths must exist before story polish.

- [x] T002 Verify `joinLiveRoom` already fires `onTrackUnsubscribed` (detach) and `onParticipantDisconnected` in `frontend/src/video/liveClient.ts`; harden only if detach/callback gaps remain ([contracts/stage-camera-clear-on-leave.md](./contracts/stage-camera-clear-on-leave.md))
- [x] T003 Add identity-scoped scrub helper in `frontend/src/pages/VoiceChannel.tsx` (e.g. clear `<video>` from grade/slot hosts for a departed identity; reuse/extend `clearOrphanVideos`) per research R6
- [x] T004 Call scrub from `removeTrack` (camera tracks) and `clearRemoteParticipantMedia` in `frontend/src/pages/VoiceChannel.tsx`, then `refreshGradeLists` + `scheduleLayout` (FR-001, FR-009)

**Checkpoint**: Camera unsubscribe/disconnect always scrubs DOM + refreshes lists.

---

## Phase 3: User Story 1 - Peer leave clears their frozen camera (Priority: P1) 🎯 MVP

**Goal**: Viewers lose peer’s frozen camera on Grade, Composição, and PIP within ~2s of observable leave.

**Independent Test**: [quickstart.md](./quickstart.md) §1–§3, §6; SC-001–SC-003, SC-006; stage + PIP contracts.

### Implementation for User Story 1

- [x] T005 [US1] Harden `clearRemoteParticipantMedia` / `refreshGradeLists` in `frontend/src/pages/VoiceChannel.tsx` so a disconnected identity cannot remain in `gradeCameraIds` (no re-add via stale state; still allow in-call cam-off remotes via `remoteParticipants`) (FR-002, research R3)
- [x] T006 [US1] On leave/scrub, clear Composition slot **video** for that identity even if grid `account_id` briefly remains (empty/free OK; no frozen frame) in `frontend/src/pages/VoiceChannel.tsx` (FR-003, research R4)
- [x] T007 [US1] Clear camera `spotlightId` / hero selection when it referenced the departed identity in `frontend/src/pages/VoiceChannel.tsx` (FR-007, research R8)
- [x] T008 [P] [US1] Add `RoomEvent.ParticipantDisconnected` (and keep TrackUnsubscribed) refresh in `frontend/src/shell/FloatingVoicePip.tsx`; prune `tileEls` + `detachTileMedia` for ids no longer in `tiles()` (FR-008; [contracts/pip-camera-clear-on-leave.md](./contracts/pip-camera-clear-on-leave.md) PIP-01–PIP-03)

**Checkpoint**: Peer leave → Grade tile gone, Composição no freeze, PIP clear ≤ ~2s.

---

## Phase 4: User Story 2 - My own leave does not leave a ghost for others (Priority: P1)

**Goal**: Leaver’s hangup/unload clears their camera for peers; rejoin shows a fresh live tile.

**Independent Test**: Quickstart §1 (A leaves) + §5 rejoin; SC-001, SC-005; PIP-04.

### Implementation for User Story 2

- [x] T009 [US2] Verify hangup / 087 unload leave path triggers peer-side disconnect cleanup (no extra API); fix `VoiceChannel`/`liveClient` only if peers miss `ParticipantDisconnected` for graceful hangup in `frontend/src/pages/VoiceChannel.tsx` / `frontend/src/video/liveClient.ts` (FR-004, FR-006)
- [x] T010 [US2] Ensure local hangup clears local PIP/self preview so no frozen local tile remains after call end in `frontend/src/shell/FloatingVoicePip.tsx` / hangup teardown (PIP-04; research open item)
- [x] T011 [US2] Confirm rejoin + cam on adds a single fresh tile via clean `remotesCam` / grade lists in `frontend/src/pages/VoiceChannel.tsx` (FR-006, SC-005)

**Checkpoint**: A leaves → B clean; A rejoins → one live tile.

---

## Phase 5: User Story 3 - Camera off while still in call is not confused with leave (Priority: P2)

**Goal**: Cam off keeps in-call presence; leave still fully clears video/tiles.

**Independent Test**: Quickstart §4; SC-004; FR-005.

### Implementation for User Story 3

- [x] T012 [US3] Ensure camera **TrackUnsubscribed** while participant still in `remoteParticipants` does **not** remove Grade membership solely for cam-off (preserve avatar/in-call seat) in `frontend/src/pages/VoiceChannel.tsx` (FR-005, research R2)
- [x] T013 [US3] Ensure leave after cam-on still runs full scrub + Grade drop (regression check vs T005–T006) in `frontend/src/pages/VoiceChannel.tsx`

**Checkpoint**: Cam-off ≠ leave; leave still clears freeze.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Typecheck, quickstart, docs.

- [x] T014 Run `cd frontend && npx tsc --noEmit`
- [x] T015 Walk [quickstart.md](./quickstart.md) scenarios 1–5 (and §6 if feasible)
- [x] T016 [P] Update `docs/daily/yyyy-mm-dd.md` Speckit implement subsection for 094 (use session calendar date on implement)
- [x] T017 [P] Update `CHANGELOG.md` `[Unreleased]` Fixed for 094 frozen camera clear on leave
- [x] T018 Mark all tasks `[x]` in `specs/094-clear-left-camera-tile/tasks.md` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** (blocks stories) → **Phase 3 (US1 MVP)** → **Phase 4 (US2)** → **Phase 5 (US3)** → **Phase 6**
- US2 builds on US1 peer-side cleanup
- US3 is a guardrail against over-aggressive tile removal on cam-off

### User Story Dependencies

- **US1**: After Phase 2
- **US2**: After US1 scrub/list harden
- **US3**: After US1 (and preferably US2)

### Parallel Opportunities

- T008 (PIP) parallel to T005–T007 (`VoiceChannel`) after T003–T004
- T016 / T017 after T014–T015

---

## Parallel Example: User Story 1

```bash
# After foundational scrub helper exists:
Task: "Harden gradeCameraIds on disconnect in frontend/src/pages/VoiceChannel.tsx"
Task: "PIP ParticipantDisconnected + prune tileEls in frontend/src/shell/FloatingVoicePip.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1–2: verify LiveKit wiring; add scrub; call from remove/clear
2. Phase 3: Grade + Composição + PIP peer leave
3. **STOP** — two-browser quickstart §1–§3

### Incremental Delivery

1. MVP = peer leave clear (US1)
2. Harden leaver/rejoin (US2)
3. Cam-off guardrail (US3) + polish

### Notes

- No backend tasks
- Parallel to 088 screen clear; camera + leave focused
- Preserve in-call cam-off seats; Composition empty/free without video is OK
