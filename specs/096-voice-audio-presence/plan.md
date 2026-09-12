# Implementation Plan: Voice Audio & Occupant Presence

**Branch**: `096-voice-audio-presence` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/096-voice-audio-presence/spec.md`

**Note**: Clarifications (2026-09-11): bidirectional audio (I↔others); Composition cam-off → **bank** even with free seats; Grade always shows all live occupants; cam on + free seat → promote bank→seat.

## Summary

Fix two live-call defects: (1) **mic audio audible both ways** in the browser (aura/activity must not replace playback/publish), and (2) **cam-off joiners visible** in Composition bank + Grade/roster. Likely FE root causes: remote audio attach/`safePlay`/session-vs-page host gaps; occupant list refresh skipped on audio-only / participant connect. Server already banks cam-off on join; FE must refresh `inCallIds` / Grade lists and promote on cam-on per clarify.

## Technical Context

**Language/Version**: TypeScript / SolidJS frontend; Rust backend only if occupancy/join signals prove insufficient (expected FE-first).

**Primary Dependencies**: `livekit-client` (TrackSubscribed/Unsubscribed, ParticipantConnected/Disconnected, ActiveSpeakers, setMicrophoneEnabled, setVolume); `VoiceSession`, `VoiceChannel`, `liveClient.attachRemote`, `safePlay`.

**Storage**: N/A for media; occupancy + grid already via HTTP/WS (`voice/join`, patch media, grid assign).

**Testing**: Manual two-browser call (bidirectional speech + cam-off join); `cd frontend && npm run build` (`tsc` + vite); [quickstart.md](./quickstart.md).

**Target Platform**: Modern browsers with WebRTC / LiveKit; desktop Chromium/Firefox primary.

**Project Type**: Web app — voice media + stage presence correctness.

**Performance Goals**: Audible path + bank/Grade presence within ~3s of join/speak (spec SC); no new polling loops.

**Constraints**: Preserve mute/deafen semantics; do not auto-seat cam-off into primary Composition slots; Grade presence camera-independent; no Mesa chrome redesign; FR-008 capability preservation.

**Scale/Scope**: Voice channel page + VoiceSession (+ optional PIP audio host if page unmounts); CallBank / Grade list refresh; Sidebar roster filter only if it hides live occupants.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Spec-driven / clarify before plan | Pass — 3 clarifications locked |
| Prefer FE fix; backend only if needed | Pass — bank-on-join already server-side |
| No unrelated redesign | Pass |
| Manual + tsc/build validation | Pass |

**Post-design**: Still pass — contracts are FE behavior contracts, not new public APIs.

## Project Structure

### Documentation (this feature)

```text
specs/096-voice-audio-presence/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── remote-audio-playback.md
│   ├── mic-publish.md
│   └── occupant-presence.md
└── tasks.md              # /speckit-tasks (not this command)
```

### Source Code (repository root)

```text
frontend/src/
├── pages/VoiceChannel.tsx          # audioHost, placeTrack, refreshInCall/Grade, bankIds
├── voice/VoiceSession.tsx          # deafen volumes, ActiveSpeakers, mic/cam toggles
├── video/liveClient.ts             # attachRemote, joinLiveRoom publish
├── lib/safeMedia.ts                # safePlay
├── components/CallBank.tsx         # deriveBank
├── components/CameraGrid.tsx       # Grade tiles
└── shell/Sidebar.tsx               # voice roster transmitting() filter

backend/src/api/voice.rs            # cam_off join → no auto seat (reference; change only if broken)
```

**Structure Decision**: Existing Mesa voice stack; primary edits in `VoiceChannel` + `VoiceSession` + `liveClient`/`safeMedia`; backend only if FE refresh cannot see cam-off occupants.

## Complexity Tracking

> No constitution violations requiring justification.
