# Contract: Voice-pane bottom in-call bar (080)

**Feature**: [080-call-controls-restore](../spec.md)  
**Scope**: `VoiceChannel` in-call chrome inside `.voice-pane`. No HTTP API.

## When

Shown when the user is **live** on the channel rendered by this pane (stage or composition view). Not a replacement for pre-join JOIN UI.

## Controls

```text
[ … stage / grid content … ]
[ hang-up | camera | blur? ]   ← bottom bar
```

| Control | Required | Notes |
|---------|----------|--------|
| Hang-up | Yes | Ends call; may duplicate UserPanel / PiP |
| Camera | Yes if may publish video | Enables mid-call camera after audio-only join |
| Blur | Yes iff camera on | Hidden (not merely disabled) when camera off |

## MUST

| ID | Rule |
|----|------|
| VB-01 | Bottom bar MUST be present while live on this channel’s voice pane |
| VB-02 | Hang-up MUST terminate the local call session |
| VB-03 | Camera toggle MUST allow enabling camera mid-call without re-join (permission permitting) |
| VB-04 | Blur control MUST be hidden while camera is off; available after camera on |
| VB-05 | Blur menu interactions MUST follow [blur-menu-visibility.md](./blur-menu-visibility.md) |
| VB-06 | Camera/blur remain off UserPanel (078/080 panel contract) |

## Non-goals

- Redesigning the entire stage layout
- New server endpoints for media toggles
