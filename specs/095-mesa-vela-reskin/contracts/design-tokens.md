# Contract: Mesa à Vela design tokens

**Feature**: 095-mesa-vela-reskin  
**Files**: `frontend/src/styles/nocturne.css`, `frontend/src/styles/mesa-theme.css`, `frontend/public/fonts/`  
**PRD**: [prd-visual-refresh.md](../../../docs/design-ref/prd-visual-refresh.md) §3–§4

## DT-01 — Accent ramp

- Recalculate `--color-accent` and `--color-accent-100..900` from amber seeds, preserving Nocturne’s lightness-scale approach.
- Light theme uses deeper amber seeds for AA on parchment.

## DT-02 — Jade / security (locked)

- Remap `--color-accent-2` + `--color-accent-2-100..900` to jade seeds.
- E2EE / security chips (e.g. `.e2ee-chip`) MUST consume jade / accent-2 tokens—not remain on primary amber/blurple.
- `--color-security` not required unless a new conflicting consumer appears.

## DT-03 — Surfaces & Mesa aliases

- Recalculate Nocturne bg/surface/text/divider and Mesa `--panel` / `--stage` / `--tile` / related aliases per PRD.
- `--stage` / `--tile` remain dark in light theme.
- `--color-danger*` unchanged.

## DT-04 — Fonts

- `@font-face` Fraunces + Manrope (weights in [data-model.md](../data-model.md)); `font-display: swap`; `/fonts`; OFL licenses.
- No Google Fonts CDN.
- `--font-body` → Manrope with Inter fallback; Inter files remain.
- `--font-place` → Fraunces stack; `--font-heading` stays utility (not Fraunces).

## DT-05 — Radius

- Keep `--radius-sm/md/lg/pill`.
- Add `--radius-token: 20px` for camera seat frames only.

## DT-06 — Theme mechanism

- Continue `.app[data-theme="light"]` / existing toggle—no new theme engine.

## DT-07 — Hardcoded colors

- Colors found outside token files on touched surfaces MUST be moved onto tokens (FR-014).
