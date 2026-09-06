# Data Model: 035-voice-leave-release-media

Sem alterações de schema SQLite/API. Estado só no cliente (tracks + sessão).

## Entities

### Call session (cliente)

| Field | Source | Notes |
|-------|--------|--------|
| `live` | VoiceSession | true enquanto na chamada |
| `channelId` | VoiceSession | mesa actual |
| `session` | LiveKit wrapper | `disconnect()` liberta sala |
| `localCamTrack` | VoiceChannel / VoiceSession | `MediaStreamTrack` vídeo local (+ blur) |
| Local mic tracks | LiveKit / GUM | via `localParticipant` ou captura pré-join |

### Local capture bundle

Conjunto de recursos a libertar no fim de sessão / abort:

| Resource | Release action |
|----------|----------------|
| Blur / video processor | `stopBlurProcessor(track)` |
| Camera `MediaStreamTrack` | `track.stop()` |
| Microphone `MediaStreamTrack`(s) | `track.stop()` / `setMicrophoneEnabled(false)` |
| LiveKit room | `room.disconnect(true)` (stopTracks) |
| Refs UI | `localCamTrack = null`, el detach |

### Failed join with partial capture

| Field | Notes |
|-------|--------|
| `joined` | join API já sucedeu? → também `leaveVoice` (031) |
| `localTracks` | tracks GUM já obtidas antes do bindLive |
| Release | **mesmo** `releaseLocalCapture` que leave |

## State transitions

```text
[in call / capturing]
  --Sair | hangup | move disconnect | dropped | pagehide-->
    releaseLocalCapture → [no local capture]
    leaveVoice (best-effort) → [occupancy cleared]
    UI live=false

[joining with partial GUM]
  --join fail-->
    releaseLocalCapture → [no local capture]
    leaveVoice if joined → [not connected]
```

## Validation / invariants

- Após UI «fora da chamada», não deve restar captura activa desta sessão (FR-003).
- `releaseLocalCapture` idempotente (FR-005).
- Leave remoto falha ≠ manter captura (FR-007).
- Re-join após leave consegue novo GUM (FR-006).
