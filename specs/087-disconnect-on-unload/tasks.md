---
description: "Task list for 087-disconnect-on-unload"
---

# Tasks: Disconnect Voice Session on Browser Unload

**Input**: Design documents from `/specs/087-disconnect-on-unload/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Contract tests in `backend/tests/contract/voice_occupancy.rs` + manual [quickstart.md](./quickstart.md) + `tsc --noEmit`. Formal TDD only where tasks say so.

**Organization**: Setup → Foundational (keepalive leave API + stale sweeper) → US1 refresh → US2 tab/browser close → US3 intentional leave → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/api/client.ts`, `frontend/src/voice/VoiceSession.tsx`, `backend/src/api/voice.rs`, `backend/src/main.rs` (or app bootstrap), `backend/src/domain/voice_occupancy.rs`, `backend/tests/contract/voice_occupancy.rs`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and current ghost hotspots.

- [x] T001 Confirm `.specify/feature.json` → `specs/087-disconnect-on-unload` and skim `pagehide` → `hangup` / `leaveVoice` in `frontend/src/voice/VoiceSession.tsx` + `expire_stale` call sites in `backend/src/api/voice.rs` against [research.md](./research.md) R1–R6

**Checkpoint**: Clear map of unload leave gap and request-only stale expire.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Keepalive leave helper + server stale sweeper with broadcast — **blocks** reliable US1–US2 outcomes.

**⚠️ CRITICAL**: Dual path required (FR-006/008): client unload leave **and** proactive server cleanup.

- [x] T002 Add `leaveVoiceKeepalive(channelId)` (or extend leave with keepalive option) in `frontend/src/api/client.ts` using `fetch` + `credentials: "include"` + `keepalive: true` to `POST /api/channels/{id}/voice/leave` per [contracts/unload-leave-client.md](./contracts/unload-leave-client.md) UL-01
- [x] T003 [P] Confirm `OCCUPANT_STALE_SECS` ≤ 60 in `backend/src/domain/voice_occupancy.rs` (keep ~45 unless change needed) per [contracts/stale-occupancy-server.md](./contracts/stale-occupancy-server.md) SO-02
- [x] T004 Expose/reuse `expire_stale` + `apply_leave` from `backend/src/api/voice.rs` (or shared module) so a background task can remove stale occupants and **broadcast** `voice.occupancy` (SO-01, SO-04)
- [x] T005 Start a periodic stale occupancy sweeper (interval ~15–30s) from `backend/src/main.rs` (or app startup with `AppState`) calling the expire path from T004 (SO-03, SO-06; research R3)

**Checkpoint**: Keepalive leave callable from FE; server sweeper runs without peer join/GET.

---

## Phase 3: User Story 1 - Refresh does not leave a ghost (Priority: P1) 🎯 MVP

**Goal**: Refresh while in call clears occupancy for peers quickly via unload leave.

**Independent Test**: [quickstart.md](./quickstart.md) §1; UL-01–UL-03; SC-001.

### Implementation for User Story 1

- [x] T006 [US1] Change `onPageHide` in `frontend/src/voice/VoiceSession.tsx` to fire `leaveVoiceKeepalive(channelId)` **first** when `live()` (do not await heavy `releaseLocalCapture` before leave); then best-effort local teardown / hangup without blocking leave (UL-01–UL-02; research R2)
- [x] T007 [US1] Ensure unload leave is idempotent with later `hangup`/`leaveVoice` in `frontend/src/voice/VoiceSession.tsx` (flag or swallow duplicate leave errors) (UL-04, FR-005)
- [x] T008 [P] [US1] Extend or add contract coverage in `backend/tests/contract/voice_occupancy.rs` for leave idempotency and stale removal broadcasting as needed for refresh/stale safety (SO-05)

**Checkpoint**: Refresh → peer stops seeing occupant within ~10s when leave succeeds.

---

## Phase 4: User Story 2 - Closing tab or browser clears the session (Priority: P1)

**Goal**: Tab/browser close uses the same reliable unload leave; multi-tab does not keep ghost presence.

