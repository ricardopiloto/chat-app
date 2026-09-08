# Data Model: 058-channel-mute-member

## RoleCapabilities (extended)

| Field | Type | Default | Notes |
|-------|------|---------|--------|
| can_mute_members | boolean | false | **Silenciar membros**; owner implied true via owner path |

Migration adds `server_role.can_mute_members INTEGER NOT NULL DEFAULT 0`.

## ChannelMute

| Field | Type | Notes |
|-------|------|--------|
| channel_id | UUID PK part | Channel scope |
| account_id | UUID PK part | Muted member |
| muted_by_account_id | UUID | Actor |
| created_at | datetime | When applied/renewed |
| ends_at | datetime | Exclusive end; active while `now < ends_at` |

**Constraints**: `UNIQUE (channel_id, account_id)`; FK to channel/account as per project norms.

**Validation**:
- `duration_minutes` ∈ {5,10,15,30} ∪ [1, 1440]
- Target ≠ server owner; target ≠ actor; target is server member
- Actor: owner ∨ `can_mute_members`

## Server membership (unchanged semantics)

| Action | Effect |
|--------|--------|
| Remover membro | Delete membership row only |
| Account | Untouched |

## State transitions (ChannelMute)

```text
[none] --PUT mute(duration)--> [active until ends_at]
[active] --PUT mute(duration)--> [active, new ends_at]
[active] --DELETE unmute------> [none]
[active] --time passes--------> [expired / treated as none]
[active] --member kicked------> [none] (cleanup preferred)
```

## Composer view model

| Field | Source |
|-------|--------|
| muted | GET `/mutes/me` → active |
| ends_at | same |
| message | localized string with end time |
