# Contract: Occupant presence (Composition / Grade / roster)

**Feature**: 096-voice-audio-presence  
**Phase**: US2  
**Surfaces**: `refreshInCall`, `refreshGradeLists`, `deriveBank` / `CallBank`, Grade tiles, Sidebar voice roster; server join/patch cam flags

## OP-01 — Cam-off → Composition bank

- Live occupant with camera **off** MUST appear in Composition **bank** within ~3s of join.
- MUST NOT occupy a primary seat solely because seats are free (clarify B).
- MUST NOT be totally absent from Composition.

## OP-02 — Grade always lists

- Grade MUST show every live call occupant whether camera is on or off (tile may lack video).
- Refresh MUST run on participant connect and media subscribe paths that previously skipped list updates (e.g. audio-only).

## OP-03 — Roster

- Voice roster / “who is here” MUST include live cam-off occupants (align filter with in-call presence, not only mic∨cam transmitting if that hides live members).

## OP-04 — Cam on promote

- When cam turns **on** and a primary seat is free: leave bank, take seat, show video (no duplicate identity).
- When no seat free: remain in bank with video.

## OP-05 — Leave

- On leave/disconnect: remove from bank, seats, Grade, and roster for that call.
