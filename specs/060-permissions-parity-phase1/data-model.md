# Data Model: 060-permissions-parity-phase1

**Feature**: Paridade de permissionamento — Fase 1  
**Storage**: SQLite — migration `0017_permissions_parity_phase1.sql`  
**Depends on**: `server_role` / `channel_acl` (0012–0016)

## Extended: `server_role`

| Column | Type | Notes |
|--------|------|-------|
| `position` | `INTEGER NOT NULL` | Higher = more admin authority. **New** |

**Constraints / rules**

- System Dono (`is_system=1`): position pinned (e.g. `1000`); not movable below other roles; not deletable (059).
- New non-system role: `position = COALESCE(MIN(position) FILTER (WHERE is_system=0), 0) - 1` or equivalent “bottom”.
- Unique ordering per server preferred but not required if ties broken by `id` (ties → treat as equal rank → neither can moderate the other).

**Backfill (0017)**

1. `is_system=1` → `position=1000`
2. Other roles: `ROW_NUMBER()` by `created_at ASC, name ASC` × 10 → `10, 20, …`

## Extended: `channel_acl` (overwrites)

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | unchanged |
| `channel_id` | TEXT FK | unchanged |
| `subject_type` | TEXT | `account` \| `role` \| **`everyone`** |
| `subject_id` | TEXT | account/role id; for `everyone` = nil UUID |
| `level` | TEXT | `read` \| `write` \| `listen` \| `speak` |
| `effect` | TEXT | **`allow` \| `deny`** — **New**, default `allow` |

**Unique**: `(channel_id, subject_type, subject_id, level)` — allow multiple levels per subject **or** keep one row per subject and encode only max level (legacy UNIQUE was without level).  

**Decision**: Relax unique to `(channel_id, subject_type, subject_id, level, effect)` so the same subject can `allow read` and `deny write`. Drop old unique `(channel_id, subject_type, subject_id)`; migrate carefully.

**Validation**

- `everyone` + non-nil `subject_id` → reject
- `deny` + (`read`|`listen`) on **public** channel → reject (FR-004a)
- Role subject must belong to channel’s server
- Account subject must be member

**Migration**: `ALTER … ADD effect … DEFAULT 'allow'`; existing grants unchanged semantically.

## Derived: role position of a member

```text
if account == server.owner → +∞ (always)
else if assigned server_role → role.position
else → -1
```

## Derived: `AccessDecision`

| Field | Meaning |
|-------|---------|
| `view` | bool |
| `level` | optional PermLevel |
| `factors` | ordered list of reason codes / PT labels (base, everyone, role, member, owner, cap) |

Used by authz gates and inspect API.

## State transitions

| Event | Effect |
|-------|--------|
| Create role | Insert at bottom position |
| Reorder roles | Update positions; actor may only change roles with `position < actor.position` (owner exempt) |
| Create private channel | Seed creator `allow` + max level (account) |
| PUT ACL | Replace/upsert overwrite set; validate public deny-view |
| Kick / mute / assign | Require hierarchy + capability |
| Migrate 0017 | positions + effect=allow; subject_type everyone unused until UI |

## Out of model (Phase 1)

- Multi-role membership
- Category sync
- Separate ADMINISTRATOR flag
- Server-wide timeout
