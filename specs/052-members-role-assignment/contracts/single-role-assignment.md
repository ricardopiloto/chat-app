# Contract: Single-role assignment API & UI

**Feature**: 052-members-role-assignment

## API

### Assign / clear member role

`PUT /api/servers/{serverId}/members/{accountId}/role`

Auth: session cookie. AuthZ: owner **or** effective `can_manage_roles`.

Body:

```json
{ "role_id": "<uuid>" }
```

or

```json
{ "role_id": null }
```

Responses:

| Status | Meaning |
|--------|---------|
| 200 | Role updated; body may return member summary or role |
| 400 | Not a member / role not on server / invalid body |
| 403 | Missing manage-roles |
| 404 | Server / account / role not found |

**Invariant**: After success, the account has at most one `server_role_member` row for that server.

### Legacy `PUT /api/servers/{serverId}/roles/{roleId}/members`

If retained: MUST enforce the same uniqueness (setting members on role A removes those accounts from other roles on the same server). Prefer UI uses member-centric endpoint only.

### List roles

Unchanged shape; `member_ids` partitions members.

## UI — Members manage page

Route: `/servers/:serverId/members` (title «Gerir membros» ou equivalente).

| Requirement | Probe |
|-------------|--------|
| Search/filter | Input filters visible handles |
| One control per member | Select / radio: Sem papel ∪ roles |
| Save or immediate patch | Change persists; caps update after roles refresh |
| Gate | Unreachable / redirect if not owner/`can_manage_roles` |

## UI — RolesPanel («Perfis»)

| Forbidden | No member checkboxes / assign list |
| Required | Create, open permissions, delete |
