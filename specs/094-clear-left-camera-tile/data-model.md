# Data Model: 094 Clear Left Camera Tile

**Feature**: [spec.md](./spec.md)  
**Scope**: Client presentation / media Maps. No new persisted entities.

## Entities

### RemoteCameraPublication (client map)

| Field | Type | Notes |
|-------|------|-------|
| identity | string | LiveKit participant identity (= account id) |
| tracks | remote video tracks | Camera source only (not ScreenShare) |

Stored today as `remotesCam: Map<identity, RemoteTrack[]>`.

### GradeCameraPresence

| Field | Type | Notes |
|-------|------|-------|
| accountIds | string[] | Drives Grade camera tiles |
| derivation | — | Union of: identities with cam tracks, in-room remotes (avatar seats), local self per existing rules |

**Invariant (094)**: If identity has **left** the room/call, they MUST NOT appear in `accountIds` after cleanup (within ~2s of observable leave).

### CompositionSeat

| Field | Type | Notes |
|-------|------|-------|
| index | number | Slot index |
| account_id | string \| null | From server grid / WS |
| video | present \| absent | Client attach state |

**Invariant (094)**: After leave, `video` MUST be absent for that identity even if `account_id` briefly remains; eventually `account_id` null → empty/free seat OK.

### PipCameraTile

| Field | Type | Notes |
|-------|------|-------|
| id | string | local / `identity:trackSid` |
| track | local or remote camera track | Only while publication exists |

**Invariant (094)**: Departed remote identity → no PIP tile; no frozen frame in PIP hosts.

## Relationships

```text
LiveKit ParticipantDisconnected / TrackUnsubscribed (Camera)
        │
        ▼
  remotesCam delete ──► scrub DOM hosts ──► refreshGradeLists / PIP refresh
        │
        ├─► Grade: drop tile + reflow
        ├─► Composição: no video (seat may empty/free)
        └─► clear spotlight if pointed at that camera
```

## State transitions

```text
[in call, cam on, live video]
        │ leave / disconnect
        ▼
[scrubbing]  (unsubscribe + map clear + DOM scrub)  ≤ ~2s from observable leave
        │
        ├─ Grade/PIP: tile gone
        └─ Composição: no frozen frame; empty/free OK
```

```text
[in call, cam on]
        │ cam off (still connected)
        ▼
[in call, cam off]  — seat/tile may remain; NOT the leave path
```

## Validation rules

- Screen-share cleanup remains 088; this model is camera-only.
- Rejoin + cam on → fresh live tile (no zombie from prior `remotesCam` / DOM).
- Multi-remote: only the departed identity is scrubbed.
