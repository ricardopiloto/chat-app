# Tasks

## 1. Reactive quality state

- [x] 1.1 Add a local quality signal to `frontend/src/voice/callSession.tsx`, initialize from the local participant after connect, update only for local `ConnectionQualityChanged` events in the current room, and reset on teardown.
- [x] 1.2 Ensure Reconnecting, Reconnected, leave, and a replacement room do not leave a stale Excellent/Good value visible; verify with simulated quality events and a real reconnect.
  - Reconnecting → Unknown; Reconnected → refresh from localParticipant; teardown/leave → Unknown; epoch/`alive()` gates old room events.

## 2. Indicator UI

- [x] 2.1 Add a compact local-only signal-bar glyph (for example, four bars) to the primary tile using `Tile`'s existing chip container. Map quality to filled-bar count and green for Excellent/Good or red for Poor/Lost, with Unknown neutral/gray. Provide a tooltip and an aria-label or accessible status text carrying the textual level because the chip no longer shows visible text.
- [x] 2.2 Check grid and stage sizes, dark/light themes, remote tiles, and the view-only popout. Confirm no bar indicator is incorrectly shown for a remote or the viewer connection.
  - Smoke plan: stage + grid local tile shows bars; strip/mini omit them; remote tiles never show them; popout viewer `connectionQuality()` is null. Spot-check light/dark themes for green/red/neutral contrast of the bar glyph.

## 3. Spec validation

- [x] 3.1 Run `openspec validate add-connection-quality-indicator --strict` and confirm it passes with no errors.

## 4. Desktop popout relay

- [x] 4.1 Extend `CallPopoutOwnerState` in `frontend/src/env.d.ts` with a quality field and publish it from `publishPopoutOwnerState` in `frontend/src/voice/callSession.tsx` alongside mic/cam/deafened.
- [x] 4.2 Render the relayed quality as the same compact bar-and-color glyph from task 2.1 inside `PopoutControls`'s existing hover/focus-revealed strip in `frontend/src/voice/CallPopoutWindow.tsx`. Gate it like the mic/cam buttons on `ready()`/`owner()?.available` so it never shows stale or misleading data.
- [x] 4.3 Verify that an active-call popout shows the relayed indicator only on hover/focus, never as permanent grid chrome; the popout's own LiveKit viewer-room `connectionQuality()` is never read for this indicator; and an unavailable owner or a reopened popout does not show a stale value.
