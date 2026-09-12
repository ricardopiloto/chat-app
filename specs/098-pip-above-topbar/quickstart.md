# Quickstart: Floating PiP Above Top Bar

**Feature**: 098-pip-above-topbar  
**Date**: 2026-09-11

Manual validation for [spec.md](./spec.md) SC-001–SC-003 and [contracts/shell-stacking.md](./contracts/shell-stacking.md).

## Prerequisites

- App running (FE + BE as usual).
- Account that can join a voice channel and leave the voice stage so floating PiP shows.
- Ability to toggle light/dark theme.

## Build

```bash
cd frontend && npm run build
```

## US1 — PiP above top bar

1. Join a voice call; navigate so **floating PiP** is visible (leave voice stage / browse shell while still in call).
2. Drag the PiP so it **overlaps the top bar** (brand / version / actions strip).
3. Confirm the PiP is fully visible **above** the strip (no edge clipped under the header).
4. Drag again by the PiP header — drag works; PiP stays above the strip.
5. Click a PiP control (e.g. return to call or hang up) — click hits the PiP, not the top bar.
6. Repeat steps 2–5 in the **other** theme.

**Pass**: SS-01 + SC-001/SC-002 for both themes.

## Open menus above PiP (FR-006)

1. Park PiP overlapping the top bar.
2. Open **notifications** (if available) — panel appears **above** the PiP; items clickable.
3. Open **search** results — same.
4. Open **account** menu — same.
5. Close menus — PiP still above the chrome strip.

**Pass**: SS-02.

## Regression

- [ ] PiP in a non-overlapping corner: size, corner memory, media unchanged
- [ ] Top bar usable when PiP does not overlap it
- [ ] Open a dialog/modal — still covers the PiP
- [ ] Narrow/drawer layout: if PiP crosses the top bar, stacking still correct

## Failure signals

| Symptom | See |
|---------|-----|
| PiP under header | [SS-01](./contracts/shell-stacking.md); `.topbar` / `.voice-pip` z-index |
| Menu under PiP | [SS-02](./contracts/shell-stacking.md); topbar stacking-context trap |
| Dialog under PiP | [SS-03](./contracts/shell-stacking.md) |
