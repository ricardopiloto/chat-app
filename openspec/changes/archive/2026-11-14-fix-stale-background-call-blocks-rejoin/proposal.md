# Proposal

## Why

A call left running when the desktop window hides to tray can prevent a later rejoin until the old call is explicitly ended. The tray behavior itself is intentional (`frontend/electron/main.ts:98-103,716-720`). A relaunch can also start a second independent renderer because startup creates a new main window without a single-instance guard (`frontend/electron/main.ts:675-693`), while the first window remains hidden with its call active.

## What Changes

- Bound the wait for an old LiveKit disconnect and old join/leave operations in `frontend/src/voice/callSession.tsx:171-197,330-357,498-514`, then invalidate stale work before a fresh join.
- Reset `status` and `channel` with room teardown on `pagehide` (`callSession.tsx:713-717`); today it clears the room but leaves those signals populated.
- Make a hidden desktop window's call lifecycle resilient to Chromium background throttling (`frontend/electron/main.ts:362-370`) and verify rejoin after tray restoration.
- Enforce one desktop Electron app instance; a second launch restores and focuses the existing main window through `showMainWindow()` (`frontend/electron/main.ts:67-74`) instead of creating another call-owning renderer.

## Capabilities

### Modified Capabilities

- `frontend-v2/voice-session`: successful call entry and re-entry remain possible after a stale background session; relaunching desktop Parley returns to the existing call-owning window.

## Impact

- `frontend/src/voice/callSession.tsx` join, leave, teardown, and page lifecycle; `frontend/electron/main.ts` main window preferences and process startup/reopen handling.
- The separate `fix-call-popout-windows-join-error` change covers first popout opening on Windows; this change does not change popout token or viewer behavior.
