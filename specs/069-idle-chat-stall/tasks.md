---
description: "Task list for Mensagens após inatividade / idle chat stall (069)"
---

# Tasks: Mensagens após inatividade (stall)

**Input**: Design documents from `/specs/069-idle-chat-stall/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) A–F; `cd frontend && npx tsc --noEmit`. FE-primary (no new BE contract tests for MVP).

**Organization**: Setup → Foundational (WS reconnect + status) → US1 receive after idle + catch-up → US2 delivery banner → US3 unlock/reload boundary → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/api/ws.ts`, `frontend/src/App.tsx`, `frontend/src/pages/Channel.tsx`, `frontend/src/pages/ChannelRoute.tsx`, `frontend/src/lib/messageCatchUp.ts`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and current live-delivery failure mode.

- [X] T001 Confirm `.specify/feature.json` → `specs/069-idle-chat-stall` and skim `frontend/src/api/ws.ts` + WS effect in `frontend/src/App.tsx` (single `connectWs`, no reconnect on `close`) against [research.md](./research.md) R1

**Checkpoint**: Confirmed root cause = dead socket without reconnect.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reconnecting WebSocket + status signal — **blocks** Channel catch-up and banner.

**⚠️ CRITICAL**: Do not ship Channel UI changes until reconnect + status exist.

- [X] T002 Extend `frontend/src/api/ws.ts` with reconnect-on-unexpected-close, exponential backoff (capped), intentional `close()` that stops the loop, and keepalive `"ping"` while `OPEN` per [contracts/live-delivery-recovery.md](./contracts/live-delivery-recovery.md) / [research.md](./research.md) R6
- [X] T003 Expose `LiveDeliveryStatus` (`connected` | `reconnecting` | `disconnected`) from `frontend/src/api/ws.ts` (callback and/or returned handle) per [data-model.md](./data-model.md)
- [X] T004 Wire reconnecting WS in `frontend/src/App.tsx` (replace one-shot `connectWs`); keep listener fan-out; stop loop on logout / effect cleanup; hold a Solid signal (or equivalent) for delivery status

**Checkpoint**: Socket recovers after DevTools close without F5; status updates; no unlock prompt on reconnect alone.

---

## Phase 3: User Story 1 - Continuar a ver mensagens novas após idle (Priority: P1) 🎯 MVP

**Goal**: After idle / WS drop, messages appear again via auto reconnect + incremental catch-up without F5 or send.

**Independent Test**: [quickstart.md](./quickstart.md) A + B (+ C merge).

### Implementation for User Story 1

- [X] T005 [P] [US1] Add merge/dedupe helper in `frontend/src/lib/messageCatchUp.ts` (append only messages whose `id` ∉ local timeline; preserve chrono order) per [research.md](./research.md) R2 / FR-002a
- [X] T006 [US1] In `frontend/src/pages/Channel.tsx`, on delivery `connected` (after was down) and on `visibilitychange`/`online`, fetch `GET /api/channels/{id}/messages`, decode/decrypt, merge via helper — **no** full `setMessages` wipe of already-loaded history
- [X] T007 [US1] Pass delivery status (and/or reconnect tick) from `frontend/src/App.tsx` through `frontend/src/pages/ChannelRoute.tsx` into `frontend/src/pages/Channel.tsx` so catch-up can subscribe
- [X] T008 [US1] Ensure catch-up / reconnect path never calls unlock and never requires the user to send a message (`frontend/src/pages/Channel.tsx`, `frontend/src/App.tsx`) — FR-003 / FR-006

**Checkpoint**: Idle or forced WS drop → B sends → A sees messages ≤10s after link usable, without F5/unlock/send.

---

## Phase 4: User Story 2 - Saber quando o chat não está a receber actualizações (Priority: P2)

**Goal**: Non-modal banner in channel chrome while delivery is interrupted; clears after recovery + catch-up.

**Independent Test**: [quickstart.md](./quickstart.md) E (+ B banner phase).

### Implementation for User Story 2

