# Data Model: 065-mention-autocomplete

Sem novas tabelas. Modelo de **UI / cliente** + DTO opcional.

## MentionableMember (client / API)

| Field | Type | Notes |
|-------|------|-------|
| `account_id` | id | Unique |
| `handle` | string | Canonical for `@handle` insert + parse |
| `has_avatar` | bool | Optional UI |

**Rules**: Exclude caller; only accounts with channel **view**; sorted stably (e.g. handle asc).

## ActiveMention (composer ephemeral)

| Field | Notes |
|-------|-------|
| `startIndex` | Index of `@` in draft |
| `query` | Text after `@` up to caret (no spaces) |
| `open` | Picker visible |

**Transitions**:

```text
idle -- type '@' (valid start) --> open(query="")
open -- type/delete in query --> open(filtered)
open -- select / Enter --> insert @handle, idle
open -- Escape / blur / leave context --> idle
idle -- caret not in mention --> idle (picker closed)
```

## Resolution (send)

| Input | Output |
|-------|--------|
| draft text + MentionableMember[] + selfId | `mentioned_account_ids[]` |

Same rules as 062 extract+resolve; candidates MUST be the mentionable set (not incomplete `handles` map).

## Relationships

- Message post (062) still persists mentions / notifications from `mentioned_account_ids`.
- Picker does not create entities until send.
