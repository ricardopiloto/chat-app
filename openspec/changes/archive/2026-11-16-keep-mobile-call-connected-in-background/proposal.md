# Proposal

## Why

A mobile browser user can lose a call when switching to another app. The voice provider registers `pagehide` on all platforms and explicitly leaves the server and disconnects LiveKit (`frontend/src/voice/callSession.tsx:712-739`). Mobile browsers may suspend media even when the page survives, so the desired persistence needs a lifecycle and recovery policy.

## What Changes

- Keep an active mobile web call through a temporary hidden state, with no explicit `leaveOnUnload` on ordinary backgrounding.
- On return, inspect LiveKit room state and reconnect or offer a user-visible resume path if the OS suspended media.
- Bound server occupancy after a truly abandoned page through existing heartbeat/stale sweeping (`frontend/src/voice/callSession.tsx:594`, `backend/src/api/voice.rs:169-188`) and handle explicit leave immediately.

## Capabilities

### Modified Capabilities

- `frontend-v2/voice-session`: a mobile browser call persists across temporary app switching and recovers on return where the browser permits.

## Impact

- `frontend/src/voice/callSession.tsx` lifecycle and recovery; `backend/src/api/voice.rs` occupancy timeout behavior may need verification, not necessarily an API change. Desktop tray behavior stays as specified by `electron-system-tray-notifications`.
