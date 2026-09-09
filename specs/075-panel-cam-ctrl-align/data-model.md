# Data Model: 075-panel-cam-ctrl-align

No persistent entities or API schemas. This feature is **view-state + layout geometry**.

## View states (shell)

| State | Source | Effect on call controls |
|-------|--------|-------------------------|
| `stage-mode` | `.shell.stage-mode` (`AppShell` / `mesa:stage-mode`) | User is in voice/stage layout |
| `channels-collapsed` | `.shell.channels-collapsed` when channels list not expanded | Nav/panel column narrower |
| **Narrow column** | `stage-mode` **and** `channels-collapsed` | Call icons **centered**; closed camera split must fit inside `.user-panel` |
| Wide / channels open | `stage-mode` without `channels-collapsed` (or non-stage) | Height parity still required; group centering **not** required; leave may stay `margin-left: auto` |

## Layout entities (UI)

### User panel (`.user-panel`)

- Card under shell-nav spanning rail (+ channels when expanded).
- Contains identity row + optional `.user-panel-calls` when in a call.

### Call control group (`.user-panel-calls`)

Ordered peers:

1. Mic (`.user-panel-ctrl`) — reference size **32×32**
2. Deafen (`.user-panel-ctrl`) — **32×32**
3. Camera split (`.call-ctrl-split.user-panel-cam-split`) — exterior **height 32**; horizontal cam + chevron; total width ≤ panel content
4. Leave (`.user-panel-ctrl.user-panel-leave`) — **32×32**; in wide layout often `margin-left: auto`

### Camera / blur split (closed)

- Main camera button + chevron (blur menu trigger).
- Closed state: entirely inside `.user-panel` box (border included).
- Open blur menu: overlay; may escape card (not modeled as contained).

## Validation rules (from FR)

| Rule | Constraint |
|------|------------|
| Height parity | Camera split exterior height = peer `user-panel-ctrl` height (32px target) |
| Horizontal split | Cam + chevron side-by-side; chevron remains blur entry |
| Narrow center | `justify-content: center` only in narrow column state |
| No peer enlargement | Do not grow mic/deafen/leave to match old camera size |
| Fit | Closed split width + borders ≤ user-panel content width in narrow column |

## State transitions

```text
channels expanded ⇄ collapsed  →  recenter / left-aligned leave as CSS dictates
enter/leave call               →  show/hide .user-panel-calls
blur menu open/close           →  overlay only; closed geometry unchanged
```

No DB migrations, prefs keys, or BE types.
