# Contract: `has_avatar` na ocupação de voz

**Feature**: [030-voice-roster-avatars](../spec.md)  
**Extends**: [028 voice-occupancy](../../028-voice-call-roster/contracts/voice-occupancy.md)

Auth, rotas e filtragem da lista aninhada **inalterados**. Cada objecto em `occupants` passa a incluir `has_avatar`.

## Occupant object

```json
{
  "account_id": "<uuid>",
  "handle": "alice",
  "mic_on": true,
  "cam_on": false,
  "has_avatar": true
}
```

| Campo | Tipo | Notas |
|-------|------|--------|
| `has_avatar` | boolean | `true` se a conta tem foto de perfil neste instante |

Aplica-se a:

- `GET /api/servers/{server_id}/voice-occupancy` → `channels[].occupants[]`
- WS `voice.occupancy` → `payload.occupants[]`

O cliente **não** usa `has_avatar` para decidir se a linha aparece (continua `mic_on \|\| cam_on`).

## Contract tests (mínimo)

1. Conta **com** avatar, join com mic ou câmera on → no snapshot (e/ou WS) o ocupante tem `has_avatar: true`.
2. Conta **sem** avatar, mesmo join → `has_avatar: false`.
3. Occupante com mic e câmera off: continua a **não** ser mostrado na lista aninhada (teste 028); `has_avatar` irrelevante para visibilidade.
4. GET occupancy exige membro (028); este campo não relaxa authz.

Não exigir neste contrato: bytes da imagem, `Content-Type`, nem evento após PUT avatar.
