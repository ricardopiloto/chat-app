# Data Model: 038-floating-voice-pip

Sem alterações de schema backend. Estado só no cliente.

## Entities

### Floating call miniature (PiP)

| Field | Type | Notes |
|-------|------|--------|
| `visible` | derived | `live ∧ channelId ∧ routeChannelId ≠ channelId` (mesmo que barra) |
| `channelName` | string \| null | de `VoiceSession` |
| `channelId` / `serverId` | string \| null | navegação «Voltar à mesa» |
| `corner` | `Corner` | âncora actual |
| `dragging` | boolean | posição livre durante pointer drag |
| `dragOffset` | `{ x, y }` \| null | só enquanto dragging |
| `videoTiles` | list | até 4 identidades com track de vídeo attachável |
| `hasVideo` | boolean | `videoTiles.length > 0` |

### Corner anchor

```text
Corner = top-right | top-left | bottom-right | bottom-left
```

Default / pós-reload / pós-hangup: `top-right`.

### Active call session (existing)

Sem novos campos obrigatórios no servidor. Opcional no cliente: `pipCorner` no provider até `hangup` limpar `live`.

## Relationships

```text
VoiceSession (live) ──shows──► FloatingVoicePip  when route ≠ voice channel
VoiceSession.room   ──feeds──► videoTiles
voice-connected-bar ──coexists── FloatingVoicePip (same visibility)
```

## State transitions

```text
[hidden] --live ∧ navigate away from voice channel--> [visible @ corner]
[visible] --drag--> [dragging] --pointerup--> [visible @ nearest corner]
[visible] --navigate to active voice channel--> [hidden] (corner kept in memory)
[visible|hidden] --hangup / dropped / !live--> [hidden] + corner := top-right
[visible] --window resize--> [visible] re-clamp same corner
```

## Validation

- `visible` nunca true se `!live`.
- Após reload, primeiro show → `top-right` (sem storage).
- Snap sempre produz um dos quatro `Corner` (nunca posição livre estável).
- Attach de vídeo não chama `track.stop()` ao desmontar PiP.
