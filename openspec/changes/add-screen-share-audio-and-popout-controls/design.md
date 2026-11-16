# Design

## Context

The main screen-share path is `callSession.tsx:435-445`, using LiveKit's `setScreenShareEnabled(on, { audio })` (`frontend/node_modules/livekit-client/dist/src/room/participant/LocalParticipant.d.ts:102-105`). Electron's `fulfillScreenShare` selects a source and supplies requested loopback audio where supported (`frontend/electron/main.ts:587-620`). Its adjacent comment distinguishes Wayland's portal from X11's custom picker (`main.ts:569-573`). `CallControls.tsx:121-153` contains the screen toggle and secondary audio menu.

The popout uses a separate viewer room and a typed owner relay. `CallPopoutCommand` and `CallPopoutOwnerState` are duplicated in `frontend/src/env.d.ts:11-31` and `frontend/electron/preload.ts:15-35`; `readPopoutCommand` and `readPopoutOwnerState` validate relay payloads in `main.ts:700-739`, and IPC checks sender, opener, and channel (`main.ts:802-841`). The owner publishes authoritative state and checks current channel and call status before executing commands (`callSession.tsx:1058-1136`). `PopoutControls` uses that state in a hover/focus-revealed strip (`CallPopoutWindow.tsx:15-120`). The earlier popout design's D3 reserved screen share for a separate capture UI and permission design; this change supplies that design for screen share alone. No backend active-screen-share state or protocol event is assumed.

## Goals / Non-Goals

**Goals:** let a person choose system/game audio when starting screen share; let the popout start, stop, and reflect screen share with the owning call's state; keep capture and media publication in the owner; preserve the viewer room's receive-only role.

**Non-Goals:** blur/background controls, output-device choice, or another popout button/window. Those portions of `add-popout-call-controls` D3 remain excluded. No backend or protocol change.

## Decisions

### D1. Send audio intent through the existing screen-capture path

Add the audio choice near the main call's screen-share start action and pass it into `setScreen` and LiveKit's `setScreenShareEnabled(true, { audio })`. Coordinate Electron's display-media callback with the request's audio intent and selected video source. Keep stopping a share on the existing `setScreen(false)` path, including its associated audio, and derive displayed screen and audio state from actual local publications rather than the requested flag. Always show the audio choice, attempt capture when selected, and let the share continue as video-only without a blocking error if audio is unavailable or fails.

The captured audio is whole-system desktop loopback audio, independent of whether the selected video source is a window or the full screen. This is a deliberate, accepted limitation of this change, not a bug deferred for later. The custom picker in `frontend/electron/main.ts` (`installScreenShare` / `fulfillScreenShare`) bypasses Chromium's native `getDisplayMedia` picker, which normally ties audio scope to the chosen tab or window. Restoring per-window audio isolation would require the Windows Process Loopback API through a native addon, with no reliable Linux equivalent; that work is out of scope. This matches Discord's current Linux behavior, where PipeWire/portal screencast audio is whole-desktop rather than per-window, and this app's current Windows-only system-loopback support. Label the choice as computer audio so selecting a window never implies that only that window's audio is shared.

*Alternative rejected:* create a separate audio-only sharing session. That would duplicate capture, publication, and stop semantics for one screen-share action.

### D2. Extend the existing typed popout relay

Add `setScreen` with a boolean target to both command declarations, validate it in `readPopoutCommand`, and add `screen: boolean` to both owner-state declarations and `readPopoutOwnerState`. Publish screen state from `publishPopoutOwnerState` and include it in its reactive dependencies. Handle the command in the owning session's existing switch, checking the same channel and live-call guards. Add a screen button to `PopoutControls` in the existing strip, using `ready()` and authoritative `owner()?.screen`; retain the viewer's view-only room. Use exactly the existing `canSpeak()` guard for screen-share commands, as for mic and camera. The popout has no audio choice: it starts with the main window’s current/default audio preference. The `setScreen` IPC command remains a plain boolean.

*Alternative rejected:* invoke `setScreen` on the popout's `useCall()` provider. That provider owns a viewer room and cannot publish the owning user's capture.

## Risks / Trade-offs

- [Cross-platform system-audio capture may be absent or fail, especially on Linux X11/Wayland] → always offer the choice, fall back to video-only without a blocking error, verify Windows, X11, and Wayland behavior, and show audio active only after publication is confirmed.
- [Popout action may reach a stale or ineligible owner] → keep sender/channel/live validation and the existing `canSpeak()` guard; reject and republish state when invalid.
- [The picker or portal may not focus correctly when triggered from the popout] → exercise the existing picker flow from both windows and preserve cancellation without changing share state.
- [A fifth button may crowd the 240×180 popout] → keep the audio choice in the main window; check keyboard access, strip fit, grid/spotlight insets, and the existing minimum tile area.
