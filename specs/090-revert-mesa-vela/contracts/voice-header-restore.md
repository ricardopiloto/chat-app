# Contract: Voice header restore

**Feature**: 090-revert-mesa-vela  
**File**: `frontend/src/pages/VoiceChannel.tsx` (+ i18n cleanup)  
**Related**: FR-003, SC-002

## VH-R01 — Default visible chrome

At rest, voice header MUST again expose (when applicable):

- Title / occupancy
- Composição / Grade
- Editar cena (when allowed) as a free-standing control
- Members
- Blur select when in call and not listen-only (free-standing, not only in overflow)
- E2EE chip

MUST NOT require a `⋯` overflow to reach Editar cena or blur.

## VH-R02 — Cleanup

- Remove overflow open state, panel, and click-outside handlers introduced for 089.
- Remove `voice.headerMore` (or equivalent) catalog strings if unused.

## VH-R03 — Non-goals

- Do not change Grade/Composition semantics or screen-share Grade rules.
- Do not move E2EE into a menu.
