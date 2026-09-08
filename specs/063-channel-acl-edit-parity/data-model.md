# Data Model: 063-channel-acl-edit-parity

No new persisted entities. Authorization view over existing membership, roles, and channels.

## ChannelManageContext (logical)

| Field | Source | Notes |
|-------|--------|--------|
| actor_id | session | Caller |
| server_owner_id | server | |
| channel_id / creator_id | channel | `created_by_account_id` |
| actor_can_manage_channels | aggregated caps | |
| actor_position | `effective_position(is_owner, role.position)` | Owner → max |
| creator_position | same for creator account | Missing member → `NO_ROLE_POSITION` |
| is_owner / is_creator | derived | |

## Authorization outcome

| Outcome | Meaning |
|---------|---------|
| Allow manage | May GET/PUT ACL, inspect, delete, rename/patch |
| Deny | 403 / hide UI |

### Decision table (channel-level)

| Actor | Result |
|-------|--------|
| Server owner | Allow |
| Channel creator | Allow (own channel) |
| `can_manage_channels` and `actor_pos > creator_pos` | Allow |
| Else | Deny |

### ACL subject rows (additional on PUT)

| Subject | Extra check if not owner/creator |
|---------|----------------------------------|
| everyone | None |
| account | `actor_pos > subject_member_pos` |
| role | `actor_pos > role.position` |

## State transitions

```text
open permissions menu
  → UI canManageChannel?
  → GET acl / load panel
  → edit visibility + entries
  → PUT acl (+ PATCH channel) — server re-checks channel + each subject

delete channel
  → UI canManageChannel?
  → DELETE — server re-checks + last-of-type rules
```

## Validation

- Hierarchy uses existing `server_role.position` / `DONO_POSITION` / `NO_ROLE_POSITION`.
- No change to `channel_acl` schema or overwrite resolution order.
