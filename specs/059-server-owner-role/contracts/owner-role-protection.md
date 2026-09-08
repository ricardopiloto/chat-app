# Contract: Owner role protection

**Feature**: 059-server-owner-role

## DELETE `/api/servers/{server_id}/roles/{role_id}`

If role `is_system` → **403** or **409** with clear message (e.g. cannot delete system role). Non-system delete unchanged.

## PATCH `/api/servers/{server_id}/roles/{role_id}`

If role `is_system`:
- Changing `name` → reject (**400**/**403**).
- Changing `capabilities` → reject (**400**/**403**).
- Empty / no-op patch may return current role unchanged or reject consistently — prefer return 200 with unchanged entity **or** 403 on any mutating fields; document in tests.

## POST `/api/servers/{server_id}/roles`

Body with `name` trim-equal to `Dono` → **400** (reserved name).

## PUT `/api/servers/{server_id}/members/{account_id}/role`

Body `{ "role_id": "<uuid>" | null }`:

| Case | Result |
|------|--------|
| `account_id` is owner, `role_id` is system Dono | **200** (idempotent OK) |
| `account_id` is owner, `role_id` null or other role | **403** |
| `account_id` is not owner, `role_id` is system Dono | **403** |
| `account_id` is not owner, other roles / null | Unchanged behaviour |

## Acceptance probes

1. Delete Dono → fail; delete custom role → OK.
2. Patch Dono capabilities → fail; caps still full.
3. Create role named Dono → fail.
4. Assign Dono to member → fail; clear owner role → fail.
