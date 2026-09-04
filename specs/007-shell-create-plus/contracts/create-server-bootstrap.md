# Contract: Create server with text + voice bootstrap

## POST `/api/servers`

**Auth**: session.

**Request**:

```json
{
  "name": "Minha mesa",
  "custody_ack": true,
  "channel_key_sealed": "<base64 sealed blob for voice channel key>"
}
```

| Field | Required | Notes |
|-------|----------|--------|
| `name` | yes | trimmed, non-empty |
| `custody_ack` | yes | MUST be `true` |
| `channel_key_sealed` | yes | base64; same semantics as voice `POST …/channels` |

**Behaviour (atomic in handler)**:

1. Create `Server` + owner `Membership`.
2. Create text channel (name default `geral`, type `text`).
3. Create voice channel (name default `mesa`, type `voice_video`, `grid_slot_count` 4) with channel key from sealed blob + default scene.
4. Return **201**.

**Response** (201) — preferred shape:

```json
{
  "server": { "id": "…", "name": "…", "owner_account_id": "…" },
  "channels": [
    { "id": "…", "type": "text", "name": "geral", "…" },
    { "id": "…", "type": "voice_video", "name": "mesa", "has_channel_key": true, "…" }
  ]
}
```

Clients MAY ignore `channels` and refetch `GET /api/servers/{id}/channels`. If response remains bare `Server` for compatibility, client MUST refetch channels; key remember uses the voice channel id from that list.

**Errors**:

| Status | When |
|--------|------|
| 400 | empty name; missing/false custody; missing/invalid sealed key |
| 401 | unauthenticated |

**Client (SPA)**:

1. Generate channel key; seal for self; require checkbox before submit.
2. On success: publish server key envelope (existing); `rememberChannelKey` for voice id; select server; no textual «Criar servidor» button.

**Out of scope**: changing invite / server delete contracts.
