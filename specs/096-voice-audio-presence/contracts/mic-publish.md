# Contract: Mic publish (send path)

**Feature**: 096-voice-audio-presence  
**Phase**: US1 (send path)  
**Surfaces**: `joinLiveRoom` / `publishTrack` / `setMicrophoneEnabled`, `VoiceSession.toggleMic`, join body `mic_on`

## MP-01 — Publish when mic on

- While live with product mic **on**, local microphone audio MUST be published to the room so remote non-deafened peers can hear it (FR-001a).

## MP-02 — Mute / deafen

- Product mic **off** MUST stop sending mic audio.
- Product deafen MAY force mic off (existing behavior); MUST NOT break MP-01 after undeafen + mic on.

## MP-03 — Independent of camera

- Mic publish MUST work with camera off (audio-only join / cam-off occupant).
