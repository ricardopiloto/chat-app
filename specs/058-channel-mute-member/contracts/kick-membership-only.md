# Contract: Kick = membership only

**Feature**: 058-channel-mute-member  
**Endpoint**: `DELETE /api/servers/{server_id}/members/{account_id}`

## Behaviour

- **204**: Membership removed; target no longer lists the server.
- Account row for `account_id` **still exists**; login with same credentials succeeds.
- **Must not** delete `account` / identity vault for the kicked user.
- Owner cannot be removed (**409** as today).

## UI

Confirmations MUST say remove **from server**, not delete/erase **account**.

## Acceptance probes

1. Kick member → `GET /api/servers` as kicked user omits server; `POST /api/auth/login` still works.
2. DB/account lookup still finds the account id after kick.
3. FE copy audit: no «apagar conta» on kick flows.
