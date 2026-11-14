# Design

## Context

The popout has its own `CallProvider` in `watch` mode (`CallPopoutWindow.tsx:60-65`). Its room is a separate viewer connection, with the local participant excluded from its snapshot (`callSession.tsx:106-127`). The owning session and hardware live in the main renderer. Existing native communication already uses a narrow preload bridge (`frontend/electron/preload.ts:26-57`) and an opener webContents reference for open/closed messages (`frontend/electron/main.ts:567-645`). `CallControls.tsx:46-149` drives the owner call through `useCall()`; reusing that component in the viewer would target the wrong session. The existing `call-popout` spec explicitly prohibits mic/camera controls and must be revised.

## Goals / Non-Goals

**Goals:** control the real call from the popout; show authoritative control state; preserve view-only popout media connection; distinguish closing popout from leaving call.

**Non-Goals:** duplicate the full blur/background menu, start screen share from a secondary window, or add a browser popout implementation.

## Decisions

### D1. Relay a typed, narrow command set through Electron main

Expose `sendCallPopoutCommand` and state subscription through the existing preload bridge. Main process accepts commands only from `popout.webContents`, validates channel ID and the command enum, and forwards to `popoutOpener` if alive. The main renderer checks the active call's channel/epoch and invokes its own `setMic`, `setCam`, `toggleDeafened`, or `leave`. No command ever calls the viewer room's setters.

*Alternative rejected:* directly import `CallControls` into `CallPopoutWindow`. The provider there owns only a viewer room, so controls would be no-ops or affect the wrong connection.

### D2. Push authoritative state back to popout

The owner sends a small state snapshot on popout open and after each relevant state change: channel ID, live/reconnecting status, `mic`, `cam`, `deafened`, and `canSpeak`. The popout renders buttons with the existing `call-control` icon/pressed/disabled conventions (`CallControls.tsx:46-81`), disables controls while state is unavailable, and handles a failed command without optimistic state drift. Validate the sender against the stored opener and popout webContents; never relay arbitrary IPC or token data.

*Alternative rejected:* infer mic/camera state from the viewer's remote tiles. It may be stale and does not carry deafen or permissions reliably.

### D3. Four controls, clear leave semantics

Offer mic, camera, deafen, and Hang Up. Hang Up invokes the main session's `leave()` and ends the whole call; the popout then closes via the existing owner lifecycle. Closing the popout window remains view-only and does not hang up (`call-popout` existing requirement). Do not add screen share, blur/background, output choice, or a second popout button: those controls involve capture UI, menus, or window management and deserve a separate layout/permission design.

*Alternative rejected:* make the popout Hang Up button merely close the popout. That contradicts the established hangup label and leaves the call running unexpectedly.

### D4. Reveal bottom controls without moving the grid

Put all four controls in a fixed bottom-edge bar. Keep only a small reserved inset at the top; add no top bar or active-speaker label because the grid already shows participant names and speaking state (`frontend/src/voice.css:36-41,45-46`). Reserve the top inset and bottom control-strip height in the popout grid's available area at all times. Position the bar over its reserved bottom strip, not over tiles; showing or hiding it must not resize or shift the grid or spotlight layout (`CallPopoutWindow.tsx:18-21`, `frontend/src/voice.css:85-91,246-248`). Hide it by default; reveal it while the pointer is anywhere inside the popout, and hide it on pointer leave. Also reveal it on keyboard focus within the controls. Follow the existing hover/focus reveal pattern for tile captions, with no idle timer (`frontend/src/voice.css:40-42`).

At the 240×180 minimum, use compact buttons in one row and reduce the reserved insets as needed to preserve at least 80px of tile area below the native title bar. Keep the top inset minimal at that size; do not add a top bar. The reserved strip remains the same size in hidden and visible states.

*Alternative rejected:* an always-visible compact bar uses the same scarce space but does not match the requested Discord-style reveal behavior.

## Risks / Trade-offs

- [Main renderer unavailable while popout remains] → disable controls and show the owner-unavailable state; do not mutate viewer room.
- [Stale commands after channel switch] → check channel ID and call epoch before executing; reject and refresh state.
- [Small 240×180 popout] → fit four compact buttons in the reserved bottom strip and retain at least 80px of tile area below the native title bar; verify grid and spotlight layouts at minimum size.
