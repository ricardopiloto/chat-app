# Data Model: 088-clear-ended-screen-tile

No new persisted tables. This feature tightens **client lifecycle** of screen-share presence already modeled in 082/083.

## Entities (runtime)

### ScreenSharePublication (client)

| Field | Source | Notes |
|-------|--------|-------|
| `participantIdentity` | LiveKit `participant.identity` (= account id) | Key in `remotesScreen` |
| `tracks` | `RemoteTrack[]` with `Source.ScreenShare` | Must be empty / key deleted when unsubscribed |
| `localActive` | `VoiceSession.screenOn()` | Local publisher flag |
| `occupancyScreenOn` | `voice_occupants.screen_on` via REST/WS | Indicators + secondary Grade filter if used |

### GradeScreenTile (view)

Derived only when share is **active**:

- Local: `voice.screenOn() === true` → include `me.id` in `gradeScreenIds`
- Remote: `remotesScreen` has a non-empty track list for that identity **and** (optionally) occupancy still `screen_on`

**Invariant (FR-001/002)**: If publication ended, identity MUST NOT appear in `gradeScreenIds`.

### ShareIndicator (UI)

| Surface | Binding |
|---------|---------|
| Sidebar / channel | Occupancy list `screen_on` |
| Channel header cue | `screenShareActive` from any occupant `screen_on` |

**Invariant (FR-007)**: After end, publisher patches `screen_on: false`; WS occupancy clears indicators for all clients.

## State transitions

```text
[idle]
  → start share (LiveKit publish + patch screen_on true)
[active]  — Grade tile + indicators on
  → in-app stop OR track ended OR remote unsubscribe OR leave
[clearing] — remove Map entry / setScreenOn(false) / patch false / clear spotlight selection
[idle]    — no Grade screen tile, indicators off
```

### Clear pipeline (required)

1. **Media**: LiveKit unpublish / unsubscribe; detach video elements.
2. **Maps**: Remove identity from `remotesScreen` (or empty list + delete key); local `clearLocalScreenEl` + `setScreenOn(false)`.
3. **Grade**: `refreshGradeLists()` → drop from `gradeScreenIds`; reflow grid.
4. **Spotlight**: If `selectedScreenAccountId ===` ended identity → clear selection / exit empty screen stage.
5. **Occupancy**: `patchVoiceMedia({ screen_on: false })` on publisher (both end paths); viewers update via `voice.occupancy`.

## Validation rules

- Ending share MUST NOT remove camera entries in `remotesCam` / cam Grade ids (FR-004).
- Re-start MUST add a fresh Map entry via `TrackSubscribed` only (FR-005)—no leftover keys from prior share.
- Multiple sharers: clear only the ended identity (edge case).

## Relationships

```text
LiveKit ScreenShare track ──subscribes──► remotesScreen ──► gradeScreenIds ──► CameraGrid screen tile
Publisher stop / track ended ──► stopScreenShare ──► screenOn false + patch screen_on
Occupancy WS screen_on ──► Sidebar / screenShareActive indicators
```
