# Design

## Context

The installed LiveKit client defines `Excellent`, `Good`, `Poor`, `Lost`, and `Unknown` (`frontend/node_modules/livekit-client/src/room/participant/Participant.ts:27-38`), and emits `RoomEvent.ConnectionQualityChanged` with `(quality, participant)` (`room/events.ts:250-252`). `callSession.tsx:609-653` already wires room events but omits this one. `Tile` has small speaking, muted, and "you" chips (`tiles.tsx:80-95`). This signal is an ordinal health estimate, not raw RTT or jitter; numeric values would require separate stats collection and interpretation.

## Goals / Non-Goals

**Goals:** tell the local user when their call connection degrades or is lost; keep the UI small and accessible; clear stale quality after leave.

**Non-Goals:** display exact ping/jitter, diagnose the cause of bad quality, or score every remote participant in this change.

## Decisions

### D1. Show only the local participant's quality

In the owning room, initialize quality from `room.localParticipant.connectionQuality`, then handle `ConnectionQualityChanged` only when the event participant is local and the room/epoch is current. Reset to Unknown on teardown. The signal is useful as self-diagnostic feedback; remote quality could be misleading because a remote's own uplink and this viewer's downlink differ. The popout's viewer connection is not the user's publishing session, so it must not present its own quality as the owner call's health. The owner's local quality, computed in the main window, is relayed into the popout display through the existing authoritative `CallPopoutOwnerState` channel that already relays mic/cam/deafened; this does not read the popout's own room.

*Alternative rejected:* show quality on every tile. LiveKit provides the data, but remote values conflate different network paths and add noise to an already dense grid. This can be a follow-up if there is a clear diagnostic need.

### D2. Show five quality states with signal bars in the tile chip container

Render a multi-bar signal-strength glyph beside the local "you" chip in stage/grid sizes using the existing `Tile` chip container. Excellent fills all bars (for example, 4/4) in green; Good fills most (3/4) in green; Poor fills few (1/4) in red; Lost shows empty bars or a no-signal glyph in red; Unknown uses a neutral gray dashed or pending state, never green or red. The glyph has no visible text label, but an aria-label or accessible status text carries the localized textual level, and a title/tooltip explains that this is an estimated connection level. Lost does not by itself end the call. Keep state synchronized with `Reconnecting`/`Reconnected` events and do not show stale Excellent bars during an unresolved reconnect.

*Alternative rejected:* show numeric ping/jitter. `ConnectionQuality` does not contain those values, so this would imply measurement precision the app does not have.

*Alternative rejected:* a visible text-label chip was the first approach, but a bar and color glyph reads faster at a glance in a dense call UI; the accessible text now lives in the label/tooltip instead of on-screen.

### D3. Show relayed quality in the popout's existing control strip, not as new grid chrome

Extend `CallPopoutOwnerState` with the owner's quality level and publish it alongside mic/cam/deafened from `publishPopoutOwnerState`. Render the same bar-and-color glyph from D2 inside `PopoutControls`'s existing hover/focus-revealed strip. Gate it with the same `ready()`/`owner()?.available` checks as the control buttons, so an unavailable owner or a closed and reopened popout never displays stale quality.

*Alternative rejected:* an always-visible quality badge over the grid. The popout deliberately has no chrome outside its hover strip, and the product owner asked to avoid clutter. Reusing the existing hover-reveal placement adds the signal without permanent visual weight.

## Risks / Trade-offs

- [Quality may be Unknown briefly] → show a neutral gray pending glyph rather than guessing Good.
- [Indicator may change during reconnect] → use current room identity and reset/refresh on connection transitions.
- [Tile variants have limited space] → omit from compact strip/mini sizes, retaining the primary local tile presentation.
