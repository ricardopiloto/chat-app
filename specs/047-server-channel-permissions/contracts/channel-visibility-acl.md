# Contract: Channel visibility & ACL

**Feature**: 047-server-channel-permissions  
**Surfaces**: `GET/POST /api/servers/{id}/channels`, `GET/PATCH /api/channels/{id}`, ACL sub-routes

## Channel JSON (extended)

```json
{
  "id": "…",
  "server_id": "…",
  "name": "…",
  "type": "text",
  "created_by_account_id": "…",
  "visibility": "public",
  "visible_to_new_members": true,
  "my_permission": "write"
}
```

- `visibility`: `public` | `private`
- `visible_to_new_members`: only meaningful when public; always `false` when private
- `my_permission`: effective level for caller — text: `read`|`write`; voice: `listen`|`speak`; omit or `null` if no view (should not appear in list)

## Create channel

`POST /api/servers/{server_id}/channels`

```json
{ "name": "…", "type": "text", "visibility": "private" }
```

- Auth: owner **or** role with `can_create_channels`
- Default `visibility`: `public` if omitted
- Private → seed ACL for creator at max level; `visible_to_new_members=false`
- Public → `visible_to_new_members=true`

## List channels

`GET /api/servers/{server_id}/channels` → **only channels caller can view** (FR-018). Owner sees all.

## Patch channel

`PATCH /api/channels/{id}` (owner or channel creator):

```json
{ "visibility": "public", "visible_to_new_members": false }
```

- Setting private clears `visible_to_new_members`
- Reject `visible_to_new_members: true` while private (400)

## ACL

- `GET /api/channels/{id}/acl` — owner or channel creator
- `PUT /api/channels/{id}/acl` — replace or upsert entries `{ subject_type, subject_id, level }[]`
- Public: grants refine level only (cannot hide member — FR-022)
- Private: absence of grant ⇒ hidden (except owner/creator)

## UI

- Create dialog: público | privado
- Sidebar: private lock icon when `visibility=private` and channel listed
- No greyed-out hidden channels
