# Contract: Release local capture (mic / camera)

**Feature**: [035-voice-leave-release-media](../spec.md)  
**Related**: [data-model.md](../data-model.md), [031 abort](../../031-voice-join-errors/contracts/voice-join-errors.md)

## Scope

No new HTTP endpoints. Contract is **frontend lifecycle**: when call session ends or join aborts with partial GUM, local hardware capture MUST stop.

## Existing APIs (unchanged)

| Call | Role |
|------|------|
| `POST /api/channels/{id}/voice/leave` | Occupancy cleanup (best-effort; after or alongside local release) |
| LiveKit `room.disconnect(true)` | Stops published local tracks when session exists |

## `releaseLocalCapture` (normative)

**Inputs** (optional / partial): `{ localCamTrack?, audioTracks?, session? }`

**Effects** (idempotent):

1. Stop video processor / blur on camera track if present.
2. `stop()` every provided local `MediaStreamTrack` (audio + video) still `live`.
3. If LiveKit session still connected: disable camera + microphone and/or `disconnect(true)`.
4. Must not throw uncaught errors that block subsequent leave API / UI reset (swallow per-step failures).

**Ordering with hangup**:

1. `releaseLocalCapture`
2. `leaveVoice` (catch)
3. Clear VoiceSession UI state (`live=false`, channel null, …)

## Entry points (MUST call release)

| Entry | Trigger |
|-------|---------|
| Stage «Sair» | `VoiceChannel.leave` |
| Persistent bar «Sair» | `VoiceSession.hangup` |
| Channel move | `disconnectLivekitOnly` / leave previous capture |
| Unexpected disconnect | `dropped` / LiveKit `onDisconnected` |
| Tab unload | `pagehide` → hangup (best-effort) |
| Failed join + partial GUM | `abortFailedJoin` (031 / FR-008) |

## Observable success

| Check | Pass |
|-------|------|
| Browser site capture indicator | Off for mic/cam of this origin after leave (≤2 s happy path) |
| UI | Not in-call |
| Re-join | Can obtain mic/cam again without browser restart |

## Out of scope

- Changing Sair button chrome
- Occupancy roster rules (except side effect of leave on abort)
- Vite proxy log silence (025)
