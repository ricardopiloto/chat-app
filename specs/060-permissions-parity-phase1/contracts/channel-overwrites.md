# Contract: Channel overwrites (Allow/Deny)

**Feature**: 060-permissions-parity-phase1  
**Surfaces**: `GET/PUT /api/channels/{id}/acl` (extended), channel list / message / voice gates

## ACL entry JSON

```json
{
  "id": "…",
  "channel_id": "…",
  "subject_type": "everyone",
  "subject_id": "00000000-0000-0000-0000-000000000000",
  "level": "write",
  "effect": "deny"
}
```

| Field | Values |
|-------|--------|
| `subject_type` | `everyone` \| `role` \| `account` |
| `subject_id` | nil UUID when `everyone`; else role/account id |
| `level` | text: `read`\|`write`; voice: `listen`\|`speak` |
| `effect` | `allow` \| `deny` |

## GET / PUT ACL

- Auth: unchanged manage ACL (owner ∪ creator ∪ manage_channels as today)
- PUT body: array of entries (full replace or documented upsert — keep current replace semantics if already replace)
- Validation:
  - Public channel: reject `effect=deny` + `level` in (`read`,`listen`) with `400` + clear message
  - Private: deny view via `deny`+`read`/`listen` hides channel from that subject after resolve

## Resolution (normative)

See [research.md](../research.md) R3–R4. Summary for clients:

1. Base (caps + visibility)
2. `everyone` overwrites
3. Member’s role overwrites
4. Member account overwrites
5. Owner full access

## Runtime errors (known channel)

```json
{
  "error": "Não podes enviar mensagens neste canal (restrição do canal).",
  "code": "channel_overwrite_deny"
}
```

Hidden private channel → `404` channel not found (no code leak required).

## UI

- `ChannelAclPanel`: subject type includes **Todos os membros**; effect Allow/Deny; hide Deny-view controls when channel is public
- Sidebar list continues to omit non-viewable private channels
