# Contract: Deafen behavior

## Semantics (Discord-like)

| Action | Effect |
|--------|--------|
| Enable deafen | Stop hearing others; force mic muted; UI shows deafen on |
| Disable deafen | Hear others again; mic stays muted until user unmutes |
| Unmute mic while deafened | Clears deafen and enables mic |

## Scope

- Client-side for the local LiveKit room only.
- Cleared on hangup / disconnect.
- Available on whichever site is active (stage or user panel).

## Non-goals

- Server-persisted deafen flag.
- Per-participant selective deafen.
