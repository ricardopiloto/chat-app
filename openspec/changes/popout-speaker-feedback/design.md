# Design

## Context

See proposal.md for why. The popout calls `watch`, which connects with the viewer token (`{account_id}:popout`) and runs the same `wire` path as the main call. `TrackSubscribed` for audio calls `attachAudio`, which plays the track. The main window's microphone is a different LiveKit identity, so the popout treats it as remote audio and plays it back. The main window does not mute itself when the popout opens, and it already skips the local track.

## Goals / Non-Goals

**Goals:**

- The popout window plays no audio.
- The main window keeps playing everyone else.

**Non-Goals:**

- Moving call audio into the popout.
- Changing the viewer token, the hidden flag, or the grid.
- A sidetone control on the main window. The main window already does not play the local microphone.

## Decisions

1. **The viewer room does not attach audio.** In `watch` / `wire`, when this renderer is the popout, skip `attachAudio` for every track. Video subscriptions stay. Alternative considered: skip only the track whose identity is the account id without `:popout`. Rejected because the popout would still play the other participants a second time, on top of the main window.

2. **The main window is unchanged.** `openPopout` does not deafen or detach the main room's audio elements. Closing the popout only disconnects the viewer room.

## Risks / Trade-offs

- [A popout on another monitor does not carry the sound] → The sound stays with the main window, which already owns the call. The popout is the picture.

## Migration Plan

Client-only. No token or server change. Rollback is restoring audio attach on the viewer room.

## Open Questions

None.
