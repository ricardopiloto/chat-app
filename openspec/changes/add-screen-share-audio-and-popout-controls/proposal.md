# Proposal

## Why

Screen sharing currently starts without an audio choice (`frontend/src/voice/callSession.tsx:430-433`), and Electron's display-media handler returns video only (`frontend/electron/main.ts:626-653`), so friends cannot hear a shared game's sound. The desktop popout also has no screen-share action or owner state (`frontend/src/voice/CallPopoutWindow.tsx:15-95`, `frontend/src/env.d.ts:11-29`), requiring a return to the main window.

## What Changes

- Offer a choice to include system/game audio when starting screen share, and pass that intent through LiveKit's screen-capture options and Electron's display-media path where supported.
- Add a screen-share control to the popout's existing hover/focus-revealed strip. Relay its command to the owning call and reflect the owner's authoritative screen state; the popout viewer continues to publish no media.
- Resolve platform audio behavior and popout eligibility in architect review before implementation. Blur/background, output selection, and another popout window remain outside this change.

## Capabilities

### Modified Capabilities

- `frontend-v2/voice-session`: add the choice to include captured audio with screen sharing.
- `frontend-v2/call-popout`: allow screen sharing from the popout through the owning call.

## Impact

- `frontend/src/voice/callSession.tsx`, `frontend/src/voice/CallControls.tsx`, `frontend/electron/main.ts`, `frontend/electron/preload.ts`, `frontend/src/env.d.ts`, `frontend/src/voice/CallPopoutWindow.tsx`, popout styling, and `frontend/src/i18n/catalogs/voice.*.ts`. No backend or LiveKit protocol change is proposed.
