# Data Model: 083-grade-screen-tiles

Client-only view model (no server schema changes).

## GradeTile

| Field | Type | Notes |
|-------|------|--------|
| key | string | Unique DOM/attach id, e.g. `cam:<accountId>` / `screen:<accountId>` |
| kind | `"camera" \| "screen"` | Drives chip chrome and which track source attaches |
| accountId | string | Owner participant |

**List order (canonical)**: all `kind === "camera"` (stable call order), then all `kind === "screen"` (stable sharer order).

## Local spotlight

| Field | Type | Notes |
|-------|------|--------|
| spotlightAccountId | string \| null | Must refer to an account with an active **screen** tile; null = equal grid |

**Transitions**: set/clear by user on screen chip only; auto-clear when that screen tile disappears.

## Relationships

- Occupancy / `screen_on` (082) → which `screen` tiles exist.
- LiveKit Camera / ScreenShare publications → media bound to matching `GradeTile.key`.
- `viewMode === "grid"` → render unified GradeTile list; composition unchanged.

## Invariants

1. No separate layout regions for screen vs camera (single grid).
2. Without spotlight, all cells equal weight.
3. At most one camera tile and one screen tile per accountId in the list.
4. Spotlight never targets `kind === "camera"`.
