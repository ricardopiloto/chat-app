# Data Model: 068-notif-channel-datetime

**Storage**: None new. Reuses `UserNotification` and session unseen channel ids.

## Presentation: durable notification row

| Field (display) | Source | Notes |
|-----------------|--------|--------|
| `channelName` | Resolved from `channel_id` via channel GET / cache | Current name; fallback if missing |
| `whenLabel` | `created_at` → `formatNotifWhen` | Local civil day rules |
| `href` | unchanged | `/channels/{id}` (+ `?msg=` when `message_id`) |

**Not shown on row**: `kind` label, truncated UUID.

## Presentation: session unseen row

| Field (display) | Source | Notes |
|-----------------|--------|--------|
| `channelName` | Same cache / resolve | Fallback if missing |
| `whenLabel` | — | **Must not** invent |

## Client cache

| Key | Value |
|-----|--------|
| `channelId` | `string` name, or unresolved → UI fallback |

## Formatting rules (`whenLabel`)

| Civil day (local) | Pattern |
|-------------------|---------|
| Today | `Hoje HH:MM` |
| Yesterday | `Ontem HH:MM` |
| Other | `DD mmm HH:MM` (short PT month) |

## Validation

- Name + when on **one** line for durable items.
- Fallback short PT phrase without long UUID as primary label.
- Rename: re-fetch or cache refresh shows new name on next resolve (panel reopen / cache miss ok for MVP).
