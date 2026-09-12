# Research: Voice Audio & Occupant Presence

**Feature**: 096-voice-audio-presence  
**Date**: 2026-09-11

## R1 — Why aura can work with no sound

**Decision**: Treat speaking detection (`ActiveSpeakersChanged` → aura) as **orthogonal** to HTML `<audio>` playback volume/`play()`. Fix playback/publish independently; do not use aura as success signal.

**Rationale**: `VoiceSession.attachActiveSpeakers` drives UI; remote mic attaches via `attachRemote` → `safePlay` into `.voice-audio-host`. Deafen sets LiveKit remote volume to 0 without clearing speakers. `safePlay` swallows autoplay errors. Session can outlive `VoiceChannel` (PIP has no remote-audio host).

**Alternatives considered**: Rely on speaker events only (rejected — FR-002). New audio UI control (deferred — out of scope).

## R2 — Bidirectional acceptance (clarify C)

**Decision**: Validate **send and receive** in quickstart (A→B and B→A). Investigate both `setMicrophoneEnabled` / publish path and remote attach/play path.

**Rationale**: Spec FR-001 + FR-001a / SC-001.

**Alternatives considered**: Fix playback only (rejected by clarify).

## R3 — Hardening remote playback

**Decision**: Prefer (in order): (1) ensure `audioHost` is always available while live on channel page and re-`layoutMedia` / re-attach after subscribe; (2) on undeafen / user gesture, retry `play()` and restore volume 1; (3) if page can unmount while live, move remote audio host to session-level or PIP so tracks keep a sink.

**Rationale**: Highest-probability silent-call causes from code map.

**Alternatives considered**: `setSinkId` device picker (out of scope). Always force user gesture modal (heavier UX — only if autoplay proves dominant).

## R4 — Composition cam-off → bank (clarify B)

**Decision**: Keep **server** behavior: join with `cam_on: false` does not auto-assign a primary seat. FE must list cam-off in **bank** via `inCallIds` − slotted IDs (`deriveBank`).

**Rationale**: Matches clarify and existing `voice.rs` / tests (`join_cam_off_stays_off_grid_bank`).

**Alternatives considered**: Auto-seat cam-off (rejected — clarify B).

## R5 — Invisible cam-off joiner (FE refresh gap)

**Decision**: Refresh occupant presence (`refreshInCall` / `refreshGradeLists`) on remote **participant connect** and on **audio** (and video) subscribe/unsubscribe/disconnect — not only video `placeTrack` paths that currently refresh lists.

**Rationale**: Audio early-return in `placeTrack` skips list refresh; no `ParticipantConnected` handler → bank/Grade empty for audio-only joiners even though `remoteParticipants` would include them if refreshed.

**Alternatives considered**: Drive bank solely from occupancy WS (possible supplement; still need LiveKit identities for media). Rejected as sole fix if WS lags or omits identities already in room.

## R6 — Grade always shows (clarify B)

**Decision**: Keep Grade list built from live participants (including cam-off), not only `remotesCam` keys. Ensure refresh runs so cam-off tiles appear (empty/avatar chrome OK).

**Rationale**: Spec FR-005; 094 already intended cam-off Grade seats.

## R7 — Cam on → promote bank→seat (clarify A)

**Decision**: Rely on existing media-patch / grid auto-assign when `cam_on` becomes true (server); FE must refresh grid + bank after patch/WS so seat and bank update without leave/rejoin. If FE already seats locally, keep single identity (no duplicate chip + seat).

**Rationale**: Spec FR-007; backend already has `patch_cam_on_*` style auto-assign when scene unlocked.

**Alternatives considered**: Purely client-side seat steal without server grid (rejected — grid is source of truth for Composition seats).

## R8 — Roster filter

**Decision**: If Sidebar nested voice roster uses `mic_on || cam_on` only, extend to **all live occupants** (or occupancy-present) so cam-off + mic-off still appear when they are in the call (FR-005). Confirm against product “listen-only” occupancy flags during implement.

**Rationale**: Spec says roster agrees with who is in the call.

**Alternatives considered**: Leave roster as transmitting-only (may fail FR-005).

## R9 — Backend scope

**Decision**: **FE-first**. Touch `backend/src/api/voice.rs` only if join/patch/occupancy broadcast fails to mark cam-off as present or cam-on fails to assign seat when free.

**Rationale**: Research shows bank-on-join already intentional server-side; primary bug is FE list refresh + audio sink.
