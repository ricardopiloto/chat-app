# Data Model: 084-user-panel-stack

Presentation / layout model only — no persistence, no server entities.

## Entities

### User panel (chrome)

| Field / facet | Type | Notes |
|---------------|------|--------|
| layoutMode | `single` \| `stacked` | Derived from measure vs `--user-panel-name-min` |
| nameMinWidth | CSS length | Default `6ch` (`--user-panel-name-min`) |
| hysteresisBuffer | CSS length | Default `~1.5ch` above min before unstack |

### Identity cluster

| Field | Source | Notes |
|-------|--------|--------|
| handle | `Account.handle` | Primary text; ellipsis if still needed above min |
| status | i18n online | Unchanged |
| avatar / online dot | existing | Unchanged |

### Control placement

| Control | Single-row | Stacked |
|---------|------------|---------|
| leave, mic, deafen, cam, screen share | Main row with identity (current order) | **Upper** centered actions row |
| Settings | Main row (with call controls today) | **Lower** identity row only (beside identity) |

Behaviors (toggle/hangup/account) unchanged — placement only.

## State transitions

```text
                  name would be < min
  [single] ──────────────────────────► [stacked]
                  name would be ≥ min + hysteresis
  [stacked] ◄────────────────────────── [single]
```

- Idle / few icons → typically **single**.
- Crowded single-row that violates min → **stacked**.
- Leave call / hide screen → may return to **single** when measure allows.
- No empty upper row when there are zero call/action icons to show (if somehow stacked with empty actions, fall back to single).

## Validation rules

- Settings MUST NOT appear on the upper actions row when `layoutMode === stacked`.
- Stacked panel MUST increase layout height in flow (reflow); MUST NOT cover channel list.
- Handle truncation MUST use ellipsis and respect min readable width when stacked (identity gets remaining main-row width minus Settings).
