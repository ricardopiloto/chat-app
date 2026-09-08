# Data Model: 059-server-owner-role

## ServerRole (extended)

| Field | Type | Notes |
|-------|------|--------|
| id | UUID | PK |
| server_id | UUID | FK server |
| name | string | Unique per server; system role name fixed **`Dono`** |
| capabilities | RoleCapabilities | System Dono = `owner_all()` (all flags true) |
| is_system | boolean | NEW — `true` for auto Owner/Dono profile |
| member_ids | UUID[] | At most the server owner for system Dono |
| can_create_channels | bool | Legacy mirror of manage channels |

**Constraints**:
- At most one `is_system = true` role per server (enforce in ensure helper / migration).
- Name `Dono` reserved: cannot create another role with that exact name.
- System role: not deletable; name and capabilities not mutable via PATCH.

## Server (unchanged)

| Field | Role |
|-------|------|
| owner_account_id | Source of truth for ownership (FR-010); must be assigned to system Dono |

## Assignment rules

```text
create_server → ensure Dono (is_system) → assign owner
migration     → ensure Dono → reassign owner to Dono (drop prior membership on other roles)
put_member_role(owner, !Dono) → reject
put_member_role(non-owner, Dono) → reject
```

## Validation

- Name for new roles: trimmed non-empty; ≠ `Dono` when creating user roles.
- System Dono caps must remain full set after any rejected patch attempt.
