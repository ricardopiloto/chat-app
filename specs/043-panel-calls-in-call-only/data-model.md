# Data Model: 043-panel-calls-in-call-only

**Feature**: Controlos de chamada no painel só em chamada  
**Persistence**: Nenhuma (estado de sessão de voz no cliente).

## Entities (UI / session)

### Chamada activa (ClientVoiceSession)

| Field (conceptual) | Meaning |
|--------------------|---------|
| `live` | Utilizador ligado a voz/vídeo |
| `channelId` | Canal de voz da sessão activa |

Derived: **em chamada** ⇔ `live === true`.

### Vista da mesa (Stage view)

| Field | Meaning |
|-------|---------|
| `routeChannelId` | Canal da rota actual |
| `onStage` | `live && routeChannelId === channelId` |

### Grupo de controlos de chamada (painel)

| Attribute | Rule |
|-----------|------|
| Visible / mounted | `live && !onStage` |
| Controls enabled | Always when mounted (no disabled placeholder) |
| Contents | Mic, deafen, camera (+ blur), leave |
| Identity row | Always independent of call group |

## State transitions

```text
!live                    → group UNMOUNTED
live + onStage           → group UNMOUNTED (stage owns controls)
live + !onStage          → group MOUNTED (enabled)
leave / disconnect       → UNMOUNTED (immediate)
```

## Validation (from FR)

- **FR-001**: `!live` ⇒ no group, no `is-disabled` chrome.
- **FR-002**: `live && !onStage` ⇒ group mounted and usable.
- **FR-003**: `live && onStage` ⇒ group unmounted.
- **FR-004**: Identity always mounted.
