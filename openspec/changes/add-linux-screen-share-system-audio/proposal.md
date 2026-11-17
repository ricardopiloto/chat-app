# Proposal

## Why

The screen-share audio choice is visible on Linux, but `fulfillScreenShare` only supplies loopback audio on Windows, so a Linux share with audio selected is always video-only. Linux system audio needs a verified capture and publication route before the choice can work there.

## What Changes

- Investigate a Linux PipeWire system-output capture route and prove that it can become a LiveKit-published audio track alongside the existing screen video on X11 and Wayland.
- If the proof succeeds, attempt system audio when selected on supported Linux hosts; preserve video-only sharing when capture is unavailable or fails.
- Keep the existing whole-desktop audio scope, regardless of the chosen video window or monitor.

## Capabilities

### Modified Capabilities

- `frontend-v2/voice-session`: strengthen the optional screen-share audio requirement for Linux environments with a verified system-output capture route.

## Impact

- Likely `frontend/electron/main.ts`, `frontend/src/voice/callSession.tsx`, and Linux-specific capture integration; no backend or LiveKit protocol change.
- A native PipeWire module is a possible outcome only after the proof gate. It would introduce Linux build and AppImage packaging work absent from the current Electron build.
