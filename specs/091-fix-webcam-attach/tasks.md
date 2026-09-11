---
description: "Task list for 091-fix-webcam-attach"
---

# Tasks: Restore Reliable Webcam Display After Screen-Share Work

**Input**: Design documents from `/specs/091-fix-webcam-attach/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) + `npx tsc --noEmit`. No formal TDD requested in spec.

**Organization**: Setup → Foundational (local preview coherence + host rebind) → US1 local self-view → US2 remote/peer cams → US3 share independence → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/voice/VoiceSession.tsx`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/components/CameraGrid.tsx`, `frontend/src/video/liveClient.ts`, `frontend/src/shell/FloatingVoicePip.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Lock feature pointer and confirm defect hotspots from research.

- [x] T001 Confirm `.specify/feature.json` → `specs/091-fix-webcam-attach` and map `toggleCam` / page `localVideoEl` / `layoutMedia` / `attachSlot` / `attachGradeTile` in `frontend/src/voice/VoiceSession.tsx` + `frontend/src/pages/VoiceChannel.tsx` against [research.md](./research.md) R1–R7 and [contracts/local-preview-coherence.md](./contracts/local-preview-coherence.md)

**Checkpoint**: Clear map of split-brain mid-call path and host-before-layout race.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Canonical local preview + layout that rebinds on host mount — **blocks** reliable Composition/Grade cams for all stories.

**⚠️ CRITICAL**: No user-story validation until session preview and page layout share one source of truth and hosts trigger re-layout.

- [x] T002 Make `layoutMedia` in `frontend/src/pages/VoiceChannel.tsx` use `voice.localVideoEl()` as the canonical local camera preview (keep page cache only if synced on every use) per [contracts/local-preview-coherence.md](./contracts/local-preview-coherence.md) and [data-model.md](./data-model.md)
- [x] T003 In `toggleCam` in `frontend/src/voice/VoiceSession.tsx`, after attaching/enabling the local camera mid-call, call `dispatchLocalTrack` / `handlers.onLocalTrack` (same as join) so the voice page learns the element (FR-008, FR-010)
- [x] T004 Sync page `localVideoEl` from session whenever `voice.camOn()` or `voice.localVideoEl()` changes in `frontend/src/pages/VoiceChannel.tsx` (createEffect / existing cam effect), then `refreshGradeLists` + `queueMicrotask(layoutMedia)`
- [x] T005 Verify `attachSlot` / `attachGradeTile` in `frontend/src/pages/VoiceChannel.tsx` always schedule `layoutMedia` on host mount/remount; clear or overwrite stale `slotEls` / `gradeTileEls` entries when tiles remount per [contracts/host-mount-rebind.md](./contracts/host-mount-rebind.md) (FR-009)
- [x] T006 [P] Confirm Composition ↔ Grade and Grade list refresh paths in `frontend/src/pages/VoiceChannel.tsx` + `frontend/src/components/CameraGrid.tsx` still invoke attach refs after remount (spotlight/share/list change); fix only if refs skip re-attach

**Checkpoint**: Mid-call cam enable notifies page; layout reads session preview; host mount rebinds.

---

## Phase 3: User Story 1 - Camera shows on open without workarounds (Priority: P1) 🎯 MVP

**Goal**: Local webcam appears in Composition and Grade within ~2 s on join/cam-on and mid-call toggle—without leave/rejoin or screen share.

**Independent Test**: [quickstart.md](./quickstart.md) §1–§3; SC-001, SC-006; FR-001, FR-002, FR-008, FR-014.

### Implementation for User Story 1

- [x] T007 [US1] Ensure join `onLocalTrack` path in `frontend/src/pages/VoiceChannel.tsx` (and `frontend/src/video/liveClient.ts` if needed) still sets session + page preview and runs layout so join-with-cam meets ≤ ~2 s in Composition and Grade (SC-001)
- [x] T008 [US1] Ensure mid-call enable from UserPanel → `toggleCam` ends with self-view in both modes within ~2 s in `frontend/src/voice/VoiceSession.tsx` + `frontend/src/pages/VoiceChannel.tsx` (SC-006; no share/rejoin)
- [x] T009 [US1] On cam off / leave, clear page + session local preview coherently in `frontend/src/pages/VoiceChannel.tsx` / `frontend/src/voice/VoiceSession.tsx` so next enable rebinds (no permanent orphan)

**Checkpoint**: Local self-view reliable in Composition + Grade; share not required to wake.

---

## Phase 4: User Story 2 - Peer cameras and both sides stay reliable (Priority: P1)

**Goal**: Remote cams bind when track + host ready (≤ ~2 s); both sides visible without share/rejoin.

**Independent Test**: Quickstart §4; SC-002; FR-003, FR-015; host rebind for remotes.

### Implementation for User Story 2

