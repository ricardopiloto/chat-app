# Quickstart: 075-panel-cam-ctrl-align

Validate user-panel camera control size, narrow-column centering, and no closed-control overflow.

## Prerequisites

- Frontend + backend running (e.g. `npm run dev`, `cargo run` / docker).
- Account that can join a voice channel with camera/blur controls in the user panel.
- Ability to toggle **channels list** collapsed/expanded and enter **stage** (voice stage layout).

## Setup

1. Open the app, unlock identity, join a server with a voice channel.
2. Join the voice call so `.user-panel-calls` is visible (mic, deafen, camera split, leave).

## Scenarios

### A — Height parity (any layout with call controls)

1. With call controls visible, compare camera **split** to mic button.
2. **Expect**: Same exterior **height**; camera group does not look like a taller block.
3. Optional DevTools: `height` of `.user-panel-cam-split` ≈ height of `.user-panel-ctrl` (mic).

### B — Horizontal compact split + blur still works

1. Confirm camera control is still **side-by-side** camera + chevron (not stacked).
2. Open blur menu via chevron; select an option.
3. **Expect**: Menu usable (SC-004); closed split stays compact.

### C — Narrow column: center + no overflow

1. Enter **stage** mode and **collapse** the channels list (`.shell.stage-mode.channels-collapsed`).
2. **Expect**: Call control icons are **centered** in the user-panel calls row (not leave alone on the far right).
3. **Expect**: Closed camera split **border** stays inside the user-panel card (no overflow past the card edge).

### D — Wide / channels open: height ok, centering optional

1. Still in stage (or call), **expand** channels so the panel is wider.
2. **Expect**: Camera height still matches peers.
3. **Expect**: Full-group centering is **not** required; leave may sit to the right as before.

## Regression notes

- Speaking aura on mic should not enlarge the camera split or push it outside the panel.
- Stage/header call splits outside the user panel may remain at their existing larger size.

## Automated check

```bash
cd frontend && npx tsc --noEmit
```

(Only needed if `UserPanel.tsx` or other TS changes; pure CSS still OK to run.)
