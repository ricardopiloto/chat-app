# Contract: Server stale occupancy cleanup (087)

**ID prefix**: SO  
**Surface**: API + background sweeper  
**Related**: [spec](../spec.md), `voice_occupant`, `OCCUPANT_STALE_SECS`, `voice.occupancy` WS

## Rules

| ID | Rule |
|----|------|
| SO-01 | Occupants with `last_seen_at` older than the stale threshold MUST be removed (same effect as leave). |
| SO-02 | Stale threshold MUST be **≤ 60 seconds** (current 45s acceptable). |
| SO-03 | Cleanup MUST run on a **periodic server sweeper** (not only on join/leave/GET) so WS-only peers receive updates. |
| SO-04 | Each stale removal MUST **broadcast** updated `voice.occupancy` (and related grid cleanup as today’s leave does). |
| SO-05 | Leave and stale delete MUST be idempotent and safe if unload leave already removed the row. |
| SO-06 | Stale cleanup is **required** product behavior (FR-008), not optional. |

## Non-goals

- Changing heartbeat interval semantics beyond what is needed for last_seen freshness
- Removing expire-on-request paths (may remain as defense in depth)