- [x] T010 [US2] Confirm `placeTrack` + `layoutMedia` in `frontend/src/pages/VoiceChannel.tsx` place remote cam tracks when `gradeTileEls` / `slotEls` hosts appear later (re-layout on attach; FR-009, FR-015)
- [x] T011 [US2] After Grade remount / list change, ensure existing `remotesCam` entries re-attach into new hosts in `frontend/src/pages/VoiceChannel.tsx` without requiring screen-share start (US2 acceptance scenario 3)
- [x] T012 [P] [US2] Spot-check two-browser path: peer cam-on while already in call shows remote video ≤ ~2 s after track+host in Composition and Grade (manual; fix attach gaps in `VoiceChannel.tsx` if found)

**Checkpoint**: Local + remote cams visible without leave/rejoin or share catalyst.

---

## Phase 5: User Story 3 - Screen share still works and is not required for cameras (Priority: P2)

**Goal**: Cams work with zero shares; start/stop share does not permanently blank cams (≤ ~1 s flash OK); share tiles still work.

**Independent Test**: Quickstart §5–§6; SC-003, SC-004, SC-007; FR-005, FR-011, FR-013.

### Implementation for User Story 3

- [x] T013 [US3] With zero shares, verify cams still bind via US1/US2 paths in `frontend/src/pages/VoiceChannel.tsx` (SC-003)—no code path that requires `screenOn` to layout cams
- [x] T014 [US3] After start/stop share (and spotlight toggle if available), ensure `layoutMedia` rebinds cams within ≤ ~1 s blank in `frontend/src/pages/VoiceChannel.tsx` (FR-013, SC-007); preserve 088 screen clear behavior
- [x] T015 [US3] Mode switch Composition ↔ Grade with cams on restores video without rejoin in `frontend/src/pages/VoiceChannel.tsx` (FR-004; quickstart §6)

**Checkpoint**: Share remains usable; cams independent of share; remount recover ≤1 s.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Typecheck, PiP regression, docs, mark tasks.

- [x] T016 Run `cd frontend && npx tsc --noEmit`
- [x] T017 [P] PiP regression check: cam-on Floating PiP still shows video via `voice.localVideoEl()` in `frontend/src/shell/FloatingVoicePip.tsx` without requiring changes unless accidentally broken (FR-012; quickstart §7)
- [x] T018 Run manual scenarios in [quickstart.md](./quickstart.md) (SC-001 sample + mid-call + two-user + share remount) and record pass/fail
- [x] T019 [P] Update `docs/daily/2026-09-10.md` Speckit implement subsection for 091 (on implement complete)
- [x] T020 [P] Update `CHANGELOG.md` `[Unreleased]` Fixed for 091 webcam attach/rebind
- [x] T021 Mark all tasks `[x]` in `specs/091-fix-webcam-attach/tasks.md` after implement + validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** → **Phase 2 (Foundational)** → blocks all stories
- **Phase 3 (US1)** → MVP; depends on T002–T006
- **Phase 4 (US2)** → depends on foundational rebind; builds on US1 layout path
- **Phase 5 (US3)** → depends on US1/US2 bind working; guards share independence
- **Phase 6 (Polish)** → after desired stories validated

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — local preview coherence (T002–T004) + host rebind (T005–T006)
- **US2 (P1)**: After Phase 2; same `layoutMedia` for remotes; can overlap polishing with US1 if T002–T006 done
- **US3 (P2)**: After US1 cams work without share; validates remount budgets and share integrity

### Within Each Story

- Foundational sync before story-specific acceptance
- Local (US1) before relying on two-browser (US2) for full SC-002
- Share remount (US3) after cams bind without share

### Parallel Opportunities

- T006 can proceed alongside T002–T004 if CameraGrid-only
- T012 manual spot-check after T010–T011
- T017 / T019 / T020 after T016 (docs parallel)

---

## Parallel Example: Foundational

```bash
# After T002–T003 land session↔page coherence:
Task: "T005 host-mount layout schedule in VoiceChannel.tsx"
Task: "T006 [P] CameraGrid ref re-attach after remount"
```

---

## Parallel Example: User Story 2

```bash
Task: "T010 placeTrack + later host rebind"
Task: "T011 remotesCam re-attach after Grade remount"
# Then T012 two-browser manual check
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2 (T001–T006)
2. Phase 3 US1 (T007–T009)
3. **STOP**: Quickstart §1–§3 (Composition + Grade + mid-call)
4. Demo local fix before peer/share polish

### Incremental Delivery

1. Foundation → local preview + host rebind
2. US1 → local cams reliable (MVP)
3. US2 → remote cams + two-user
4. US3 → share not required; remount ≤1 s
5. Polish → tsc, PiP, daily, CHANGELOG

### Suggested MVP Scope

**T001–T009** (Setup + Foundational + US1): local Composition/Grade + mid-call without share/rejoin.

---

## Notes

- No automated contract tests required by spec; manual quickstart is the gate
- Do not “fix” cams by forcing a share remount as the primary path
- PiP is out of scope except regression (T017)
- Budgets: local ≤2 s; remount ≤1 s; remote ≤2 s after track+host
