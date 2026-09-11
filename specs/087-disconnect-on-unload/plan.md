# Implementation Plan: Disconnect Voice Session on Browser Unload

**Branch**: `087-disconnect-on-unload` | **Date**: 2026-09-10 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/087-disconnect-on-unload/spec.md`

**Note**: `.specify/feature.json` → `specs/087-disconnect-on-unload`. Clarifications: **one live call per account**; client unload leave **plus** server stale cleanup ~1 min.

## Summary

1. **Bug**: Refresh/tab/browser close often leaves `voice_occupant` rows → ghost “still in call”. Existing `pagehide` → `hangup()` is too heavy for unload (async release then `leaveVoice`), so the leave HTTP frequently never completes.
2. **Client**: On unload, fire a **keepalive** (or beacon) `POST .../voice/leave` **first**, then best-effort local teardown; keep normal in-app `hangup` path.
3. **Server**: Ensure stale occupants (`last_seen_at` / heartbeat) are removed **and broadcast** within ~1 minute even when no peer actively joins—today `expire_stale` only runs on some request paths, so WS-only peers may never learn.
4. Preserve one-call-per-account occupancy model and intentional leave idempotency.

## Technical Context

**Language/Version**: TypeScript / SolidJS (FE); Rust / Axum (BE).

**Primary Dependencies**: `frontend/src/voice/VoiceSession.tsx` (`pagehide`, `hangup`, heartbeat); `frontend/src/api/client.ts` (`leaveVoice`); `backend/src/api/voice.rs` (`expire_stale`, leave, occupancy); `backend/src/db/voice_occupancy.rs` / `domain` (`OCCUPANT_STALE_SECS` = 45).

**Storage**: SQLite `voice_occupant.last_seen_at` (existing).

**Testing**: `cargo test` voice occupancy contracts; `tsc --noEmit`; manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser unload (Chrome/Firefox/Safari) + Mesa API.

**Project Type**: Web app (FE + BE).

**Performance Goals**: Leave visible to peers ≤10s when unload leave succeeds (SC-001/002); ≤~1 min when only stale path runs (SC-005/006).

**Constraints**: Unload work is best-effort; prefer `pagehide` + `fetch(..., { keepalive: true })` over relying on full async `hangup`. Do not log users out of Mesa auth. Idempotent leave.

**Scale/Scope**: Unload leave reliability + stale sweeper/broadcast; not a redesign of occupancy schema.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contract tests + quickstart |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Contracts + data-model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/087-disconnect-on-unload/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── unload-leave-client.md
│   └── stale-occupancy-server.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/voice/VoiceSession.tsx     # pagehide → keepalive leave first; hangup remains for in-app
frontend/src/api/client.ts              # leaveVoiceKeepalive / beacon-capable leave
backend/src/api/voice.rs                # periodic or guaranteed stale expire + broadcast
backend/src/db/voice_occupancy.rs       # list_stale (existing); TTL if adjusted
backend/src/domain/voice_occupancy.rs   # OCCUPANT_STALE_SECS
backend/tests/contract/voice_occupancy.rs  # stale + leave idempotency
```

**Structure Decision**: Dual path required by FR-006/008—fast unload leave on client; server safety net that **proactively** expires and broadcasts without waiting for an unrelated join.

## Complexity Tracking

N/A
