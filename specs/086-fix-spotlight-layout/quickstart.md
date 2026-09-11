# Quickstart: 086-fix-spotlight-layout

Validate Grade spotlight shows a large screen on top and a bottom filmstrip — not a crushed/hidden tile.

## Prerequisites

- App running (`cargo run` + `npm run dev`)
- ≥2 browsers, same voice channel, **Grade** mode
- At least one camera on + ability to screen-share

## 1 — Spotlight = main + bottom strip (SL-01–SL-04)

1. User A: camera on + start screen share.
2. User B (or A): click **spotlight** (★) on the screen tile chip.
3. **Expect**: Shared screen fills the **upper main** area of the Grade stage; camera(s) sit in a **compact strip at the bottom**. Screen is readable (not ~8px / off-stage).
4. **Expect**: Main area is clearly larger than before spotlight (anti-hide).

## 2 — Clear spotlight restores unified grid (SL-05)

1. Click spotlight off on the same screen tile.
2. **Expect**: Back to equal unified grid (083); cams then screens; no main/strip chrome.

## 3 — Multi tiles in strip (SL-03)

1. ≥2 cameras + 1 share; spotlight the share.
2. **Expect**: All non-spotlight cameras appear in the bottom strip (identifiable).
3. Optional: second sharer — their screen appears in the strip (not main); main stays the spotlighted share.

## 4 — Solo screen (SL-09)

1. Spotlight with only the screen tile (or no other tiles).
2. **Expect**: Main fills stage; no empty strip bar required.

## 5 — Regressions

1. Screen fit still show-all / letterbox in main (085).
2. Composition: still no screen video; cameras OK.
3. Start/stop share still works; stopping share clears spotlight if that sharer was spotlighted.

## Typecheck

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```
