# Contract: User-panel call control layout (075)

**Scope**: Frontend CSS/layout for `.user-panel` call controls. No HTTP API.

## Selectors / classes (stable)

| Class / context | Role |
|-----------------|------|
| `.user-panel` | Panel card bounds for overflow checks |
| `.user-panel-calls` | Flex row of call controls |
| `.user-panel-ctrl` | Peer control tile (mic, deafen, leave, camera main) — **32×32** target |
| `.call-ctrl-split.user-panel-cam-split` | Horizontal camera + blur chevron group |
| `.call-ctrl-chevron` | Blur menu trigger (must remain) |
| `.shell.stage-mode.channels-collapsed` | Narrow-column layout trigger for centering |

## Visual contract

### Height (FR-001, FR-002, FR-006)

- Exterior height of `.user-panel-cam-split` (including its border) **equals** exterior height of adjacent `.user-panel-ctrl` buttons.
- Target peer size remains **32×32** CSS px (do not raise peers to stage 44px split).

### Split shape (FR-002, FR-003)

- Closed control is **inline-flex horizontal**: camera button | chevron.
- Chevron continues to open `CameraBlurMenu` (or equivalent); no long-press-only redesign.

### Narrow column centering (FR-004)

When `.shell` has **both** `stage-mode` and `channels-collapsed`:

- `.user-panel-calls` centers its children horizontally in the panel content area.
- Leave button must not remain alone on the far right via `margin-left: auto` in this state.

When channels are **not** collapsed (or not stage):

- Centering of the whole group is **not** required; existing leave `margin-left: auto` MAY remain.

### Overflow (FR-005)

When stage + channels collapsed:

- Closed `.user-panel-cam-split` border box ⊆ `.user-panel` padding box (no horizontal/vertical overflow of the card caused by the closed split).
- Open blur menu panel MAY paint outside `.user-panel`.

## Non-goals

- Changing LiveKit / blur runtime behavior.
- Redesigning stage chrome `.call-ctrl-split` sizes outside the user panel.
- Backend or preference storage.

## Verification

Manual scenarios in [quickstart.md](../quickstart.md). Optional DevTools: compare `getBoundingClientRect().height` of cam split vs mic button.
