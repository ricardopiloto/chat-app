# Contract: Owner role bootstrap

**Feature**: 059-server-owner-role

## POST `/api/servers` (changed behaviour)

After successful create (201 + server JSON):

1. A role exists on that server with `name == "Dono"` and `is_system == true`.
2. That role’s `capabilities` equal full owner set (`owner_all` / all flags true including current caps such as `can_mute_members`).
3. `GET /api/servers/{id}/roles` lists the owner account id in that role’s `member_ids`.
4. Owner does **not** appear only under implicit «Sem papel» in roster grouping (has Dono assignment).

## GET `/api/servers/{id}/roles` (response shape)

Each role may include:

```json
{
  "id": "…",
  "server_id": "…",
  "name": "Dono",
  "is_system": true,
  "can_create_channels": true,
  "capabilities": { "…": true },
  "member_ids": ["<owner_account_id>"]
}
```

`is_system` defaults to `false` for ordinary roles (serde/API default).

## Migration / existing DBs

After migrate: every server has exactly one system Dono; `owner_account_id` is in its `member_ids`.

## Acceptance probes

1. Create server → list roles → one `Dono` with `is_system`, owner in `member_ids`.
2. Fresh DB / migrated fixture → same for pre-existing servers.
