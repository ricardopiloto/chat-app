# Contract: Active-share indicators clear on share end

**Feature**: 088-clear-ended-screen-tile  
**Surfaces**: Occupancy REST/WS, Sidebar, VoiceChannel channel cues

## Source of truth

`voice_occupants.screen_on` (boolean), updated by `PATCH` voice media and broadcast on `voice.occupancy`.

## Publisher obligations (FR-007 / FR-008)

On **either** end path:

1. In-app stop control, or  
2. Browser/OS stop / capture track `ended`,

the publisher MUST attempt `patchVoiceMedia(channelId, { screen_on: false })` (already part of `stopScreenShare`).

## Consumer obligations

- Sidebar / occupant rows: show sharing affordance only when `screen_on === true`.
- Channel-level “someone sharing” cue: true only if some occupant has `screen_on`.
- After occupancy event with `screen_on: false` for that account, indicators MUST clear without refresh.

## Independence from Grade

Indicators may clear on WS slightly after Grade media clear (LiveKit unsubscribe is faster). Both MUST clear without leave/rejoin; SC targets ≤ few seconds.

## Non-goals

- New occupancy fields or WS event types.
- Changing meaning of `cam_on` / mute fields.
