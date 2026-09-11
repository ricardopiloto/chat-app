# Contract: Mesa à Vela design tokens

**Feature**: 089-mesa-a-vela-reskin  
**Files**: `frontend/src/styles/nocturne.css`, `frontend/src/styles/mesa-theme.css`, `frontend/public/fonts/`

## DT-01 — Accent ramp

- Recalculate `--color-accent` and `--color-accent-100..900` from amber seeds (PRD §3), preserving Nocturne’s lightness-scale approach (do not hand-paste nine unrelated hexes).
- Light theme must use deeper amber seeds for AA on parchment.

## DT-02 — Jade / security

- **Start of implement**: audit `color-accent-2` / `tag-accent-2` in product code.
- If unused in TS/TSX (expected): remap `--color-accent-2` + ramp to jade.
- Else: add `--color-security` (+ short ramp) and leave accent-2 unchanged.
- E2EE / security chips (e.g. `.e2ee-chip`) MUST consume jade tokens—not remain on primary amber/blurple.

## DT-03 — Surfaces & Mesa aliases

- Recalculate Nocturne bg/surface/text/divider and Mesa `--panel` / `--stage` / `--tile` / etc. per PRD §3–§4.2.
- `--stage` / `--tile` remain dark in light theme.
- `--color-danger*` unchanged.

## DT-04 — Fonts

- `@font-face` for Fraunces + Manrope (weights in [data-model.md](../data-model.md)); `font-display: swap`; files under `/fonts`; OFL licenses committed.
- No Google Fonts CDN.
- `--font-body` → Manrope with Inter fallback; Inter files remain.

## DT-05 — Radius

- Keep `--radius-sm/md/lg/pill`.
- Add `--radius-token: 20px` for camera seat frames only.

## DT-06 — Theme mechanism

- Continue `.app[data-theme="light"]` / existing TopBar toggle—no new theme engine.
