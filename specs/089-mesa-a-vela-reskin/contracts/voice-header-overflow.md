# Contract: Voice header overflow (`⋯`)

**Feature**: 089-mesa-a-vela-reskin  
**File**: `frontend/src/pages/VoiceChannel.tsx` (+ CSS / i18n as needed)  
**Related**: FR-005, SC-003

## VH-01 — Default visible chrome

At rest, voice header MUST include:

- Channel title + occupancy (and call timer if present)
- Composição / Grade segmented control
- Members control
- Overflow `⋯` control
- E2EE chip / control

MUST NOT show free-standing **Editar cena** button or **blur** select in the default row.

## VH-02 — Overflow contents

Opening `⋯` MUST expose:

- Blur / background effect control (same behavior as today’s header select)
- Editar cena when the user has that affordance (admin / existing gate)

Both MUST remain functional after the move (081 behavior preserved, location changed).

## VH-03 — Non-goals

- Do not move E2EE into overflow.
- Do not change Grade vs Composition stage semantics (082–086).
- Do not reintroduce stage-mode / collapsed-channels product UI.
