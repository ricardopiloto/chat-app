# Contract: Local camera preview coherence

**Feature**: 091-fix-webcam-attach  
**Surfaces**: `VoiceSession.toggleCam`, `VoiceSession.dispatchLocalTrack` / handlers, `VoiceChannel.layoutMedia`, join `onLocalTrack`

## Canonical source

- **Canonical** local camera preview element: `VoiceSession.localVideoEl` (session memory).
- Composition / Grade on-stage layout MUST place that element (or keep a page cache that is **always** updated from it).
- Join path already: `liveClient` → `onLocalTrack` → page + `voice.setLocalVideoEl`.
- Mid-call path MUST achieve the same coherence when camera is first enabled or unmuted with a new attach.

## Required behaviors

### Mid-call enable (FR-008, FR-010)

When the user turns camera **on** while already live (e.g. UserPanel):

1. LiveKit camera enabled/unmuted and preview attached on session.
2. Voice page learns of the element (via `dispatchLocalTrack` / `onLocalTrack` **or** by reading the session getter in `layoutMedia`).
3. Self-view appears in **Composition** and **Grade** within **~2 s** without leave/rejoin or starting screen share.

### Join with camera (FR-014)

Existing join `onLocalTrack` remains valid; self-view within **~2 s** in both modes under SC-001.

### Cam off

Detaching / mute MUST clear or stop on-stage self-view; next enable must rebind (no permanent orphan).

## Non-goals

- Changing Floating PiP attach strategy (FR-012) except avoiding regressions.
- Changing occupancy `cam_on` patch semantics.

## Failure signals

- `camOn === true`, session has (or should have) a camera track, but Composition/Grade host never receives a playing video after ~2 s.
- Session preview plays in PiP while Grade/Composition stay empty for the same session — indicates split brain (this contract violated).
