# Contract: Camera seats & speaking treatment

**Feature**: 089-mesa-a-vela-reskin  
**Files**: `mesa-theme.css`, `CameraGrid.tsx` / seat markup as needed, speaking classes (033/036)  
**Related**: FR-006, FR-007, FR-013, SC-004, SC-006

## SS-01 — Speaking

- Reuse existing speaking account state (LiveKit / session).
- Visual: amber ring/pulse on relevant seat and/or mic control.
- Under `@media (prefers-reduced-motion: reduce)`: speaking indicated by **static** border/color—no pulsing animation.

## SS-02 — Camera seats

- Optional five seat tones (ember/plum/slate/wine/umber) + nameplate gradient.
- Corner radius: `var(--radius-token)` (20px)—not global card radius.
- Webcam attach/play MUST continue to work in Grade and Composition.

## SS-03 — Screen tiles

- Do **not** apply camera seat face-crop / portrait zoom styling to `.grade-screen-tile` (or equivalent).
- Preserve 085 `object-fit: contain` + dark letterbox.
- Spotlight layout (086) structure unchanged.

## SS-04 — Regression smoke

Grade + Composition cameras; screen share present/clear; user-panel controls readable on new panel colors (084 stack included).
