# Quickstart: Voice Audio & Occupant Presence

**Feature**: 096-voice-audio-presence  
**Date**: 2026-09-11

Manual two-browser validation for [spec.md](./spec.md) SC-001–SC-005. See [contracts/](./contracts/).

## Prerequisites

- App running (FE + BE + LiveKit as usual).
- Two accounts / browsers (A and B), same voice channel.
- System volume unmuted; product deafen **off** unless testing FR-003.

## Build

```bash
cd frontend && npm run build
```

## US1 — Bidirectional audio

1. A and B join the voice channel with **mic on** (camera optional).
2. A speaks a short phrase → **B hears A** (not aura-only).
3. B speaks → **A hears B**.
4. B enables deafen → A’s speech silent for B; disable deafen → speech returns.
5. Optional: join with camera off; mic audio still works both ways.

**Pass**: ≥9/10 heard attempts each direction; aura with audible speech when not deafened.

## US2 — Cam-off presence

1. A already in **Composition**.
2. B joins with **camera off** (mic on or off).
3. Within ~3s, A sees B in Composition **bank** (primary seats may stay empty).
4. Switch to **Grade**: B’s tile/identity is present without camera.
5. Confirm voice roster lists B as in the call.
6. B enables camera with a free seat → B leaves bank and occupies a seat with video (no duplicate).
7. Repeat with full seats (if possible): B stays in bank with video.
8. B leaves → disappears from bank, Grade, roster.

**Pass**: Zero invisible cam-off joiners in the test set; promote rule matches clarify A.

## Regression

- [ ] Mute mic stops send
- [ ] Deafen stops receive
- [ ] Cam on→off→on no ghost duplicate
- [ ] Screen-share rules unchanged
- [ ] Leave clears presence

## Failure signals

| Symptom | Likely area |
|---------|-------------|
| Aura yes, silence | Attach/`safePlay`/deafen volume/audio host |
| Others never hear me | Publish / `mic_on` / `setMicrophoneEnabled` |
| Cam-off missing bank/Grade | `refreshInCall` / Grade refresh on connect/audio |
| Cam-off on primary seat | Violates OP-01 / server assign |
