# Design

## Context

`callSession.tsx:430-439` calls LiveKit's `setScreenShareEnabled(on)` without capture options, though its installed declaration accepts `ScreenShareCaptureOptions.audio` (`frontend/node_modules/livekit-client/dist/src/room/participant/LocalParticipant.d.ts:102-105`, `track/options.d.ts:190-195`). Electron's `fulfillScreenShare` selects a screen/window source and returns only `video` (`frontend/electron/main.ts:626-653`). Its adjacent comment distinguishes Wayland's portal from X11's custom picker (`main.ts:611-614`). `CallControls.tsx:119-134` has one screen toggle, with no audio choice.

The popout uses a separate viewer room and a typed owner relay. `CallPopoutCommand` and `CallPopoutOwnerState` are duplicated in `frontend/src/env.d.ts:11-29` and `frontend/electron/preload.ts:15-33`; `readPopoutCommand` and `readPopoutOwnerState` validate relay payloads in `main.ts:736-775`, and IPC checks sender, opener, and channel (`main.ts:836-866`). The owner publishes mic/cam/deafened/quality and checks current channel and call status before executing commands (`callSession.tsx:1039-1109`). `PopoutControls` uses that owner state in a hover/focus-revealed strip (`CallPopoutWindow.tsx:15-95`). The earlier popout design's D3 reserved screen share for a separate capture UI and permission design; this change supplies that design for screen share alone.

## Goals / Non-Goals

**Goals:** let a person choose system/game audio when starting screen share; let the popout start, stop, and reflect screen share with the owning call's state; keep capture and media publication in the owner; preserve the viewer room's receive-only role.

**Non-Goals:** blur/background controls, output-device choice, or another popout button/window. Those portions of `add-popout-call-controls` D3 remain excluded. No backend or protocol change.

## Decisions

### D1. Send audio intent through the existing screen-capture path

Add the audio choice near the main call's screen-share start action and pass it into `setScreen` and LiveKit's `setScreenShareEnabled(true, { audio })`. Coordinate Electron's display-media callback with the request's audio intent and selected video source. Keep stopping a share on the existing `setScreen(false)` path, and derive displayed state from actual local publications rather than the requested flag.

*Alternative rejected:* create a separate audio-only sharing session. That would duplicate capture, publication, and stop semantics for one screen-share action.

### D2. Extend the existing typed popout relay

Add `setScreen` with a boolean target to both command declarations, validate it in `readPopoutCommand`, and add `screen: boolean` to both owner-state declarations and `readPopoutOwnerState`. Publish screen state from `publishPopoutOwnerState` and include it in its reactive dependencies. Handle the command in the owning session's existing switch, checking the same channel and live-call guards. Add a screen button to `PopoutControls` in the existing strip, using `ready()` and authoritative `owner()?.screen`; retain the viewer's view-only room. The popout audio choice, if exposed there, must travel as a narrowly validated field on the same command, with actual audio publication reflected separately from requested intent.

*Alternative rejected:* invoke `setScreen` on the popout's `useCall()` provider. That provider owns a viewer room and cannot publish the owning user's capture.

## Open questions for architect review

1. **Desktop audio availability and fallback.** Electron's display-media loopback is documented most reliably on Windows; Linux behavior depends on the desktop environment's PipeWire screen-cast/audio portal and differs between X11 and Wayland. Should the audio choice appear everywhere and fall back to video-only if unsupported or capture fails, be hidden/disabled after capability detection, or use another policy? Always-visible is simple but can falsely promise game audio; capability gating is clearer but detection may be unreliable or change by portal/source. Decide the user feedback, test matrix, and whether an audio failure may leave video sharing active before implementation.
2. **Popout authority and eligibility.** Does reopening only screen share from D3 preserve the narrow IPC/security boundary, or need tighter scope? In particular, should only an eligible/speaking user trigger it, matching the owner-side `canSpeak()` guard for mic/cam and existing `setScreen`? Decide whether the popout can expose the audio choice or only start with the owner's selected preference, and verify capture permission/picker behavior when the initiating click occurs in the secondary window but capture occurs in the owner.

## Risks / Trade-offs

- [Cross-platform system-audio capture may be absent or fail, especially on Linux X11/Wayland] → architect selects a capability and fallback policy; verify Windows, X11, and Wayland behavior and avoid claiming an audio track exists until publication is confirmed.
- [Popout action may reach a stale or ineligible owner] → keep sender/channel/live validation and owner-side permission checks; reject and republish state when invalid.
- [The picker or portal may not focus correctly when triggered from the popout] → exercise the existing picker flow from both windows and preserve cancellation without changing share state.
- [A fifth button plus possible audio choice may crowd the 240×180 popout] → check keyboard access, strip fit, grid/spotlight insets, and the existing minimum tile area.
