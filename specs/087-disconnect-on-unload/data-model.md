# Data Model: 087-disconnect-on-unload

No new tables. Uses existing voice occupancy.

## Voice occupant (existing)

| Field | Role for 087 |
|-------|----------------|
| `account_id` | One live occupancy row per account (product rule) |
| `channel_id` / `server_id` | Call location |
| `last_seen_at` | Updated by heartbeat / media PATCH; stale if older than `OCCUPANT_STALE_SECS` |
| media flags | Cleared when row deleted on leave/stale |

## Lifecycle

```text
join → occupant row + heartbeat updates last_seen_at
     → intentional leave / unload leave → delete row + broadcast occupancy
     → no heartbeat → after ~OCCUPANT_STALE_SECS sweeper deletes + broadcast
```

## Unload leave attempt (client)

| Attribute | Value |
|-----------|--------|
| Trigger | `pagehide` while `live` + `channelId` |
| Transport | `fetch` keepalive POST leave (preferred) |
| Outcome | Best-effort; may fail on abrupt kill → server sweeper |

## Validation

- Leave is idempotent (already not occupying → success).
- Stale cutoff ≤ ~60s to meet SC-005 (current 45s OK).
- Sweeper must broadcast so peers update without refresh.
