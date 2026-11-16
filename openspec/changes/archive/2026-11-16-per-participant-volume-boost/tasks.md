# Tasks

## 1. Local storage for the per-handle preference

- [x] 1.1 Add a new per-handle volume-preference store (0-200, default 100) using the existing `readJson`/`writeJson` helpers from `frontend/src/lib/localPrefs.ts`, under its own namespaced key, alongside (not inside) the existing `Saved` shape in `frontend/src/voice/devices.ts`. Verify with a quick manual check (or a small script in the style of the project's existing `scripts/verify-*.mjs`) that a value set for one handle round-trips through `localStorage` and a different handle still reads the 100% default.
  - `frontend/src/voice/participantVolume.ts` + `npm run verify:participant-volume`.

## 2. Apply the preference to playback

- [x] 2.1 In `frontend/src/voice/callSession.tsx`'s `attachAudio()`, read the stored preference for that track's participant handle and apply it: 0-100% via the element's own `.volume`; above 100%, build the `MediaElementAudioSourceNode` → `GainNode` → `destination` graph and set the gain accordingly. Verify manually with two real participants in a call (or two browser tabs) that boosting and quieting one participant only changes what you hear, not what the other tab hears.
- [x] 2.2 Attempt `audioContext.setSinkId()` for the boosted (>100%) path when the browser's `AudioContext` supports it, matching the already-chosen output device; confirm the existing 0-100% path's `el.setSinkId()` call is untouched. Verify by switching the output device while a participant is boosted, on a browser that supports `AudioContext.setSinkId`, and confirm boosted audio still follows the chosen device; on a browser without it, confirm boosted audio still plays (just possibly on the default device) rather than failing silently.

## 3. UI control

- [x] 3.1 Add a volume control to `Tile`'s existing `actions` slot in `frontend/src/voice/tiles.tsx`, wired wherever `Tile` is rendered for remote participants in the call views (grid, stage, strip). Only render it when `props.person.handle` is set and `props.person.isLocal` is false. Verify the control does not appear on your own tile or on a participant with no resolved handle.
- [x] 3.2 Wire the control's changes to the store from task 1.1 and confirm the value already saved for a returning participant (same handle) is reflected when the control first renders for them. Verify by rejoining a call with the same other participant after setting a non-default value.

## 4. Spec validation

- [x] 4.1 Run `openspec validate per-participant-volume-boost --strict` and confirm it passes with no errors.
