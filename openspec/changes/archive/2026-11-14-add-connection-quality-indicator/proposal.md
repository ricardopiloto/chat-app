# Proposal

## Why

Parley has no visible connection-health feedback during a call, even though the installed LiveKit client exposes `RoomEvent.ConnectionQualityChanged` and participant `connectionQuality` (`frontend/node_modules/livekit-client/src/room/events.ts:250-252`, `participant/Participant.ts:27-38,211-212`).

## What Changes

- Store the local participant's LiveKit connection-quality level reactively in `frontend/src/voice/callSession.tsx:609-653`, including an initial unknown state and reset on leave.
- Show a compact phone-signal-style bar indicator near the user's own tile using the existing `Tile` chip container (`frontend/src/voice/tiles.tsx:80-95`). Filled-bar count and green/red color convey quality at a glance; an accessible label and tooltip, rather than visible chip text, carry Excellent, Good, Poor, Lost, or Unknown for screen readers.
- Label the metric honestly as connection quality; do not invent ping, jitter, or latency values from this enum.
- Relay the owning session's local connection quality into the desktop popout through the existing `CallPopoutOwnerState` channel, alongside mic/cam/deafened, and render the same compact bar-and-color glyph in the existing hover/focus-revealed control strip. Add no always-visible chrome over the grid, so the popout stays uncluttered. Never substitute the popout's own separate viewer-room connection quality.

## Capabilities

### New Capabilities

- `frontend-v2/voice-connection-quality`: a local call-health indicator sourced from LiveKit's existing signal.

## Impact

- `frontend/src/voice/callSession.tsx`, `frontend/src/voice/tiles.tsx` or shared tile wrapper, `frontend/src/env.d.ts` (bridge type), `frontend/src/voice/CallPopoutWindow.tsx`, localization and CSS. No backend or LiveKit protocol change.
