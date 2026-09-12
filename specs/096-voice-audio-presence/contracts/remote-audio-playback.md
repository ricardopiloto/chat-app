# Contract: Remote audio playback

**Feature**: 096-voice-audio-presence  
**Phase**: US1 (receive path)  
**Surfaces**: `liveClient.attachRemote`, `VoiceChannel` audio host, `VoiceSession` deafen volumes, `safePlay`

## RA-01 — Attach while live

- Every subscribed remote **microphone** track MUST be attached to a live audio sink while the member is in the call UI (channel page and/or session-level host if page unmounts).
- Detach on unsubscribe/disconnect.

## RA-02 — Audible when not deafened

- If local product deafen is **off**, attached remote mic elements MUST be allowed to play at audible volume (LiveKit remote volume ≠ 0).
- If deafen is **on**, remote call audio MUST be silent; ActiveSpeakers MAY still update aura.

## RA-03 — Aura ≠ success

- Visible speaking aura MUST NOT be accepted as proof of playback (FR-002).
- Quickstart requires human-heard speech A→B and B→A.

## RA-04 — Recovery

- After undeafen or a normal in-call control gesture, the client MUST retry play on attached remote audio if the browser previously blocked autoplay.
