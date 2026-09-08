# Data Model: 047-server-channel-permissions

**Feature**: Permissionamento de servidor e canais  
**Storage**: SQLite (new migration `0012_server_channel_permissions.sql`)

## Existing (unchanged semantics)

| Entity | Key fields | Notes |
|--------|------------|-------|
| `server` | `owner_account_id` | Owner = full channel bypass (FR-019) |
| `membership` | `(account_id, server_id)`, `joined_at` | = server access; add **delete** for kick |
| `channel` | `created_by_account_id`, `type` | Extend with visibility columns |
| `channel_role` | `co_director` | **Do not use** for 047 ACL |

## New / extended

### Channel visibility columns

| Column | Type | Meaning |
|--------|------|---------|
| `visibility` | `TEXT` CHECK (`public`\|`private`) | Modo do canal |
| `visible_to_new_members` | `INTEGER` 0/1 | Só válido se `public`; private → 0 |

**Defaults on create**: public → `visible_to_new_members=1`; private → `0`.  
**Backfill**: all existing → `public`, `1`.

### `server_role`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | UUID |
| `server_id` | TEXT FK | |
| `name` | TEXT | Unique per server (normalized) |
| `can_create_channels` | INTEGER 0/1 | FR-013 |
| `created_at` | TEXT | |

### `server_role_member`

| Column | Type | Notes |
|--------|------|-------|
| `role_id` | TEXT FK | |
| `account_id` | TEXT FK | Must be member of server |
| PK | `(role_id, account_id)` | |

### `channel_acl`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | |
| `channel_id` | TEXT FK | |
| `subject_type` | TEXT | `account` \| `role` |
| `subject_id` | TEXT | account_id or role_id |
| `level` | TEXT | See levels |
| Unique | `(channel_id, subject_type, subject_id)` | |

**Levels**:

| Channel type | `level` values |
|--------------|----------------|
| `text` | `read`, `write` (`write` ⊃ read) |
| `voice_video` | `listen`, `speak` (`speak` ⊃ listen; speak includes camera) |

## Effective permission (derived)

Inputs: account, channel (+ server, membership, roles, acls).

```
if !membership → none
if account == owner → view + max level
if channel.private:
  grants = acls for account ∪ acls for account's roles
  if empty && account != created_by → none
  if account == created_by && empty → treat as write|speak
  else level = max(grants); view = true
if channel.public:
  if visible_to_new_members OR account == created_by OR has any acl grant:
    view = true
    level = max(grants) if grants else write|speak
  else → none  // public but not for "new" and no grant
```

(Align implement with [research.md](./research.md) R5.)

## State transitions

| Event | Effect |
|-------|--------|
| Create public | visibility=public, visible_to_new=1 |
| Create private | visibility=private, visible_to_new=0; ACL seed creator write\|speak |
| Public → private | visible_to_new=0; members without ACL lose view (except owner/creator) |
| Private → public | visible_to_new=1 (default); all members with rule above |
| Accept invite | membership++; sees public∩visible_to_new |
| Kick member | delete membership; lose all channel access; strip role memberships |
| Assign role | inherit role ACLs + can_create_channels |

## Validation

- Cannot set `visible_to_new_members=1` on private (FR-021).
- Cannot orphan server without owner (US1 edge).
- ACL subject role must belong to same server as channel.
- Only owner or channel creator manage ACL; only owner manage roles; create channel: owner or `can_create_channels`.
