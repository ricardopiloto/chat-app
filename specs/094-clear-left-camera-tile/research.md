# Research: 094 Clear Left Camera Tile

**Feature**: [spec.md](./spec.md)  
**Date**: 2026-09-11

## R1 — Why a frozen last frame survives leave

**Decision**: Treat the bug as incomplete **media + list cleanup** on leave/unsubscribe—not a missing backend field.

**Rationale** (code review of `VoiceChannel` / PIP / `liveClient`):
- 088 already wires `TrackUnsubscribed` + `ParticipantDisconnected` into `removeTrack` / `clearRemoteParticipantMedia`, which delete `remotesCam` keys and call `refreshGradeLists` + `scheduleLayout`.
- `refreshGradeLists` still seeds Grade camera ids from **every** `room.remoteParticipants` identity (not only `remotesCam`), and always adds local `me`. That is fine for in-call avatar seats, but any lag or missed disconnect refresh leaves a tile whose `<video>` can still show the **last decoded frame** after the track is gone.
- `layoutMedia` → `clearOrphanVideos` removes non-`keep` `<video>` children, but leave can race before layout runs, or Composition slots retain `account_id` from the server grid while a stale element remains until scrub.
- `FloatingVoicePip` refreshes on track subscribe/unsubscribe but **does not** listen to `ParticipantDisconnected`, and does not prune `tileEls` when the tile list shrinks—risk of stale PIP chrome.

**Alternatives considered**:
- New occupancy API field for “camera tile present” — unnecessary; LiveKit disconnect + existing occupancy/grid suffice.
- Full stage remount on every leave — heavy-handed.

## R2 — Leave vs camera-off

**Decision**:
- **Camera off, still in call**: keep existing in-call representation (tile/seat may remain; no live video). Do **not** treat as leave.
- **Leave**: remove Grade/PIP camera **tile** for that identity; Composição clears **video** (seat may become empty/free without implying they are still on camera).

**Rationale**: Spec US3 / FR-005. Implementation must key off participant gone / maps cleared, not merely “no video track” alone when deciding Grade membership for leave—but must still clear frozen video when tracks end.

**Alternatives considered**: Remove Grade tile whenever cam track unsubscribes even if still in call — would regress camera-off UX if product shows an avatar seat for in-call users without cam.

## R3 — Grade list membership after leave

**Decision**: After leave/disconnect, identity MUST disappear from `gradeCameraIds` within the clarify window (~2s). Prefer immediate removal in `clearRemoteParticipantMedia` / disconnect path; `refreshGradeLists` must not re-add identities no longer in `remoteParticipants` (and must not keep tiles solely because a detached video element still exists).

**Rationale**: FR-002 / SC-002. Today’s loop over `remoteParticipants` is OK **if** disconnect removes them and refresh runs; harden so cleanup does not depend on a later accidental refresh only.

**Alternatives considered**: Drive Grade cams only from `remotesCam.keys()` — would hide in-call peers with cam off; reject unless product changes (out of scope).

## R4 — Composition empty/free seat

**Decision**: On leave, scrub camera video from any slot that was showing that identity. If server grid still lists `account_id` briefly, show **no video** (empty/free visual); when grid/occupancy clears the seat, empty/free seat remains allowed (clarify B).

**Rationale**: FR-003. Do not require Composition to reflow like Grade.

## R5 — PIP

**Decision**: On `ParticipantDisconnected` (and track unsubscribed), refresh tile list; detach/remove media for dropped tile ids; prune `tileEls` for ids no longer in `tiles()`.

**Rationale**: Clarify surface B; FR-008.

## R6 — Detach / scrub helper

**Decision**: Centralize an identity- or host-scoped scrub: remove orphan `<video>` elements from grade/slot hosts for a departed identity (and ensure LiveKit `track.detach()` already run via `liveClient`). Call from `removeTrack` (camera) and `clearRemoteParticipantMedia`.

**Rationale**: Frozen frames are a DOM/MediaStream symptom; Map delete alone is not always enough if layout is deferred.

**Alternatives considered**: Only rely on `track.detach()` — insufficient if duplicate elements or layout kept a node.

## R7 — Backend

**Decision**: No migration/API change. Occupancy + LiveKit events already signal leave.

**Rationale**: Spec assumption; 087 unload leave already ends occupancy.

## R8 — Spotlight / hero

**Decision**: If spotlight/selection referenced the departed user’s camera, clear it when scrubbing (same spirit as 088 screen spotlight clear).

**Rationale**: FR-007 / SC-006.

## Open items for implement

- Confirm whether Grade should list cam-off remotes (current: yes via `remoteParticipants`)—preserve unless quickstart proves otherwise.
- Local leaver: ensure hangup clears local preview from stage/PIP for others via normal disconnect path; local self-view teardown already in hangup—verify no local frozen pip after leave.
