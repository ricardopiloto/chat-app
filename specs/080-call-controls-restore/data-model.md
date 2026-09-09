# Data Model: 080-call-controls-restore

Presentation / client-session model only. No new server entities.

## Entities

### User panel call chrome

| Field / concern | Notes |
|-----------------|--------|
| Leave | Visible iff `voice.live()` — **including stage** |
| Mic | Always interactive (except listen-only when permission known); reflects session preferred / live mic |
| Deafen | Always interactive; reflects session preferred / live deafen |
| Camera / blur | **Absent** (unchanged vs 078) |
| Chevron on mic/deafen | **Absent** |
| Shape | Soft rounded rectangle — not pill |

### Voice session media preferences (browser session)

| Field | Type | Default | Rules |
|-------|------|---------|-------|
| `micOn` (preferred when !live) | boolean | `true` | Toggleable out of call; applied on join as publish intent |
| `deafened` (preferred when !live) | boolean | `false` | Toggleable out of call; on join apply remote mute + force mic off if deafened (existing live semantics) |
| Persistence | — | — | In-memory only; lost on full page reload / new tab |
| `camOn` | boolean | from join / toggles | Live only for publish; mid-call toggle via bottom bar |

### Voice-pane bottom bar (in-call)

| Control | Visibility | Action |
|---------|------------|--------|
| Hang-up | When live on this channel | End call |
| Camera | When live and may publish video | `toggleCam` |
| Blur | When live **and** camera on | Open menu / apply blur mode |
| Error text | As today | May share footer strip with bar |

### Blur menu surface

| Concern | Rule |
|---------|------|
| Stacking | Menu fully visible and clickable above pane header / voice chrome |
| Anchor | Pre-join and/or bottom-bar `.camera-blur-anchor` |

## State transitions

### Mic / deafen prefs

```text
[app load] → micOn=true, deafened=false  (session defaults)
!live --toggleMic--> flip micOn (UI only)
!live --toggleDeafen--> flip deafened (UI only; may imply micOff visual if product mirrors live)
!live --JOIN--> bindLive(mic=preferredMic unless listen-only)
              → if preferredDeafened: setDeafened(true) after bind
live --toggleMic/Deafen--> existing LiveKit + patchVoiceMedia behaviour
[full reload] → defaults again
```

### Camera mid-call

```text
joined audio-only (camOn=false) --bottom bar cam on--> toggleCam → publish video (+ blur pref if on)
camOn=true --blur menu--> applyBlurMode
camOn=false → blur control hidden
```

### Leave

```text
live (any stage) --panel hangup--> hangup()
live --bottom bar hangup--> hangup()  (duplicate OK)
```

## Validation rules

- Listen-only: MUST NOT publish mic/cam even if preferred mic looks “on”; UI MUST be coherent (disabled or non-publishing).
- Preferred deafen on join MUST NOT leave remotes audible.
- Bottom-bar blur MUST NOT show while camera off.
