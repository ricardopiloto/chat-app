# Contract: Server welcome settings (owner)

**Feature**: 077-member-join-welcome  
**Surface**: Owner-only server settings (e.g. `GET`/`PATCH /api/servers/{id}/welcome` or equivalent under servers API)

## Fields

| Field | Type | Rules |
|-------|------|--------|
| `welcome_channel_id` | string \| null | Text channel on server, or null (fall back to `geral` / invite) |
| `welcome_message_template` | string \| null | If set, MUST contain `{nome}`; null/empty → default `Usuário {nome} acabou de entrar no canal` |

## AuthZ

- **Owner only** (system Dono / server creator owner role as product defines today for image/delete).
- No disable flag.

## FE

- Settings nav item in owner `server` group; page with channel select + template field + placeholder hint.
