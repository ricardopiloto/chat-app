# Contract: Identity & typography restore

**Feature**: 090-revert-mesa-vela  
**Files**: `nocturne.css`, `mesa-theme.css`, `frontend/public/fonts/`  
**Related**: FR-001, FR-002, FR-008, FR-009

## IR-01 — Colors

- Restore pre-089 `--color-accent` (+ ramp), `--color-accent-2` (+ ramp), bg/surface/text/divider, and Mesa `.app` / `[data-theme=light]` aliases (cool greys / blurple family).
- Leave `--color-danger*` as the pre-089 danger semantics (do not invent a new danger palette).

## IR-02 — Typography

- `--font-body` / `--font-heading` → Inter stacks as before 089.
- Remove `--font-place`, `.font-place`, and Fraunces/Manrope `@font-face` blocks.

## IR-03 — Assets

- Delete unused Manrope/Fraunces woff2 + license files from `frontend/public/fonts/`.
- Keep Inter fonts.

## IR-04 — Theme mechanism

- Keep existing `data-theme` toggle; only values change back.
