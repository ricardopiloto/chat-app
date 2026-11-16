# Proposal

## Why

Parley has no way to adjust how loud one specific remote participant sounds relative to everyone else in a call — only a global deafen toggle and an output-device choice. Discord's per-user volume slider (0-200%, where 100% is unchanged) solves a real, common problem: one person's mic is too quiet or too loud relative to the rest of the call, and turning everyone's output up or down does not fix that.

## What Changes

- Add a per-participant volume control (0-200%, 100% = unchanged) to the call UI, available for remote participants only (there is no control for the local participant's own tile).
- Persist this preference on the device, keyed by the other participant's account handle, following the same local-storage pattern already used for camera blur (`frontend/src/voice/devices.ts`, `frontend/src/lib/localPrefs.ts`) — no backend or API change.
- Apply the stored value to that participant's existing per-track `<audio>` element (`attachAudio` in `frontend/src/voice/callSession.tsx`): for 0-100%, set the element's own `.volume` directly; for 100-200%, route that element through a Web Audio `GainNode`, since `HTMLMediaElement.volume` cannot exceed 1.0.
- Preserve the existing output-device routing (`setSinkId`) for the 0-100% range exactly as today; for the boosted (100-200%) range, attempt the newer `AudioContext.setSinkId()` where the browser supports it, and accept the chosen output device not being honored on browsers without that API as a known, scoped limitation.

## Capabilities

### New Capabilities

- `frontend-v2/voice-participant-volume`: per-participant local volume adjustment (0-200%) during a call, applied to that participant's audio everywhere they are shown (grid, stage, strip), persisted on the device by the other participant's account handle.

## Impact

- `frontend/src/voice/callSession.tsx` (`attachAudio`, around line 152-157) — apply the stored multiplier when attaching each remote participant's audio element.
- `frontend/src/voice/devices.ts` or a new sibling module — new per-handle local-storage map (distinct from the existing flat `Saved` own-device-preferences shape in that file).
- `frontend/src/voice/tiles.tsx` (`Tile`'s existing `actions` slot) — new control, shown only for remote participants that have a resolved account `handle`.
- No backend/API impact.
