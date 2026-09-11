# Contract: Voice header overflow

**Feature**: 095-mesa-vela-reskin  
**File**: `frontend/src/pages/VoiceChannel.tsx` (+ CSS / i18n as needed)

## VH-01 — Default visible

Always visible when applicable:

- Channel title + occupancy (and call timer if present)
- Composition / Grade segmented control
- Members control
- Overflow trigger `⋯`
- E2EE chip (jade / accent-2)

## VH-02 — Inside ⋯

- **Editar cena** (when user may edit)
- Camera **blur** control (when in call / applicable)

Both MUST remain fully functional from the menu.

## VH-03 — Non-goals

- Do not move E2EE into ⋯.
- Do not change Composition/Grade behavior—only chrome grouping.
- Do not reintroduce stage mode.
