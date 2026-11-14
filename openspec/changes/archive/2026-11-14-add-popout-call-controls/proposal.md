# Proposal

## Why

The desktop popout shows only `<GridView fill />` (`frontend/src/voice/CallPopoutWindow.tsx:12-21`). People must return to the main window to mute, disable camera, deafen, or hang up, even though the popout is their active call view.

## What Changes

- Add microphone, camera, deafen, and leave controls in a bottom-edge overlay, hidden at rest and revealed by hovering over the popout or focusing its controls. Reserve fixed top and bottom insets for the grid so revealing controls neither covers tiles nor shifts them.
- Relay commands from the popout renderer through Electron main process to the owning main renderer, and relay authoritative state back; the popout's `watch()` room remains view-only (`CallPopoutWindow.tsx:60-65`, `callSession.tsx:359-380`).
- Keep screen share, blur/background selection, output device, and popout management in the main window for this first scoped surface.

## Capabilities

### Modified Capabilities

- `frontend-v2/call-popout`: the viewer window can command the owning call without publishing media itself.

## Impact

- `frontend/electron/main.ts:567-645`, `frontend/electron/preload.ts:26-57`, `frontend/src/env.d.ts`, `frontend/src/voice/CallPopoutWindow.tsx`, `frontend/src/voice/callSession.tsx`, and popout CSS/localization.
