# Data Model: 033-voice-speaking-indicator

Sem alterações de schema. Estado só no cliente.

## Entities

### Roster row (existing + UI fields)

| Field | Source | Notes |
|-------|--------|--------|
| `account_id` | occupancy | |
| `handle` | occupancy | |
| `has_avatar` | occupancy (030) | |
| `mic_on` | occupancy | drives mic icon on/off |
| `cam_on` | occupancy | list membership only (028) |
| `speaking` | derived client | true se viewer in-call ∧ identity in ActiveSpeakers ∧ mic_on |

### Speaking set (VoiceSession)

| Field | Type | Notes |
|-------|------|--------|
| `speakingAccountIds` | `Set<string>` | LiveKit active speaker identities (= account ids) |
| Cleared on | hangup / disconnect / leave | |

### Icon presentation

| Icon | States this feature |
|------|---------------------|
| Microphone | on / off (`mic_on`); + speaking aura |
| Output (headphones) | always «listening» visual; + speaking aura; no deafened state |

## State transitions

```text
[not speaking] --audio activity + mic_on + viewer in call--> [speaking aura on]
[speaking] --silence / mute / leave call--> [not speaking]
```

## Validation

- `speaking` never true for viewers with `!live`.
- `speaking` never true when `!mic_on`.
- List membership unchanged (still `mic_on || cam_on`).
