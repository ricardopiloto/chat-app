# Contrato: API Mentionables (opcional mas recomendado)

`GET /api/channels/{channel_id}/mentionables`

## AuthZ

- Sessão autenticada.
- Caller MUST ter **view** no canal; senão 404/403 conforme padrão do projecto para canais.

## Response `200`

```json
[
  {
    "account_id": "<uuid>",
    "handle": "bob",
    "has_avatar": false
  }
]
```

- Ordenação estável por `handle` (case-insensitive).
- **Exclui** o caller.
- Inclui só contas com effective **view** no canal.
- Sem PII extra além do já exposto em members.

## Errors

| Caso | Status |
|------|--------|
| Não autenticado | 401 |
| Sem view / canal inexistente | 404 ou 403 (consistente com GET messages) |

## Client use

- Alimenta picker + `resolveMentionAccountIds` no send.
- Cache por `channel_id` enquanto o canal estiver montado; refrescar em focus/membership se já houver padrão.

## Fora deste contrato

- POST message body (inalterado: `mentioned_account_ids`).
