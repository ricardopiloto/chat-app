# Design

## Context

`onPageHide` currently sends `voiceApi.leaveOnUnload` and calls `teardown()` unconditionally (`callSession.tsx:712-717`). This is definitive for any `pagehide` that occurs. A mobile app switch can trigger visibility loss and sometimes page lifecycle events, but behavior varies by browser and OS; no web API reliably distinguishes a temporary switch from a permanently closed tab. The existing call heartbeat starts after LiveKit connection (`:588-595`), and the backend sweeps stale occupancy (`backend/src/api/voice.rs:169-188`). LiveKit/WebRTC audio itself may be suspended by iOS or Android even if JavaScript preserves room state.

## Goals / Non-Goals

**Goals:** do not deliberately hang up on a short mobile app switch; resume a surviving connection on return; clearly recover from a suspended connection; eventually release abandoned seats.

**Non-Goals:** guarantee uninterrupted microphone/audio under every mobile OS policy; silently autojoin a newly loaded page without consent; change desktop Electron tray handling.

## Decisions

### D1. Soft-background mobile web sessions

On mobile web, use `visibilitychange` to record a hidden state while retaining the LiveKit room and tracks. Treat a `pagehide` following a recent visibility-hidden transition as potentially temporary, and do not send explicit server leave immediately. A short grace timer may run while the page survives, but correctness must not rely on background timers firing. A genuinely explicit Leave action still invokes the existing full teardown. For a visible navigation/reload, retain the current best-effort unload leave and the existing explicit rejoin-consent flow.

*Alternative rejected:* simply delete the `pagehide` handler for all browsers. That leaks seats on normal desktop tab closure and bypasses cleanup in cases where the page can still send it.

### D2. Recover on visibility return, with an honest media state

When the page becomes visible, check the existing room's connection and local tracks. If LiveKit has reconnected, keep the same session; if disconnected, use a bounded reconnect attempt while the same document/session remains alive, restoring the previously user-selected mic/camera state only after permissions and tracks are available. If the document was discarded/reloaded, show the existing join-consent entry flow instead of autojoining. Surface a visible reconnecting/error state when media cannot resume.

*Alternative rejected:* Wake Lock or silent audio as a prerequisite. Wake Lock is not a reliable way to keep a hidden page running and silent playback may violate browser policy; neither can guarantee background WebRTC. They may be separate, device-specific experiments.

### D3. Let stale occupancy expire when the tab is really gone

A hidden page that is killed cannot run a reliable timer or unload handler. Rely on the existing backend stale-occupancy sweeper when heartbeat stops, and verify the timeout is acceptable; do not build a fake certainty from `beforeunload`. Document support differences in the UI/help: iOS Safari and PWA, Android Chrome, and plain tabs may suspend capture or playback, with recovery on return rather than a promise of uninterrupted background audio.

*Alternative rejected:* a fixed hidden-tab timeout that calls Leave. Background timers may not run and it would deliberately end a long but legitimate app switch.

### D4. Allow suspended mobile heartbeats a longer occupancy grace window

The client reports occupancy every 20 seconds, but a mobile browser can suspend that timer during an app switch. The previous 45-second stale cutoff could remove a still-connected participant's roster entry and grid slot. Set the server stale cutoff to 120 seconds; the 20-second sweeper then clears an abandoned seat within roughly 120–140 seconds of its last report. This accepts slower cleanup of crashed clients on every platform to keep typical mobile app switches from displacing a live call participant.

*Alternative rejected:* a mobile-only background flag and longer per-occupant cutoff. The occupancy table has no such field, so this would require a migration, authenticated signal endpoint, client delivery path, and separate stale-query logic. A best-effort hidden signal may itself fail to arrive, leaving the 45-second race intact. That complexity is disproportionate to the bounded cleanup delay here.

## Risks / Trade-offs

- [A killed hidden tab leaves temporary occupancy] → existing server heartbeat expiry bounds it; verify expiry duration and no duplicate seat on later explicit entry.
- [Mobile OS suspends audio or microphone] → show reconnecting and recover on return; the spec promises session continuity where possible, not guaranteed media playout while backgrounded.
- [Navigation while already hidden is ambiguous] → favor preserving a possible temporary call; server expiry handles abandonment.
