# Implementation Plan: Fix Peer Screen Share Visibility

**Branch**: `097-fix-peer-screen-share` | **Date**: 2026-09-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/097-fix-peer-screen-share/spec.md`

**Note**: Clarifications (2026-09-11): peer failure = **present** Grade screen tile that stays **blank/black** + **missing share/system audio**; no reliable leave/rejoin workaround; MVP = peer **live video + share audio**; indicators smoke only.

## Summary

Restore **peer** reception of screen share: when a participant publishes screen (self-preview OK), every other participant must see **live** Grade screen-tile video and hear **ScreenShareAudio** when included—both directions, without leave/rejoin. Architecture is dual-path: local preview attaches from the LiveKit **local publication** in `VoiceSession.toggleScreenShare`; peers depend on `TrackSubscribed` → `placeTrack` → `remotesScreen` → `layoutMedia` → `attachRemote` into Grade hosts, with share audio on the **096 session audio host**. Plan is FE-first diagnosis against attach/rebind (091-class for *remote* screens), E2EE on screen sources, and publish/subscribe of `ScreenShare` / `ScreenShareAudio`; then minimal fix so first successful share delivers peer media within ~5s.

## Technical Context

**Language/Version**: TypeScript / SolidJS frontend; Rust backend only if LiveKit token/publish grants or occupancy `screen_on` prove insufficient (expected FE-first).

**Primary Dependencies**: `livekit-client` (`setScreenShareEnabled`, `Track.Source.ScreenShare` / `ScreenShareAudio`, `TrackSubscribed`); `VoiceSession`, `VoiceChannel`, `liveClient.attachRemote`, `CameraGrid`, `safePlay`; E2EE `ExternalE2EEKeyProvider` as currently configured.

**Storage**: N/A for media; occupancy `screen_on` via existing `patchVoiceMedia` (indicators only).

**Testing**: Manual two-browser Grade share (video + share audio both directions, mid-join, Composition hears share audio, cam/mic regression); `cd frontend && npm run build`; [quickstart.md](./quickstart.md).

**Target Platform**: Modern browsers with `getDisplayMedia` (via LiveKit SDK) + WebRTC; desktop Chromium/Firefox primary.

**Project Type**: Web app — voice media attach / subscribe correctness.

**Performance Goals**: Peer live video + share audio within ~5s of share start (SC-001/SC-006); no polling loops.

**Constraints**: Grade-only screen **video** tiles (FR-006); Composition still hears share audio (FR-010 / 082); camera independent of share; no indicator redesign (FR-009); do not regress peer cam/mic (FR-007); E2EE posture unchanged.

**Scale/Scope**: `VoiceChannel` remote screen maps + layout rebind; `VoiceSession` publish/local preview + session audio host; `liveClient` subscribe/attach; optional E2EE/LiveKit config check; backend only if publish permissions broken.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Spec-driven / clarify before plan | Pass — clarify session locked |
| Prefer FE fix; backend only if needed | Pass |
| No unrelated redesign / indicator MVP creep | Pass |
| Manual + build validation | Pass |

**Post-design**: Still pass — behavior contracts for peer media, not new public APIs.

## Project Structure

### Documentation (this feature)

```text
specs/097-fix-peer-screen-share/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── peer-screen-video.md
│   └── peer-share-audio.md
└── tasks.md              # /speckit-tasks (not this command)
```

### Source Code (repository root)

```text
frontend/src/
├── voice/VoiceSession.tsx       # toggleScreenShare, local preview, dispatchTrack, session audio host
├── pages/VoiceChannel.tsx       # placeTrack, remotesScreen, layoutMedia, refreshGradeLists, grade hosts
├── video/liveClient.ts          # joinLiveRoom TrackSubscribed, attachRemote, E2EE room setup
├── components/CameraGrid.tsx    # Grade screen tiles, spotlight split
├── lib/safeMedia.ts             # safePlay / resumeMediaUnder
└── shell/UserPanel.tsx          # Grade-only share control

backend/src/                     # reference only unless publish grants broken
├── api/voice.rs                 # screen_on patch / occupancy
└── token/mod.rs                 # LiveKit can_publish / can_subscribe
```

**Structure Decision**: Existing Mesa voice stack; primary edits in remote screen attach/rebind and share-audio sink alignment with 096 session host; backend only if FE cannot receive subscribed screen tracks.

## Complexity Tracking

> No constitution violations requiring justification.
