# Contrato: Hub WebSocket (Fase 1 MVP)

Conexão: `wss://<instância>/ws`, autenticada pelo mesmo cookie de sessão httpOnly do REST ([D3](../research.md#d3--sessão-token-opaco-server-side-em-cookie-httponly)). Uma conexão por sessão de navegador ativa; o hub assina automaticamente o cliente em todos os Servidores dos quais é membro. O hub **nunca** decifra payload — roteia ciphertext e metadados em claro apenas (nomes, ids, timestamps).

Envelope comum:

```json
{ "event": "<nome>", "server_id": "uuid", "payload": { "...": "..." } }
```

## Eventos servidor → cliente

### `message.new`

Emitido a todo membro **atual** do Servidor com Membership sincronizada quando `POST /channels/{id}/messages` é aceito.

```json
{
  "event": "message.new",
  "server_id": "uuid",
  "payload": {
    "id": "uuid",
    "channel_id": "uuid",
    "sender_account_id": "uuid",
    "content_ciphertext": "base64",
    "created_at": "2026-09-04T13:00:00Z"
  }
}
```

### `presence.update`

Quem está online e em qual canal de voz/vídeo (para refletir ocupação da grade em tempo real).

```json
{
  "event": "presence.update",
  "server_id": "uuid",
  "payload": {
    "account_id": "uuid",
    "status": "online" | "offline",
    "voice_channel_id": "uuid | null"
  }
}
```

### `invite.consumed`

Emitido a dono/admins do Servidor quando um convite vira Membership (US2 — visibilidade de quem entrou).

```json
{
  "event": "invite.consumed",
  "server_id": "uuid",
  "payload": { "invite_code": "string", "new_member_account_id": "uuid" }
}
```

### `grid.updated`

Emitido a todo membro do Servidor quando o mapa de um canal `voice_video` muda (auto ou dono) — mantém a grade sincronizada sem poll.

```json
{
  "event": "grid.updated",
  "server_id": "uuid",
  "payload": { "channel_id": "uuid", "grid": { "$ref": "./grid-layout.json" } }
}
```

### `key_handoff.requested`

Ver [key-handoff.md](./key-handoff.md). Emitido a clientes já sincronizados (`Membership.key_handoff_status = synced`) do Servidor quando alguém novo aceita um convite e precisa da `server_key`.

```json
{
  "event": "key_handoff.requested",
  "server_id": "uuid",
  "payload": { "account_id": "uuid", "identity_pubkey": "base64" }
}
```

### `key_handoff.completed`

Emitido ao **novo membro** quando um envelope chega para ele (`POST /servers/{id}/key-envelopes`), para o cliente buscar e desenvelopar a chave e sair do estado "sincronizando".

```json
{
  "event": "key_handoff.completed",
  "server_id": "uuid",
  "payload": { "account_id": "uuid" }
}
```

## Eventos cliente → servidor

Nesta fase o cliente **não publica** eventos livres no hub — toda escrita passa pela API REST (que dispara os eventos acima como efeito colateral). A única exceção é um `ping`/`pong` de keep-alive de conexão, sem payload de domínio.
