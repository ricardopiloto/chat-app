# Contract: Invite TTL + use cap (046)

## Config

| Env / setting | Default | Notes |
|---------------|---------|--------|
| `DEFAULT_INVITE_TTL_SECS` | `300` | Instance default; labs MAY override |

Constant `INVITE_MAX_USES = 10` (not env-configurable in this feature).

## POST `/api/servers/{server_id}/invites`

**Auth**: owner only (unchanged).

| Body field | Behaviour |
|------------|-----------|
| `expires_in_seconds` omitted | `expires_at = now + default_invite_ttl_secs` |
| `expires_in_seconds: null` | **`400`** — permanent invites rejected |
| `expires_in_seconds: N` (N ≥ 0) | `expires_at = now + N` (advanced/tests; UI omits) |
| `include_history` | unchanged |

**Response 201**: public invite includes `expires_at` (always set for product creates), `code`, `server_id`, `include_history`. MAY include `use_count` / `uses_remaining` (optional FE).

## Usability (preview / register / accept)

Invite is usable only if not revoked, `expires_at > now`, and `use_count < 10`.

| Endpoint | Unusable → |
|----------|------------|
| `GET /api/invites/{code}` (preview) | `404` |
| `POST /api/auth/register` with code | `403` / existing bad-invite mapping |
| `POST /api/invites/{code}/accept` | `410 Gone` |

## Use consumption

On **new** membership created via invite (register or accept):

1. Insert membership with `joined_via_invite_id`.
2. Atomically increment `use_count` where `use_count < 10`.
3. If increment fails → treat as unusable (rollback membership if in same txn).

Already a member → no increment.

## Legacy activation

One-shot migration: revoke (or expire) all invites that would still be usable under old rules (`revoked_at` null and (`expires_at` null or `expires_at > now`)).

## Non-goals

- Per-invite configurable max uses.
- Changing who may create invites.
- Multi-server invites.
