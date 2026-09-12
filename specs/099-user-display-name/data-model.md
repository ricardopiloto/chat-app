# Data Model: User Display Name

**Feature**: 099-user-display-name  
**Date**: 2026-09-11

## Account (extended)

| Field | Type | Rules |
|-------|------|--------|
| `id` | UUID | PK |
| `handle` | TEXT | Unique, immutable via this feature |
| `display_name` | TEXT NULL | Optional public label; NULL = unset |
| (existing) | password, keys, avatar, … | Unchanged |

### Validation

- Trim on write; whitespace-only → NULL.
- Max **64** Unicode scalars when set.
- No uniqueness requirement.
- Must not contain C0/C1 control characters (except ordinary whitespace that is then trimmed).

### Derived presentation

| Context | Value |
|---------|--------|
| Public label | `display_name` if set, else `handle` |
| Signed-in-as (self) | Always `handle` |
| Login / @mention address | Always `handle` |

## API payloads (conceptual)

### AuthAccount

```json
{
  "id": "…",
  "handle": "alice",
  "display_name": "Alice the Brave",
  "has_avatar": true,
  "…"
}
```

`display_name` may be `null` or omitted when unset.

### MemberView / OccupantView / MentionableView

Include `handle` + `display_name` (nullable) so clients can render without extra fetches.

## State transitions

| Action | Effect |
|--------|--------|
| Set non-empty name | Persist trimmed string; public surfaces update |
| Clear / empty save | `display_name = NULL`; surfaces fall back to handle |
| Re-login | Same persisted value |

## Relationships

- Display name is **account-scoped** (not per-server membership nickname).
- Does not replace or rename `handle`.
