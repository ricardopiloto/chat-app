# Contract: Envelopes de chave do servidor

## `POST /api/servers/{server_id}/key-envelopes`

**Auth**: membro.

Body: `{ "account_id", "sealed_key" }` (base64).

| Condição | Resultado |
|----------|-----------|
| `account_id` = caller | **201** upsert |
| Alvo membro `pending` e caller é dono **ou** `synced` | **201** |
| Alvo `synced` e `account_id` ≠ caller | **403** |
| Alvo não membro | **400** (já) |

## `GET .../key-envelopes/me`

Inalterado: só o próprio envelope.
