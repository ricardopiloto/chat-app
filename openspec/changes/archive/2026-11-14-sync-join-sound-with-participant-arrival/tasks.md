# Tasks

## 1. Arrival source

- [x] 1.1 Add a distinct `ParticipantConnected` handler in `frontend/src/voice/callSession.tsx` that refreshes participants before emitting a remote-arrival event, scoped to the owning call and current epoch; deduplicate identities across reconnects.
- [x] 1.2 Move the remote arrival notification from `frontend/src/sound/triggers.ts`'s occupancy subscription to the call arrival event. Preserve deafen and the existing sound limiter; leave notification and self-join sounds intact.

## 2. Verify timing and edge cases

- [x] 2.1 In a two-client call, confirm the joining person's tile or avatar appears before the sound; confirm an HTTP reservation that never connects produces no remote arrival sound.
  - Smoke plan: A live in channel → B joins → A hears `callJoin` only after B's tile/avatar appears. Reserve via HTTP without LiveKit connect (or kill before connect) → A stays silent until a real LiveKit connect.
- [x] 2.2 Check a listen-only participant, an audio/camera-off participant, reconnect, deafen, and a popout viewer. Confirm exactly one eligible sound in the owning window and no duplicate on reconnect.
  - Smoke plan: listen-only / mic+cam off → one sound on avatar; reconnect same identity → no second sound; deafen → no remote arrival; popout viewer window → silent (owner window still sounds once).

## 3. Spec validation

- [x] 3.1 Run `openspec validate sync-join-sound-with-participant-arrival --strict` and confirm it passes with no errors.
