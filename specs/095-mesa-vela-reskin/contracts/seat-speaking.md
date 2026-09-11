# Contract: Camera seats & speaking

**Feature**: 095-mesa-vela-reskin  
**Files**: `CameraGrid.tsx` / seat CSS in `mesa-theme.css`; speaking styles tied to existing speaking state (033/036)

## SS-01 — Five seat tones

- Seats MUST use the five-tone family: **ember, plum, slate, wine, umber** (gradients as in prototype / PRD).
- Assignment is client-visual (stable per identity preferred); no backend schema.

## SS-02 — Nameplate & radius

- Nameplate treatment (lower gradient / readable label) per PRD intent.
- Seat frame corner radius uses `--radius-token` (20px); do not change global card radii.

## SS-03 — Speaking

- Speaking cue uses **amber** (primary accent family).
- Under `prefers-reduced-motion: reduce`: visible **static** treatment (e.g. border/color)—**no pulse animation**.

## SS-04 — Screen tiles

- Screen-share tiles keep **contain** / letterbox rules (085)—do not apply camera seat portrait crop to screens.
