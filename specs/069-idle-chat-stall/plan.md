# Implementation Plan: Mensagens após inatividade (stall)

**Branch**: `069-idle-chat-stall` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/069-idle-chat-stall/spec.md`

**Depends on**: Existing text channel live path (`message.new` via `/ws`) and history `GET /api/channels/{id}/messages`.

**Note**: `.specify/feature.json` → `specs/069-idle-chat-stall`. Clarifications: auto reconnect+catch-up; incremental after last visible; ≤10s after link usable; chat banner; try recovery in background + catch-up on focus.

## Summary

Fix silent stall of text-channel messages after idle: the client opens WebSocket once and **never reconnects** on close, so `message.new` stops until F5 (which also forces identity unlock). Plan: **automatic WS reconnect** with backoff, **connection status** for a discrete chat banner, and **incremental catch-up** (merge newer messages after last visible) on reconnect / `online` / visibility — without requiring send or unlock, and without changing post-F5 unlock rules.

## Technical Context

**Language/Version**: TypeScript / SolidJS (FE); Rust/Axum WS hub (BE unchanged for MVP unless catch-up needs `after=`).

**Primary Dependencies**: `frontend/src/api/ws.ts` (`connectWs`), `frontend/src/App.tsx` (single WS + listener fan-out), `frontend/src/pages/Channel.tsx` (`message.new` + history load), `GET /api/channels/{id}/messages` (`before` only today), `mesa-theme.css`.

**Storage**: N/A for connection state (in-memory). Messages already in SQLite; catch-up uses existing list API.

**Testing**: Manual [quickstart.md](./quickstart.md) A–F; `cd frontend && npx tsc --noEmit`. Optional: small unit test for merge/dedupe helper if extracted. No new cargo contract required for FE-only reconnect MVP.

**Target Platform**: Browser tab (foreground + background throttling).

**Project Type**: Reliability / live-delivery bugfix (FE-primary).

**Performance Goals**: Reconnect + catch-up perceptible within **≤ 10 s** after link usable (SC-001); backoff without hammering server; catch-up merges without full history wipe.

**Constraints**: No second unlock while session already unlocked; no send-to-recover; banner non-modal; incremental catch-up only; post-F5 unlock unchanged; voice out of scope.

**Scale/Scope**: ~`ws.ts` + `App.tsx` + `Channel.tsx` (+ optional small lib helper + CSS); optional tiny BE `after` query if merge-from-latest-page proves insufficient (research R2).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Client live-delivery contract + presentation model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/069-idle-chat-stall/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── live-delivery-recovery.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/api/ws.ts                 # reconnect + status (or thin wrapper)
frontend/src/App.tsx                   # wire reconnecting WS; expose status to shell/channel
frontend/src/pages/Channel.tsx         # banner + catch-up on reconnect/visibility
frontend/src/lib/messageCatchUp.ts     # optional: merge/dedupe helpers [P]
frontend/src/styles/mesa-theme.css     # .channel-delivery-banner (or similar)
backend/src/api/messages.rs            # OPTIONAL later: Query.after for true cursor catch-up
```

**Structure Decision**: FE-first — fix reconnect + status + merge catch-up using existing messages list. Add `after=` only if product needs gaps larger than one list page (see research R2).

## Complexity Tracking

N/A
