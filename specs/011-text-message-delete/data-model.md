# Data Model: 011-text-message-delete

Sem migração. Entidades existentes; regras de delete e evento efémero.

## Message (existente)

| Field | Type | Notes |
|-------|------|--------|
| id | UUID | PK |
| channel_id | UUID | FK channel |
| sender_account_id | UUID | **Autor** — pode apagar sempre (enquanto existir) |
| content_ciphertext | BLOB | Removido no hard delete |
| created_at | datetime | |

### Delete transition

```
exists → (authorized DELETE) → gone
  - row removed
  - attachments rows CASCADE
  - attachment files removed from ATTACHMENTS_DIR
  - WS message.deleted to server members
```

Não há estado `deleted` persistido.

### Validation (delete)

- Channel `type` = `text` (voz → 404/400).
- Caller é membro do `server_id` do canal.
- ACL: autor **ou** `channel.created_by_account_id` **ou** `server.owner_account_id`.
- `message.channel_id` MUST match path `channel_id`.

## Channel / Server (existente — papéis)

| Role | Source field |
|------|----------------|
| Autor | `message.sender_account_id` |
| Criador do canal | `channel.created_by_account_id` |
| Dono do servidor | `server.owner_account_id` |

## MessageAttachment (existente)

| On message delete | Behaviour |
|-------------------|------------|
| DB row | CASCADE from `message(id)` |
| File `{ATTACHMENTS_DIR}/{id}` | **Explicit unlink** in delete handler |

## WsPayload: message.deleted (efémero)

| Field | Type | Notes |
|-------|------|--------|
| id | UUID | Message id |
| channel_id | UUID | Scope for clients |

Não persistido.
