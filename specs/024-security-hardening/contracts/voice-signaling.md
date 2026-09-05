# Contract: Sinalização de voz

## `POST /api/channels/{channel_id}/voice/join`

**Auth**: membro do servidor do canal de voz.

**Resposta** (inalterada na forma):

```json
{ "token": "<jwt>", "url": "<livekit_ws_url>", "room": "<channel_id>" }
```

`url` MUST ser exactamente `LIVEKIT_WS_URL` (config). MUST NOT usar `Host` nem `X-Forwarded-Host`.

`token`: TTL ~600 s, sala = id do canal (comportamento actual).

## Teste de contrato

Pedido com `Host: evil.example` → `url` continua `ws://127.0.0.1:7880` (ou o valor de teste), nunca `ws://evil.example:7880`.
