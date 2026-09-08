# Data Model: 046-invite-5min-window

## Entity: Invite (updated)

| Field | Type | Notes |
|-------|------|--------|
| `id` | UUID | PK |
| `code` | string | unique, 36 hex |
| `server_id` | UUID | FK server — scope |
| `created_by_account_id` | UUID | owner |
| `expires_at` | DateTime | **required for new invites**; `created_at + TTL` |
| `include_history` | bool | unchanged |
| `revoked_at` | DateTime? | manual or legacy wipe |
| `created_at` | DateTime | |
| `use_count` | int ≥ 0 | **new**; successful joins; max 10 |

### Constants

| Name | Value |
|------|--------|
| Product default TTL | 300 seconds (`DEFAULT_INVITE_TTL_SECS` fallback) |
| `INVITE_MAX_USES` | 10 |

### Usability predicate

```text
usable ⇔ revoked_at IS NULL
       ∧ expires_at IS NOT NULL ∧ expires_at > now
       ∧ use_count < 10
```

### Relationships

```text
Invite ──N:1──► Server
Invite ──1:N──► Membership (via joined_via_invite_id)  // each new membership may +1 use_count
```

## State transitions

```text
[created] use_count=0, expires_at=now+TTL
    --successful join--> [created] use_count++
    --use_count reaches 10--> [exhausted] (not usable)
    --now >= expires_at--> [expired]
    --owner revoke OR legacy migration--> [revoked]
```

## Migration effects

- Add `use_count DEFAULT 0`.
- All previously usable rows → `revoked_at = now` (or equivalent), so SC-007.

## Validation rules

- Create: reject permanent (`expires_at` null intent).
- Increment: atomic `use_count < 10`.
- Already-member accept: no increment.
