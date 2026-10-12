# Design

## Context

See proposal.md for why. Joining already writes occupancy and broadcasts `voice.occupancy` inside `POST /api/channels/{id}/voice/join`, before the LiveKit token is returned. A later media report broadcasts again when the camera, microphone or screen share actually changes. The client merges that payload in `applyOccupancy`. The sidebar, the green room and the call timer read those signals. People already in the room also refresh the stage on LiveKit participant and track events.

The open screens still stay stale until a reload or a round-trip through another channel. The occupancy REST snapshot is applied with the same function as the live event, and a response that started earlier can land afterwards and replace the channel's occupant list.

## Goals / Non-Goals

**Goals:**

- The screens already open on that channel follow `voice.occupancy` immediately.
- The stage follows the LiveKit track of someone who just published, without a rejoin.
- An older occupancy snapshot cannot erase a newer one.

**Non-Goals:**

- Polling occupancy.
- A new backend event. `voice.occupancy` and `grid.updated` stay the events.
- Changing who may join, or the green-room layout.

## Decisions

1. **One generation for occupancy.** Each applied update records that it is newer than the REST request still in flight. A response from a request started before that update is dropped for the channels it would overwrite. Alternative considered: ignore REST whenever a socket event has ever arrived. Rejected because a reconnect still needs the snapshot for channels the client missed.

2. **The open voice screen reads the same signals it already reads.** No second fetch on channel enter. If the green room or the sidebar does not repaint when those signals change, fix that binding. The check is two clients: one stays on the voice channel, the other joins with the camera on.

3. **The stage keeps the existing LiveKit listeners.** `TrackSubscribed` already refreshes the participant list. If a tile stays empty until rejoin, the fix is in that refresh path, not a new poll. The camera can publish after the join event; the roster may show the person before the video frame, and the frame follows as soon as the track is subscribed.

## Risks / Trade-offs

- [The first occupancy event can arrive before the camera track exists] → The roster shows the person immediately. The video tile fills when the track is subscribed, still without leaving the channel.
- [A dropped socket still needs a snapshot] → Reconnect keeps fetching occupancy. Only a response older than the latest live update is ignored.

## Migration Plan

Client-only if the event is already emitted, which it is. No data migration. Rollback is reverting the occupancy merge and the stage refresh.

## Open Questions

None.