- [X] T009 [P] [US2] Add `.channel-delivery-banner` (or equivalent) styles in `frontend/src/styles/mesa-theme.css` — discrete strip, not modal
- [X] T010 [US2] Show/hide delivery banner in `frontend/src/pages/Channel.tsx` from `LiveDeliveryStatus` (reconnecting/disconnected); composer stays usable; clear when connected and catch-up for this channel finished per FR-004 / [contracts/live-delivery-recovery.md](./contracts/live-delivery-recovery.md)

**Checkpoint**: Degraded state shows banner; healthy state has no lingering banner.

---

## Phase 5: User Story 3 - Reload completo vs. idle (Priority: P3)

**Goal**: Reconnect does not unlock; F5 may still ask to desbloquear (unchanged security).

**Independent Test**: [quickstart.md](./quickstart.md) F + reconnect path without unlock.

### Implementation for User Story 3

- [X] T011 [US3] Verify reconnect/catch-up in `frontend/src/App.tsx` / `frontend/src/pages/Channel.tsx` never clears `identity` or forces Auth unlock UI; document smoke in quickstart F only (no identity persistence across F5)
- [X] T012 [US3] Confirm intentional App cleanup / logout still closes WS and stops reconnect loop in `frontend/src/App.tsx` (no zombie reconnect after logout)

**Checkpoint**: F5 unlock still possible; idle recovery never prompts unlock.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Background/focus polish, validation, docs on implement.

- [X] T013 Ensure `visibilitychange` (visible) and `window` `online` trigger reconnect attempt (if needed) + Channel catch-up in `frontend/src/api/ws.ts` and/or `frontend/src/pages/Channel.tsx` per FR-008 / [research.md](./research.md) R4
- [X] T014 Run `cd frontend && npx tsc --noEmit` and fix errors from ws/App/Channel/catch-up
- [X] T015 [P] Smoke [quickstart.md](./quickstart.md) A–F manually
- [X] T016 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when `/speckit-implement` completes

**Checkpoint**: Feature ready for implement completion report.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **BLOCKS** US1–US3
- **US1 (Phase 3)**: After Foundational — MVP (reconnect + catch-up)
- **US2 (Phase 4)**: After status signal (T003/T004); can follow US1 closely
- **US3 (Phase 5)**: After US1 reconnect path exists (verify-only)
- **Polish (Phase 6)**: After desired stories

### User Story Dependencies

- **US1 (P1)**: Foundational reconnect — MVP
- **US2 (P2)**: Needs `LiveDeliveryStatus` from foundational; banner on Channel after T007 props exist
- **US3 (P3)**: Verification against US1 behavior; no separate feature surface

### Parallel Opportunities

- T005 messageCatchUp helper ∥ early T009 CSS (after T004 status exists for wiring)
- After T004: T005 can proceed while T007 prop plumbing is designed
- T015 quickstart ∥ T016 docs (on implement)

### Parallel Example: Foundational

```bash
Task: "Extend reconnect in frontend/src/api/ws.ts"
Task: "Expose LiveDeliveryStatus in frontend/src/api/ws.ts"
# then App wiring T004 sequential
```

---

## Implementation Strategy

### MVP First (US1)

1. Phase 1–2 → reconnecting WS + status  
2. Phase 3 US1 → Channel catch-up + prop wiring  
3. **STOP** — validate quickstart A/B/C  

### Incremental Delivery

1. US1 reconnect + catch-up  
2. US2 banner  
3. US3 unlock/reload verify  
4. Polish visibility/online + tsc + daily/CHANGELOG on implement  

### Suggested MVP scope

**US1** (T001–T008) — messages return after idle without F5. Include working reconnect from Phase 2.

---

## Notes

- FE-primary; optional BE `after=` only if >1 list page gaps appear (not in this task list)
- Do not invent send-to-recover or persist unlock across F5
- Voice channels out of scope
- Format validation: all tasks use `- [ ]`, `Tnnn`, optional `[P]`, story `[USn]` on story phases, concrete paths
