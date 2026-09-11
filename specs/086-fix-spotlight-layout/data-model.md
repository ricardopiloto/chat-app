# Data Model: 086-fix-spotlight-layout

No new persisted entities. Client Grade presentation modes.

## Grade presentation mode

| Mode | When | Layout |
|------|------|--------|
| **Unified** | `spotlightId` null, or spotlight target not in current screen tiles | Equal CSS grid (083): cams then screens |
| **Spotlight** | `spotlightId` matches a screen tile `accountId` | Main stage (that screen) + bottom filmstrip (other tiles) |

## GradeTile (unchanged from 083)

| Field | Notes |
|-------|--------|
| `key` | `cam:` / `screen:` attach id |
| `kind` | `camera` \| `screen` |
| `accountId` | Owner |

## Derived lists (spotlight mode)

| List | Contents |
|------|----------|
| `mainTile` | Single screen tile with `accountId === spotlightId` |
| `stripTiles` | Remaining tiles: cameras first, then other screens |

## spotlightId

| Attribute | Value |
|-----------|--------|
| Scope | Local client only |
| Type | `accountId` of screen sharer or `null` |
| Clear | Toggle off; sharer stops / leaves screen list (existing) |

## Validation

- Spotlight mode MUST NOT use unified-grid row/column span enlargement.
- Unified mode MUST NOT use main+strip chrome.
- Screen fit (085) applies to screen tiles in main and strip.