**Independent Test**: Quickstart §2–§3; UL-06; SC-002.

### Implementation for User Story 2

- [x] T009 [US2] Confirm `pagehide` covers tab close / window close in `frontend/src/voice/VoiceSession.tsx` (same keepalive leave path as US1); document only if a second event is required for a specific browser (FR-002)
- [x] T010 [US2] Verify one-call-per-account: unload leave clears the account occupancy row so another open Mesa tab cannot keep “in call” without rejoin (`backend` leave + FE state); adjust only if a bug remains in `VoiceSession.tsx` / occupancy leave (UL-06, FR-007)

**Checkpoint**: Tab close clears presence; second Mesa tab is not a ghost call.

---

## Phase 5: User Story 3 - Intentional leave still works (Priority: P2)

**Goal**: In-app Leave/hangup unchanged and safe with unload path.

**Independent Test**: Quickstart §4; UL-04; SC-004.

### Implementation for User Story 3

- [x] T011 [US3] Keep in-app `hangup()` in `frontend/src/voice/VoiceSession.tsx` releasing local capture then `leaveVoice` as today; ensure unload keepalive does not break or require auth cookie clear (UL-04–UL-05)
- [x] T012 [US3] After intentional leave, subsequent `pagehide` must no-op or idempotent leave when not `live()` in `frontend/src/voice/VoiceSession.tsx` (FR-005)

**Checkpoint**: Leave button still clears presence; unload after leave is harmless.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Stale kill path, typecheck, tests, mark tasks.

- [x] T013 [P] Validate abrupt-kill / blocked-leave path still clears via sweeper within ~1 min (quickstart §5); tune sweeper interval or TTL in `backend/src/domain/voice_occupancy.rs` / startup only if needed (SC-005/006)
- [x] T014 Run `cd backend && cargo test --test voice_occupancy` (or project’s voice occupancy test target) and fix failures
- [x] T015 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and fix errors from client/VoiceSession changes
- [x] T016 Manually walk [quickstart.md](./quickstart.md) scenarios 1–5; fix regressions
- [x] T017 [P] Mark completed tasks in `specs/087-disconnect-on-unload/tasks.md` as work finishes (implement phase)

**Checkpoint**: Ready for `/speckit-implement` (daily + CHANGELOG on successful implement).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundation (T002–T005)** → US1
- **US1** (T006–T008): needs T002 (keepalive) ; sweeper T004–T005 strongly preferred before polish §5
- **US2** (T009–T010): after US1 pagehide path
- **US3** (T011–T012): after US1 unload changes
- **Polish**: after stories

### User Story Dependencies

```text
Foundation → US1 → US2 → US3 → Polish
```

### Parallel Opportunities

- T003 ∥ T002
- T004–T005 (BE sweeper) ∥ T002 (FE keepalive) after T001
- T008 ∥ T006–T007 once leave API stable
- T013 ∥ T014–T015
- T017 ∥ T014–T016

### Parallel Example

```bash
# After T001:
# Dev A: T002 + T006–T007 (FE keepalive unload leave)
# Dev B: T003–T005 (TTL + expire_stale sweeper)
# Then US2/US3 + cargo test / tsc / quickstart
```

### Independent Test Criteria

| Story | Test |
|-------|------|
| US1 | Quickstart 1 — refresh clears peer view ≤10s |
| US2 | Quickstart 2–3 — tab close + multi-tab |
| US3 | Quickstart 4 — Leave button still works |

### Suggested MVP

**Foundation + US1** (T002–T007, ideally T004–T005) — keepalive leave on refresh + sweeper. Next: US2/US3 → Polish.

---

## Implementation Strategy

1. Keepalive leave helper + server stale sweeper with broadcast.
2. `pagehide` fires leave first (MVP refresh fix).
3. Confirm tab close / multi-tab / intentional leave.
4. Contract tests + `tsc` + quickstart 1–5; implement updates daily + CHANGELOG.

---

## Notes

- Do not clear Mesa auth on unload (UL-05).
- Format validation: all tasks use `- [ ]`, IDs T001–T017, story labels on US phases only, file paths in every description.
