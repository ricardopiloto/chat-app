# Contract: Surface rollback (seats, speaking, E2EE, composer, place)

**Feature**: 090-revert-mesa-vela  
**Files**: `mesa-theme.css`, `CameraGrid.tsx`, `Sidebar.tsx`, `AuthShell.tsx`, composer styles  
**Related**: FR-004–FR-006, US3

## SR-01 — Camera seats

- Remove seat-tone classes, `seatToneFor`, `--radius-token` usage, seat gradients, nameplate-only chrome from 089.
- Grade camera tiles return to pre-089 slot presentation.
- Screen tiles keep 085 contain + letterbox.

## SR-02 — Speaking & E2EE

- Speaking indicators use pre-089 accent-based treatment (not 089 amber-specific restyle).
- `.e2ee-chip` restored to pre-089 styling (not jade security chip).
- Keep a non-animated speaking indication under `prefers-reduced-motion` if already part of the product.

## SR-03 — Composer

- Restore pre-089 composer input chrome (not 089 pill + circular filled send).

## SR-04 — Place typography markup

- Remove `.font-place` from voice title, sidebar server name, Auth brand.

## SR-05 — Sidebar section labels

- If 089 changed section labels away from pre-089 uppercase tracked style, restore that presentation.
