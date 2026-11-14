# Tasks

## 1. Typed cross-window bridge

- [x] 1.1 Add validated popout-command and owner-state IPC in `frontend/electron/main.ts`, reusing `popoutOpener` and checking sender webContents and channel ID; handle destroyed windows cleanly.
- [x] 1.2 Expose typed send/listen methods in `frontend/electron/preload.ts` and `frontend/src/env.d.ts`, with removable listeners and no generic IPC escape hatch.

## 2. Owner command handling

- [x] 2.1 In the main call provider, accept only mic, camera, deafen, and leave commands for its current live channel; call the owning session methods and publish authoritative state on open and changes.
- [x] 2.2 Verify permission and listen-only behavior: mic/camera remain disabled when `canSpeak` is false; a stale channel command is rejected without touching a newer call.
  - Owner rejects mismatched `channelId` / non-live status and re-publishes state; `setMic`/`setCam` gated on `canSpeak()`.

## 3. Popout UI

- [x] 3.1 Add a fixed bottom-edge control overlay to `CallPopoutWindow.tsx` and popout CSS, using the existing button/icon conventions and owner state. Keep the top edge as a small empty inset; reserve both insets in the grid area, including spotlight, regardless of visibility. Hide controls at rest, reveal them on popout hover or keyboard focus, and hide them on pointer leave. Show disabled/error state when the owner is unavailable; fit four buttons and at least 80px of tile area at the 240×180 minimum.
- [x] 3.2 Manually verify controls are hidden at rest, appear when hovering anywhere in the popout or focusing a control, and hide on pointer leave; revealing them neither covers nor shifts grid or spotlight tiles at normal and 240×180 sizes. Verify mic, camera, and deafen change the real call, Hang Up leaves the call and closes the popout, and closing the popout alone leaves the call running.
  - Smoke plan: open popout → controls hidden until hover/focus → toggle mic/cam/deafen in main call → Hang Up ends call + closes popout → close window alone keeps call. Check 240×180 grid/spotlight; listen-only disables mic/cam.

## 4. Spec validation

- [x] 4.1 Run `openspec validate add-popout-call-controls --strict` and confirm it passes with no errors.
