# Proposal

## Why

Screen sharing needs an explicit audio choice so friends can hear a shared game's sound. The capture path now runs through `frontend/src/voice/callSession.tsx:435-445` and Electron's `fulfillScreenShare` (`frontend/electron/main.ts:587-620`). The desktop popout's controls live in `frontend/src/voice/CallPopoutWindow.tsx:15-120`, with relay types in `frontend/src/env.d.ts:11-30`.

## What Changes

- Offer a choice to include system/game audio when starting screen share, and pass that intent through LiveKit's screen-capture options and Electron's display-media path where supported.
- Add a screen-share control to the popout's existing hover/focus-revealed strip. Relay its command to the owning call and reflect the owner's authoritative screen state; the popout viewer continues to publish no media.
- Use the platform audio and popout eligibility decisions recorded in `review-architect.md` (2026-11-16). Blur/background, output selection, and another popout window remain outside this change.

## Capabilities

### Modified Capabilities

- `frontend-v2/voice-session`: add the choice to include captured audio with screen sharing.
- `frontend-v2/call-popout`: allow screen sharing from the popout through the owning call.

## Impact

- `frontend/src/voice/callSession.tsx`, `frontend/src/voice/CallControls.tsx`, `frontend/electron/main.ts`, `frontend/electron/preload.ts`, `frontend/src/env.d.ts`, `frontend/src/voice/CallPopoutWindow.tsx`, popout styling, and `frontend/src/i18n/catalogs/voice.*.ts`. No backend or LiveKit protocol change is proposed.
