# Data Model: 091-fix-webcam-attach

No new persisted tables. This feature corrects **runtime client binding** of camera media to Composition/Grade hosts.

## Entities (runtime)

### LocalCameraPreview

| Field | Owner | Notes |
|-------|--------|-------|
| `element` | `VoiceSession.localVideoEl` (canonical) | `HTMLMediaElement` from `LocalVideoTrack.attach()` |
| `track` | `VoiceSession.localCamTrack` | LiveKit local camera track |
| `camOn` | `VoiceSession.camOn` + occupancy `cam_on` | May be true while stage still blank (bug mode) |
| `pageCache` (optional) | `VoiceChannel` | Must stay equal to session element when used; prefer reading session in `layoutMedia` |

**Invariant (FR-010 / FR-008)**: If `camOn === true` and a local camera track is published, Composition and Grade MUST be able to mount the **same** preview element (or an attached equivalent) without requiring share/rejoin.

### DisplayHost

| Kind | Key | Map |
|------|-----|-----|
| Composition slot | slot `index` | `slotEls` |
| Grade camera tile | `cam:{accountId}` | `gradeTileEls` |
| Grade screen tile | `screen:{accountId}` | `gradeTileEls` (screen path; must not orphan cam) |

**Invariant (FR-009)**: When a host mounts (ref attach), layout MUST re-attempt placing known local/remote camera video into that host.

### RemoteCameraPublication (viewer)

| Field | Source |
|-------|--------|
| `identity` | LiveKit participant identity (= account id) |
| `tracks` | `remotesCam` map entries |
| Host | Composition slot for identity or `cam:{id}` Grade tile |

**Invariant (FR-015)**: After track is in `remotesCam` **and** host is in the map, video visible within ~2 s.

### ForcedRefreshCatalyst (deprecated for cameras)

| Catalyst | Today | After 091 |
|----------|-------|-----------|
| Leave/rejoin | Restores cams | Must be unnecessary |
| Start screen share | Remount → rebind | Must be unnecessary for cams |

## State transitions

```text
[cam off]
  → enable (join with cam OR mid-call toggleCam)
[published]  — track live; session preview element exists
  → layout with host present
[visible]    — video in Composition and/or Grade within ≤2s (local)
  → host remount (share/spotlight/list change)
[rebinding]  — at most ≤1s blank, then visible again without user action
  → cam off / leave
[cam off]
```

### Mid-call enable (critical path)

1. `toggleCam` enables/unmutes camera; attaches preview on session.
2. Session notifies voice page (`dispatchLocalTrack` / equivalent) **or** page reads session getter in layout.
3. `refreshGradeLists` includes `me` in camera ids.
4. Hosts mount → attach callbacks → `layoutMedia` places preview.

Failure today: step 2 incomplete → step 4 places nothing.

## Validation rules

- Blank tile with `camOn` after budgets = defect (FR-001, FR-007, FR-014).
- Share start MUST NOT be required for transition to `[visible]` (FR-002).
- PiP element path may differ; stage fix MUST NOT break PiP (FR-012).
- Screen maps (`remotesScreen`) independent; clearing/share must not drop `remotesCam` (FR-005).

## Relationships

```text
LocalCameraPreview ──mounts on──> DisplayHost (Composition | Grade cam)
RemoteCameraPublication ──attachRemote──> DisplayHost
Screen share remount ──may recreate──> DisplayHost (triggers rebind, not cam requirement)
FloatingVoicePip ──reads──> VoiceSession.localVideoEl (out of scope)
```
