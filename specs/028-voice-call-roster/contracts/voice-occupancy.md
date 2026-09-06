# Contract: Ocupação de voz (REST + WS)

Auth: cookie de sessão. Sem BFF. Só **membros** do servidor.

## `GET /api/servers/{server_id}/voice-occupancy`

Snapshot de todos os canais `voice_video` do servidor.

```json
{
  "channels": [
    {
      "channel_id": "<uuid>",
      "call_started_at": "2026-09-05T22:00:00Z",
      "occupants": [
        {
          "account_id": "<uuid>",
          "handle": "alice",
          "mic_on": true,
          "cam_on": false
        }
      ]
    }
  ]
}
```

- Canal vazio: omitir da lista **ou** `call_started_at: null` e `occupants: []` (implementação: omitir ou vazio — o cliente trata ambos).
- `call_started_at` ausente/null ⇔ ninguém na chamada.
- 403 se não membro; 404 se servidor inexistente.

## `POST /api/channels/{channel_id}/voice/join`

Comportamento actual (token LiveKit + auto-assign grade) **mais**:

- Upsert ocupante neste canal.
- Se a conta já estava noutro canal de voz: **move** (leave lógico do anterior: apagar ocupante, libertar slot, possível `voice_session_started_at` NULL no A, snapshot WS do A e do B).
- Se era o primeiro neste canal: definir `voice_session_started_at`.
- Corpo de mídia inicial: opcional `{ "mic_on": true, "cam_on": true }`; default ambos true se omitido (alinhado ao captura actual).

Resposta de join **inalterada na forma** (`token`, `url`, `room`). Occupancy vai pelo WS.

## `POST /api/channels/{channel_id}/voice/leave`

- 204 se o caller era ocupante (ou idempotente 204 se já não estava).
- Remove ocupante; liberta slot da grade; `grid.updated`; se último, `voice_session_started_at = null`.
- 400 se o canal não é voz.

## `PATCH /api/channels/{channel_id}/voice/media`

```json
{ "mic_on": false, "cam_on": true }
```

Campos opcionais; só actualiza os enviados. 403 se não for ocupante deste canal. Actualiza `last_seen_at`. Emite `voice.occupancy`.

## Heartbeat

`PATCH .../media` vazio ou `POST .../voice/heartbeat` (escolher um na implementação) actualiza `last_seen_at`. Occupante com `last_seen_at` &gt; 45 s → tratado como leave.

## WS `voice.occupancy`

Envelope habitual `{ event, server_id, payload }`.

```json
{
  "event": "voice.occupancy",
  "server_id": "<uuid>",
  "payload": {
    "channel_id": "<uuid>",
    "call_started_at": "2026-09-05T22:00:00Z",
    "occupants": [
      { "account_id": "<uuid>", "handle": "alice", "mic_on": true, "cam_on": true }
    ]
  }
}
```

`call_started_at: null` e `occupants: []` quando a mesa esvazia. Fan-out: membros do servidor.

## Erros

| Status | Quando |
|--------|--------|
| 401 | Sem sessão |
| 403 | Não membro / não ocupante no PATCH |
| 400 | Canal não é voz |
| 404 | Canal/servidor inexistente |
