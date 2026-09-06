# Contract: Join / media e câmera → banco

**Feature**: [032-voice-join-camera-choice](../spec.md)  
**Extends**: [028 voice-occupancy](../../028-voice-call-roster/contracts/voice-occupancy.md)

Auth e formas de resposta de token LiveKit **inalteradas**.

## `POST /api/channels/{channel_id}/voice/join`

Corpo (opcional, defaults actuais se omitido):

```json
{ "mic_on": true, "cam_on": false }
```

| `cam_on` efectivo | Occupancy | Grade |
|-------------------|-----------|--------|
| `true` (default se omitido) | Occupante com `cam_on: true` | `auto_assign_first_empty` como hoje |
| `false` | Occupante com `cam_on: false` | **MUST NOT** auto-assign; utilizador fica no banco |

Move entre canais: leave do anterior (incl. unassign) inalterado; no destino aplica a tabela acima com o body do novo join.

## `PATCH /api/channels/{channel_id}/voice/media`

Quando o patch resulta em `cam_on: true` e o utilizador **não** tem slot na cena activa:

- MUST tentar `auto_assign_first_empty` (mesmas regras: owner-lock → não assign; sem slot livre → banco).
- MUST emitir `grid.updated` se a grade mudar.
- Occupancy `voice.occupancy` continua a reflectir `cam_on`.

Desligar câmera (`cam_on: false`) **não** exige unassign nesta feature (comportamento de slot ao mute fica como estiver).

## Contract tests (mínimo)

1. Join com `{ "cam_on": false }` → GET grid / layout: conta **não** está num slot; occupancy `cam_on: false`.
2. Join com `{ "cam_on": true }` (ou default) → auto-assign como hoje quando aplicável.
3. Join `cam_on: false`, depois PATCH `{ "cam_on": true }` com cena auto + slot livre → passa a ocupar um slot.
4. Join `cam_on: false`, PATCH `cam_on: true` com owner-lock ou sem slot livre → permanece sem slot (banco).

Não exigir bytes LiveKit nestes testes.
