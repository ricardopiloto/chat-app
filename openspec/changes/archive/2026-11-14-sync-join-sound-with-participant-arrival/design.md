# Design

## Context

`backend/src/api/voice.rs:266-275` upserts occupancy during HTTP join. That event can be broadcast before the joiner's `next.connect()` begins (`frontend/src/voice/callSession.tsx:559-573`). `triggers.ts:25-33` sounds on occupancy, but `people.ts:17-32` builds tiles from `call.participants()`, refreshed by LiveKit `ParticipantConnected` (`callSession.tsx:609-625`). `snapshot()` includes remote participants even without microphone or camera publications (`:106-127`), so listen-only and camera-off users do produce avatar tiles when their LiveKit participant connects. A reservation that never connects has no tile and should have no arrival sound.

## Goals / Non-Goals

**Goals:** play one remote arrival sound when a participant first appears; keep silent reconnects and deafen behavior; preserve occupancy roster updates.

**Non-Goals:** wait for a media track, change server occupancy timing, or change self-join sound.

## Decisions

### D1. Emit arrival from the owning room's participant transition

In `wire()`, handle `ParticipantConnected` distinctly: refresh the participant snapshot, then notify once for a new remote identity in the current epoch, only when the owner call is live and not deafened. Baseline existing remote identities when the room first connects so initial roster replay does not sound. Listener and camera-off participants still qualify because `snapshot()` yields an avatar tile without a track.

*Alternative rejected:* debounce the occupancy event until a LiveKit match. It requires identity reconciliation across independent protocols and timeout cleanup; the LiveKit event already matches tile creation.

### D2. Keep occupancy for roster, not sound

Remove only the arrival-sound occupancy subscription. The sidebar's early roster remains useful and independent of the call grid. Keep the existing `notify("callJoin")` self-join call at `callSession.tsx:590` and the sound effect's frequency limiter.

*Alternative rejected:* wait for `TrackPublished` or `TrackSubscribed`; listen-only and media-disabled participants may never publish tracks.

## Risks / Trade-offs

- [LiveKit can emit a participant before Solid paints the tile] → refresh first and schedule notification after the reactive render turn; validate with an avatar-only participant.
- [Room reconnect may replay identities] → baseline/deduplicate by identity and reset only on a true new call epoch.
