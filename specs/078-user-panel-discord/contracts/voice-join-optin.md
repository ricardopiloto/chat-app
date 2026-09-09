# Contract: Voice join opt-in UI (078)

**Feature**: [078-user-panel-discord](../spec.md)  
**Scope**: Voice/video **pre-join** surface in `VoiceChannel` (and related i18n).  
**Supersedes (UI only)**: [032 prejoin-ui](../../032-voice-join-camera-choice/contracts/prejoin-ui.md) dual primary buttons.  
**Retains**: [032 voice-join-camera](../../032-voice-join-camera-choice/contracts/voice-join-camera.md) join/`cam_on`/banco/palco semantics.

## Pre-join controls (`!live`, publish-capable member)

| Control | Behavior |
|---------|----------|
| Camera opt-in | Default **off**. Toggle sets intent for upcoming JOIN |
| Blur | Interactive **only** when camera opted in; otherwise hidden/disabled |
| Lazy preview | Optional local self-view **after** camera opt-in only; no camera permission on default-off open |
| **JOIN** (single primary) | If camera off → join audio / `cam_on: false` → **banco**. If camera on → join with camera / `cam_on: true` → palco/slot rules |
| Test video | MAY remain as **secondary** action; MUST NOT be a second primary “join with camera” |

## Listen-only members

- Single listen/join path without camera opt-in (existing listen join).

## MUST

| ID | Rule |
|----|------|
| VJ-01 | MUST NOT show two primary actions “Join with camera” and “Join without camera (bench)” |
| VJ-02 | JOIN default path MUST be camera off |
| VJ-03 | Camera on requires explicit opt-in before/at JOIN |
| VJ-04 | Pre-join MUST communicate camera intent (on vs off) before enter |
| VJ-05 | Default-off MUST NOT request camera permission or start preview |
| VJ-06 | Blur on pre-join MUST NOT be interactive while camera intent is off |
| VJ-07 | Camera/blur controls for join/in-call remain on voice/stage surfaces—not user panel |
| VJ-08 | Post-join bank↔slot when turning camera on keeps 032 auto-assign rules |

## Non-goals

- Persisting camera opt-in as a global cross-session default (visit-local OK)
- Mic opt-in on pre-join (mic default unchanged)
- Redesigning scene editor / CallBank
