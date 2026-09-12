# Data Model: Fix Peer Screen Share Visibility

**Feature**: 097-fix-peer-screen-share  
**Date**: 2026-09-11

No new persisted entities. Conceptual media/layout model for the fix:

## Screen share session

| Field / concern | Notes |
|-----------------|--------|
| Sharer identity | LiveKit participant identity (= account id) |
| Video track | `Track.Source.ScreenShare` |
| Optional audio | `Track.Source.ScreenShareAudio` (system/tab when browser allows) |
| Local preview | Sharer’s Grade self-tile via local publication attach |
| Peer view | Remote subscribe → Grade `screen:{id}` tile |
| Occupancy flag | `screen_on` (indicators; not sufficient for live media) |

## Peer viewer expectations

| Surface | Video | Share audio |
|---------|-------|-------------|
| Grade | Live frames in peer screen tile | Hear when included |
| Composition | No screen tiles | Hear when included (082) |
| Self-preview only | Not success | Not success |

## Client maps (existing)

- `remotesScreen: Map<identity, RemoteTrack[]>` — remote screen **video** tracks for Grade attach
- `remotesAudio: RemoteTrack[]` / `sessionRemoteAudio` — remote **audio** (mic + share) on session host
- `gradeScreenIds` — Solid signal driving Grade screen tile list (includes local `screenOn` + remote keys)
- `gradeTileEls` — DOM hosts keyed `screen:{id}` / `cam:{id}`

## State transitions

| Event | Expected |
|-------|----------|
| Peer starts share | Subscribe ScreenShare (+ optional ScreenShareAudio) → tile appears → live video + audio within ~5s |
| Peer stops share | Unsubscribe / clear maps → tile gone, audio stops (088) |
| Viewer joins mid-share | Replay/subscribe existing pubs → live media without sharer restart |
| Mode → Composition | Screen video detach; share audio continues |

## Validation rules

- Present blank tile ≠ success.
- Leave/rejoin must not be required for first-share peer media.
- Multiple simultaneous sharers: each remote identity independently live for others.
