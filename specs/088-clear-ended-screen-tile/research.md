# Research: 088-clear-ended-screen-tile

## R1 — Why the Grade tile stays after stop

**Decision**: Root cause is asymmetric LiveKit handling: subscribe adds to `remotesScreen`, unsubscribe never removes.

**Rationale**:
- `VoiceChannel.placeTrack` pushes `Track.Source.ScreenShare` into `remotesScreen` and calls `refreshGradeLists()`.
- `joinLiveRoom` only registers `RoomEvent.TrackSubscribed`.
- After `setScreenShareEnabled(false)` or browser «Parar partilha», remote clients get unsubscribe but maps keep participant keys → empty `<video>` + chip «Tela».
- Local publisher already sets `screenOn(false)` in `stopScreenShare` and an effect re-runs `refreshGradeLists`; remote viewers are the primary ghost-tile victims. Local may also show a stale tile if `localScreenVideoEl` / list timing races.

**Alternatives considered**:
- Poll occupancy `screen_on` only — would clear indicators and could filter Grade, but would leave MediaStream attach state inconsistent; event-driven cleanup is correct.
- Full room reconnect on stop — overkill.

## R2 — End paths (in-app vs browser/OS)

**Decision**: Both paths must end in the same clear pipeline.

**Rationale** (clarifications + code):
- In-app: `toggleScreenShare` → `stopScreenShare` → LiveKit disable + `patchVoiceMedia({ screen_on: false })`.
- Browser/OS: `MediaStreamTrack` `ended` → `stopScreenShare` (already wired). Remotes still need `TrackUnsubscribed`.
- Viewers never call `stopScreenShare`; they only see LiveKit unsubscribe + occupancy WS.

**Alternatives considered**: Rely only on occupancy WS to drop tiles — slower and leaves track Maps dirty until next occupancy tick.

## R3 — Indicators (sidebar / channel)

**Decision**: Keep occupancy `screen_on` as source of truth for share indicators; ensure publisher always patches `false` on both end paths; consumers already update from `voice.occupancy`.

**Rationale**: `VoiceChannel` sets `screenShareActive` from occupants; Sidebar uses occupancy. If patch fails, indicator may lag — still attempt patch; Grade clear must not wait on WS.

**Alternatives considered**: Derive indicators solely from LiveKit publications — would desync multi-tab/occupancy list; stick with existing model.

## R4 — Spotlight / selected screen tile

**Decision**: When clearing a screen identity, also drop `selectedScreenAccountId` / stage selection if it pointed at that tile (FR-003).

**Rationale**: Spec requires no empty spotlight stage after end. Mirror cam-off / leave patterns already used for camera tiles.

## R5 — API surface change

**Decision**: Extend `joinLiveRoom` (or session wiring) with `onTrackUnsubscribed` (and optionally `onLocalTrackUnpublished` for ScreenShare) so VoiceChannel can remove Map entries symmetrically to `placeTrack`.

**Rationale**: Keeps LiveKit events in `liveClient.ts`; VoiceChannel owns Grade Maps. Minimal, library-first.

**Alternatives considered**: Poll `room.remoteParticipants` publications each frame — wasteful and race-prone.
