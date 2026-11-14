# Tasks

## 1. Architect and fullstack review

- [ ] 1.1 Have the architect decide the Windows/X11/Wayland audio availability and failure policy, popout screen-share eligibility and IPC scope, and whether audio choice appears in the popout; verify the decisions are recorded for implementation before editing code.
- [ ] 1.2 Have fullstack review check the chosen capture flow, owner/viewer boundary, and permission behavior against both spec deltas; verify review findings are resolved in the plan before implementation.

## 2. Screen-audio state and capture wiring

- [ ] 2.1 Extend `frontend/src/voice/callSession.tsx` so screen-share start accepts the selected audio intent, reports actual screen/audio publication state, and stops associated audio with the screen; verify selected and unselected paths plus cancellation and teardown.
- [ ] 2.2 Extend `frontend/electron/main.ts` display-media handling for the reviewed audio policy while preserving X11 picker and Wayland portal source selection; verify the selected platform matrix and unsupported/failure behavior.

## 3. Main call controls

- [ ] 3.1 Add the audio choice to `frontend/src/voice/CallControls.tsx` and localized labels in `frontend/src/i18n/catalogs/voice.en.ts` and `voice.pt-BR.ts`; verify keyboard access, selected/unselected starts, and accurate audio-state feedback.

## 4. Popout relay and controls

- [ ] 4.1 Extend `CallPopoutCommand` and `CallPopoutOwnerState` in `frontend/electron/preload.ts` and `frontend/src/env.d.ts`, plus `readPopoutCommand` and `readPopoutOwnerState` in `frontend/electron/main.ts`, with a validated screen action and owner screen state; verify malformed senders/payloads and stale channels are rejected.
- [ ] 4.2 Extend `publishPopoutOwnerState` and `onCallPopoutCommand` in `frontend/src/voice/callSession.tsx` with screen state and the reviewed owner-side eligibility check; verify the command changes only the owning live call and state refreshes after capture/cancel/stop.
- [ ] 4.3 Add an accessible screen button to `PopoutControls` in `frontend/src/voice/CallPopoutWindow.tsx`, update popout styling and localization catalogs, and incorporate the reviewed audio-choice placement; verify the hover/focus strip, picker/portal flow, and 240×180 grid/spotlight layout.

## 5. Integration and spec validation

- [ ] 5.1 Exercise main-window and popout start/stop with and without audio across the reviewed supported platform matrix, including capture rejection, owner loss, and listen-only calls; verify no viewer-room media publication or stale state.
- [ ] 5.2 Run `openspec validate add-screen-share-audio-and-popout-controls --strict` and verify it passes with no errors after review-driven artifact updates.
