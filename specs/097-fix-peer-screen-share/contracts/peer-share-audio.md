# Contract: Peer share / system audio

**Feature**: 097-fix-peer-screen-share  
**Date**: 2026-09-11  
**Type**: FE media behavior

## Parties

- **Sharer**: publishes optional `Track.Source.ScreenShareAudio` via `setScreenShareEnabled(..., { audio: true })`
- **Peer listener**: any call participant (Grade or Composition)
- **Sink**: session `.voice-audio-host--session` via `attachSessionRemoteAudio` / `attachRemote`

## Guarantees

### PSA-01 — Hear share audio when included

When the browser successfully includes system/tab audio in the share, peers MUST hear that audio within ~5s of share start (deafened off). Silence for peers while the sharer’s share is producing audio is a failure.

### PSA-02 — Composition

Peers in Composition MUST still hear share audio (no screen tile required), per 082.

### PSA-03 — Stop

Ending share MUST stop peer share audio from that share.

### PSA-04 — Video without audio still OK

If the browser cannot capture system/tab audio, peer **video** MUST still satisfy [peer-screen-video.md](./peer-screen-video.md); PSA-01 applies only when share audio was included.

### PSA-05 — Mic regression

Fixing share audio MUST NOT break normal call mic audio between peers.

## Notes

- Mic and share audio share the same session host path after 096; do not introduce a separate sink unless diagnosis proves isolation is required.
- No `Track.Source` filter should drop ScreenShareAudio while accepting Microphone.

## Failure signals

| Symptom | Likely area |
|---------|-------------|
| Mic OK, share silent | ScreenShareAudio publish/subscribe / E2EE |
| Mic + share silent | session host / deafen / safePlay |
| Audio only after remount | missing re-attach on host mount |
