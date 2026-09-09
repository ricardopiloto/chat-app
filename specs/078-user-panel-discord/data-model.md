# Data Model: 078-user-panel-discord

Presentation / client-state model only. No new server entities.

## Entities

### User panel (chrome)

| Field / concern | Notes |
|-----------------|--------|
| Identity primary | Account `handle` |
| Identity secondary | Localized status text — always `online` while authenticated (this delivery) |
| Avatar + online indicator | Existing avatar; green online dot aligned with secondary |
| Mic / deafen | Always visible; enabled iff voice session live; decorative chevrons |
| Settings | Opens existing account menu path |
| Leave | Visible iff live **and** not on stage; left of Discord trio |
| Camera / blur | **Absent** from this entity |

### Channel list chrome

| Field / concern | Notes |
|-----------------|--------|
| Expanded | Always true in product UI |
| Legacy pref `mesa.channelsListExpanded` | Must not collapse UI; ignore and/or clear |
| Hide / peek controls | Removed from live UI |

### Join surface (voice/video pre-join)

| Field | Type | Rules |
|-------|------|--------|
| `cameraIntent` | boolean | Default `false`; opt-in sets `true` |
| `blurMode` | existing blur preference enum | Interactive only when `cameraIntent === true` |
| `previewStream` | optional MediaStream | Created only after camera opt-in (lazy); released on opt-out / leave pre-join / after join |
| JOIN action | — | Calls existing connect with camera vs audio based on `cameraIntent` |

### Banco / palco (unchanged semantics)

| Join outcome | Placement |
|--------------|-----------|
| `cam_on: false` | Banco by default |
| `cam_on: true` | Existing auto-slot / palco rules |
| Later cam on from bank | Auto-slot only if automatic assignment + free slot |

## State transitions

### Pre-join camera intent

```text
[open pre-join] → cameraIntent=false, no preview, blur inactive
cameraIntent=false --opt-in--> cameraIntent=true → may start lazy preview; blur interactive
cameraIntent=true --opt-out--> cameraIntent=false → stop preview; blur inactive
--JOIN--> connect(camera|audio) → live session (032 paths)
```

### User panel call extras

```text
!live → identity + mic(disabled) + deafen(disabled) + settings
live && !stage → identity + leave + mic + deafen + settings
live && stage → identity + mic + deafen + settings  (leave/cam/blur on stage chrome)
```

## Validation

- Blur controls must not be interactive when `cameraIntent` is false (FR-026).
- Camera permission must not be requested on default pre-join open (FR-021).
