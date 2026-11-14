# Proposal

## Why

The arrival sound plays before a newly joining participant appears in the call UI. The sound follows HTTP occupancy (`frontend/src/sound/triggers.ts:25-33`), while tiles follow LiveKit participants (`frontend/src/voice/people.ts:17-32`).

## What Changes

- Trigger the remote arrival sound from the call-owning LiveKit room's `ParticipantConnected` transition, after its participant snapshot is refreshed (`frontend/src/voice/callSession.tsx:609-625`).
- Remove the occupancy-based sound subscription from `frontend/src/sound/triggers.ts:25-33`; retain occupancy for the sidebar roster (`frontend/src/shell/state.tsx:185-198`).
- Preserve deafen, self-join, and notification frequency behavior.

## Capabilities

### Modified Capabilities

- `frontend-v2/sound-effects`: remote arrival sound is synchronized with the actual visible participant tile.

## Impact

- `frontend/src/voice/callSession.tsx`, `frontend/src/sound/triggers.ts`, and sound tests; no backend or occupancy protocol change.
