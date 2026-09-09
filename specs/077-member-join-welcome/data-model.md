# Data Model: 077-member-join-welcome

## Message (extended)

| Field | Change | Rules |
|-------|--------|--------|
| `kind` | NEW | `'user'` (default) \| `'system'` (welcome, etc.) |
| `sender_account_id` | nullable for `system` | NOT NULL for `user` |
| `content_ciphertext` | nullable for `system` | NOT NULL for `user` |
| `content_plaintext` | NEW, nullable | Required when `kind = 'system'`; null for user |
| existing | unchanged | `channel_id`, `created_at`, `reply_to_message_id` (null for system) |

**Invariants**: System welcome has no reply target; no mention rows for welcome; body is rendered template with `{nome}` replaced by joining member display name/handle.

## Server (extended)

| Field | Type | Rules |
|-------|------|--------|
| `welcome_channel_id` | TEXT NULL FK → channel | Owner-configured destination; must be text channel on this server when set |
| `welcome_message_template` | TEXT NULL | Must contain `{nome}` when non-null/non-empty; null → product default |

No disable flag (always on).

## Invite (extended)

| Field | Type | Rules |
|-------|------|--------|
| `welcome_channel_id` | TEXT NULL FK → channel | **Per-invite** only; required at create when server has no owner destination and no text `geral`; ignored for resolution if owner/`geral` apply |

## JoinWelcomeAnnounce (logical)

Not a table — side effect on invite accept / register-via-invite:

1. Resolve destination (owner → `geral` → invite).
2. Render template with member name.
3. Insert `kind=system` message; WS notify channel viewers.
4. On any failure: log; membership already committed.

## Validation

- Create invite without resolvable destination and without `welcome_channel_id` → **400**.
- PATCH welcome settings: owner only; template must include `{nome}`; channel must be text on server.
- Renamed/deleted `geral` or destination → fall through resolution; announce may no-op (join still OK).
