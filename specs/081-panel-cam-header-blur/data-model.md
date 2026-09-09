# Data Model: 081-panel-cam-header-blur

Presentation / client-session model. No new server entities.

## Entities

### User panel controls

| Control | Order | Behaviour |
|---------|-------|-----------|
| Leave | When live | Hang up (unchanged) |
| Mic | Always | Session pref / live (080) |
| Deafen | Always | Session pref / live (080) |
| **Camera** | After deafen, before settings | Session pref when idle; live toggle when in call; no blur UI |
| Settings | Last | Account menu |

### Voice session preferred camera

| Field | Type | Default | Persistence |
|-------|------|---------|-------------|
| `camOn` preferred | boolean | `false` | Browser session memory only |
| Live `camOn` | boolean | from join / toggles | While live |

### Header blur select (in-call voice pane)

| Field | Values | Persistence |
|-------|--------|-------------|
| Blur mode | `off` \| `light` \| `strong` | Existing `mesa.cameraBlur` |
| Visibility | When live on this voice pane | — |

### Stage mode

| Concern | Rule |
|---------|------|
| Product state | Always **off** |
| Legacy `mesa.stageMode` | Ignored / not applied |
| UI toggle | Removed |

### Pre-join surface

| Present | Absent |
|---------|--------|
| JOIN (uses panel cam pref) | Camera opt-in |
| Optional test video | Pre-join blur |
| Listen join | Lazy camera preview |

### Removed

- `voice-in-call-bar` (hang-up / cam / blur strip)

## State transitions

### Preferred camera

```text
[app load] → camPreferred=false
!live --panel toggle--> flip camPreferred
!live --JOIN--> connect(camPreferred ? camera : audio)
live --panel toggle--> toggleCam (publish/mute)
[reload] → camPreferred=false
```

### Blur select

```text
live on voice pane → show select(mode=readBlurMode())
change select → writeBlurMode + if camOn applyBlurMode
cam off → preference only until cam on
```

### Stage

```text
any path → stageMode=false (never true)
```

## Validation

- Listen-only: camera control disabled / non-publishing.
- JOIN with preferred cam on + soft-fail: audio-only with feedback (existing).
- Blur unavailable: select can stay on off; light/strong communicate failure.
