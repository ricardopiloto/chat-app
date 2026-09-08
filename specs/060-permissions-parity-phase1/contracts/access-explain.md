# Contract: Access explain & inspect

**Feature**: 060-permissions-parity-phase1  
**Surfaces**: denial error bodies; inspect API; admin UI

## Error body (extended)

Existing `{ "error": "…" }` gains optional:

```json
{
  "error": "…mensagem em português…",
  "code": "hierarchy_denied"
}
```

| `code` | When |
|--------|------|
| `hierarchy_denied` | Kick/mute/assign/role edit blocked by position |
| `channel_overwrite_deny` | Send/speak/view denied by overwrite (when not hiding) |
| `missing_capability` | Role lacks required capability |
| `forbidden` | Generic fallback |

FE: show `error` string; `code` for analytics/tests.

## Inspect API

`GET /api/channels/{channel_id}/access/{account_id}`

**Auth**: caller is server owner **or** has `can_manage_channels` **or** `can_manage_roles`; target must be member (or `404`).

**200**:

```json
{
  "account_id": "…",
  "channel_id": "…",
  "view": true,
  "level": "write",
  "factors": [
    { "layer": "base", "detail": "Canal público — visível a membros" },
    { "layer": "everyone", "detail": "Deny escrever" },
    { "layer": "role", "detail": "Allow escrever (Mestre)" },
    { "layer": "member", "detail": "Sem overwrite" },
    { "layer": "caps", "detail": "Perfil pode enviar mensagens" }
  ]
}
```

- `factors` MUST be produced by the same resolver as authz (FR-008)
- Owner target: `view=true`, max level, factor `owner`

## UI (required Phase 1)

- Entry point: channel ACL panel and/or server settings (Members / channel context)
- Controls: select member → show view/level + factor list (read-only)
- Copy in PT; no raw enum dumps without labels

## Out of scope

- What-if editor (change role temporarily without saving)
- Bulk export of all members’ access
