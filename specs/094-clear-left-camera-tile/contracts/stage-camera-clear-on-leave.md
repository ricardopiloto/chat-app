# Contract: Stage camera clear on leave (Composição + Grade)

**Feature**: [094-clear-left-camera-tile](../spec.md)  
**Surfaces**: `VoiceChannel` media Maps, `layoutMedia` / slot + grade hosts, `CameraGrid` lists, `liveClient` disconnect/unsubscribe (088 wiring).

## Events

### Camera track unsubscribed

- `RoomEvent.TrackUnsubscribed` with camera (non-ScreenShare) video:
  - Remove track from `remotesCam`; delete identity key if empty.
  - Scrub `<video>` orphans from that identity’s grade/slot hosts.
  - `refreshGradeLists()` + layout.
  - Do **not** remove an in-call peer from Grade solely because cam muted/off if product still shows their seat via `remoteParticipants` (FR-005).

### Participant disconnected / left call

- `RoomEvent.ParticipantDisconnected` (and equivalent leave observable to viewer):
  - `remotesCam` + `remotesScreen` delete for identity (screen also 088).
  - Scrub all camera video for that identity from Composição slots and Grade cam hosts.
  - Ensure identity **absent** from `gradeCameraIds` after refresh.
  - Clear camera spotlight/selection if it pointed at that identity.
  - Complete within ~2s of observable leave (FR-009).

## Grade invariant

After leave: **zero** Grade camera tiles for the departed identity; no empty/frozen `<video>` cell; layout reflows (FR-002).

## Composição invariant

After leave: **no frozen last frame** for that identity; seat MAY be empty/free without video (FR-003). Spotlight/hero must not keep their frozen frame (FR-007).

## Non-goals

- Changing Composition scene editor UX.
- Removing in-call camera-off avatar seats (unless leave).
- Backend schema changes.
