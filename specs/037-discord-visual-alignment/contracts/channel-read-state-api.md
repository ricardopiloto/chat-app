# Contract: Channel read-state API

## Persistence

Tabela `channel_read_state` — ver [data-model.md](../data-model.md).

## Endpoints (proposto)

### Mark read

`PUT /api/channels/{channel_id}/read`

Auth: session. Body opcional: `{ "last_read_at": "<iso>" }` — default = agora / última mensagem do canal.

Responses:
- `204` sucesso
- `403` sem membership
- `404` canal inexistente

### Server list with activity

Estender `GET /api/servers` **ou** `GET /api/me/server-activity`:

```json
[
  {
    "id": "<server uuid>",
    "has_unread": true,
    "has_voice": false
  }
]
```

(Se estender `GET /api/servers`, campos booleanos adicionais no objecto `Server` existente.)

### Voice aggregate

`has_voice` = existência de linhas em `voice_occupant` para canais de voz do servidor (mesmo critério de heartbeat/TTL já usado na occupancy).

## Realtime

- `message.new` → clientes membros actualizam `has_unread` do `server_id` se o canal não for o activo / se `created_at > last_read`.
- `voice.occupancy` → actualizar `has_voice` do servidor emitido.
- Abrir canal de texto → mark-read → limpar unread desse canal e reavaliar servidor.

## Tests (contract)

- Duas contas; A posta; B vê `has_unread` true; B mark-read; `has_unread` false.
- Occupant em voz → `has_voice` true; leave → false.
- Unread + voice simultâneos no mesmo server (ambos true).
