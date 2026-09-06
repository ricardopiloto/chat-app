# Data Model: 031-voice-join-errors

Sem alterações de schema SQLite. Modelo conceptual do fluxo de join.

## Entities (runtime)

### Voice join attempt

| Field | Notes |
|-------|--------|
| `channel_id` | Canal de voz alvo |
| `phase` | `media` → `occupancy_join` → `livekit` → `bound` |
| `joined_api` | `true` se `POST .../voice/join` já sucedeu |
| `audio_ok` | Áudio local utilizável obtido |
| `camera_ok` | Vídeo local obtido (opcional) |
| `outcome` | `success` \| `failed_join` \| `success_cam_off` |

### Join failure category

| Value | Meaning |
|-------|---------|
| `permission` | Permissão de média (áudio ou, no aviso, câmera) |
| `device` | Dispositivo em falta / ocupado / ilegível |
| `connection` | API join / LiveKit / rede |
| `generic` | Outros |

### Occupancy (existing)

- Linha de ocupante só é **válida** após outcome `success` ou `success_cam_off`.
- Em `failed_join` após `joined_api`: MUST `leave` → sem linha (flash ≤5 s aceite).

## State transitions

```text
[idle]
  → capture audio (+ optional video)
      → audio fail → [failed_join] + error(category) + release tracks
      → audio ok, video fail → continue with cam_off + warn(camera)
  → POST voice/join
      → fail → [failed_join] + release tracks
  → LiveKit connect/publish
      → fail → leaveVoice + release → [failed_join]
  → bindLive → [connected]
```

## Validation rules

- `failed_join` ⇒ UI not `live`; no persistent «Sair» de sessão; occupancy cleared if join ran.
- `success_cam_off` ⇒ `live` true; `cam_on` false; camera warning visible.
- Retry from `idle` without full app reload.
