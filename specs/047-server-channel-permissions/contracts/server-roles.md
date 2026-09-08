# Contract: Server roles

**Feature**: 047-server-channel-permissions  
**Surface**: `/api/servers/{id}/roles` (new)

## Role JSON

```json
{
  "id": "…",
  "server_id": "…",
  "name": "Jogadores",
  "can_create_channels": false,
  "member_ids": ["…"]
}
```

## Endpoints

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| GET | `/api/servers/{id}/roles` | Member | List roles (+ members) |
| POST | `/api/servers/{id}/roles` | Owner | Create `{ name, can_create_channels }` |
| PATCH | `/api/servers/{id}/roles/{role_id}` | Owner | Rename / toggle `can_create_channels` |
| DELETE | `/api/servers/{id}/roles/{role_id}` | Owner | Delete role; cascade ACL subjects + members |
| PUT | `/api/servers/{id}/roles/{role_id}/members` | Owner | Set member id list (must be server members) |

## Create-channel gate

Caller may create channel iff:

- `account_id == server.owner_account_id`, OR
- ∃ role membership with `can_create_channels = 1`

FE: hide/disable create control when false; BE: 403 otherwise.

## Kick member

| Method | Path | Auth | Behavior |
|--------|------|------|----------|
| DELETE | `/api/servers/{id}/members/{account_id}` | Owner | Remove membership; cannot remove sole owner / self if only owner |

## Out of scope

- Other role capabilities beyond `can_create_channels`
- Overloading `channel_role.co_director`
