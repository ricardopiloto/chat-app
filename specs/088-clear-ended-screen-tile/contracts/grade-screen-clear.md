# Contract: Grade screen-tile clear on share end

**Feature**: 088-clear-ended-screen-tile  
**Surfaces**: `liveClient.joinLiveRoom`, `VoiceChannel` Grade lists, `CameraGrid`

## Events

### Subscribe (existing)

- `RoomEvent.TrackSubscribed` with `track.source === ScreenShare` → add to `remotesScreen` → `refreshGradeLists()`.

### Unsubscribe (required)

- `RoomEvent.TrackUnsubscribed` (and equivalent detach) when source is `ScreenShare`:
  - Remove track from `remotesScreen.get(identity)`; if list empty, **delete** the map key.
  - Call `refreshGradeLists()` and `layoutMedia()` (or equivalent).
  - If spotlight/selection targets that screen identity, clear it (FR-006).

### Local end (publisher)

- In-app stop and `MediaStreamTrack` `ended` both call `stopScreenShare()`:
  - Disable LiveKit screen share, clear local screen element, `screenOn = false`, `patchVoiceMedia({ screen_on: false })`.
  - Local Grade list must drop `me.id` from screen ids on next refresh (effect on `voice.screenOn()`).

## Grade list invariant

`gradeScreenIds` (or equivalent) contains an account id **iff** that account currently has an active screen share publication for this client’s view.

After clear: **zero** screen tiles for that identity; no empty `<video>` with chip «Tela».

## Non-goals

- Changing tile visual style (085) or Grade vs filmstrip layout (086).
- Removing camera tiles when screen ends (FR-004).
