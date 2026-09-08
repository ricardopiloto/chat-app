# Contract: Role hierarchy

**Feature**: 060-permissions-parity-phase1  
**Surfaces**: roles CRUD, assign, reorder; kick; mute

## Role JSON (extended)

```json
{
  "id": "…",
  "server_id": "…",
  "name": "Moderador",
  "position": 20,
  "is_system": false,
  "capabilities": { },
  "can_create_channels": false,
  "member_ids": []
}
```

- `position`: integer; higher = more authority
- System Dono: highest reserved; clients show non-editable rank badge

## List / create

- `GET /api/servers/{server_id}/roles` — include `position`; sort desc by position
- `POST /api/servers/{server_id}/roles` — new role at **bottom**; requires `can_manage_roles`

## Reorder

`PUT /api/servers/{server_id}/roles/positions`

```json
{ "roles": [ { "id": "…", "position": 30 }, { "id": "…", "position": 10 } ] }
```

- Auth: owner **or** `can_manage_roles`
- Non-owner: every role in the payload whose position **changes** must have **previous** position `<` actor position; no role may be placed at `>=` actor position; cannot move Dono/system
- Owner: may reorder any non-breaking system rules (Dono stays top)

## Assign role

`PUT` / existing assign endpoint — deny if target member’s **current** role position `>=` actor position (unless owner). Deny assigning a role with position `>=` actor position.

## Kick / mute

- Existing endpoints: additionally enforce hierarchy vs target
- Errors:

```json
{
  "error": "Não podes moderar este membro: o perfil dele está no mesmo nível ou acima do teu.",
  "code": "hierarchy_denied"
}
```

## UI

- RolesManagePage / RolePermissionsPage: drag or up/down to reorder (respect hierarchy)
- MembersManagePage: show role position order; disable kick/mute/assign when hierarchy blocks (optional optimistic; server is source of truth)
