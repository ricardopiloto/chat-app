# Quickstart: 089-mesa-a-vela-reskin

Validate Mesa à Vela identity across themes without IA regressions.

## Prerequisites

- Backend + frontend running (`cargo run`, `npm run dev`).
- Fonts installed under `frontend/public/fonts/` (Fraunces + Manrope + Inter).
- Contracts: [design-tokens](./contracts/design-tokens.md), [place-typography](./contracts/place-typography.md), [voice-header-overflow](./contracts/voice-header-overflow.md), [seat-speaking](./contracts/seat-speaking.md).
- PRD reference: [docs/layout-review-01.md](../../docs/layout-review-01.md).

## Automated smoke

```bash
cd frontend && npx tsc --noEmit
```

Expect: exit 0.

## Manual scenarios

### 1. Identity light + dark (US1 / SC-001)

1. Open shell (sidebar + main) in dark theme; then toggle light.
2. **Expect**: amber primary accent, parchment/ink surfaces; steady state is **not** blurple-led.
3. Spot-check primary button, focus ring, segmented control — inherit amber ramp.

### 2. Place typography (US2 / SC-002)

1. Voice channel title, sidebar server name, Auth brand → **Fraunces**.
2. Text channel name `#geral`, a dialog title, a settings heading → **not** Fraunces.

### 3. Voice header overflow (US3 / SC-003)

1. Open voice channel: default row has mode switch, Members, `⋯`, E2EE—no free-standing Editar cena / blur.
2. Open `⋯`: blur + Editar cena (if allowed) work.
3. Switch Composição ↔ Grade; stage still works (incl. screen share if tested).

### 4. Speaking + seats (US4 / SC-004)

1. Speak with motion allowed → amber speaking treatment.
2. Enable `prefers-reduced-motion: reduce` → speaking still visible, no pulse.
3. Camera seats restyled; video still plays; screen tiles still show full frame (contain).

### 5. Text + Auth (US5)

1. Text messages/composer: avatar/day separator/pill composer + circular send as specified.
2. Auth: two-column layout unchanged; brand uses place type + new tokens.

### 6. Uncovered screens + contrast (FR-012 / SC-005 / SC-007)

1. Settings, members/roles, invite dialogs, toasts — both themes: legible, token-coherent.
2. Document AA spot-checks: body, muted, amber/jade small UI on both themes.
3. Regression: user-panel stack; screen share start/stop clear; theme toggle.

## Pass criteria

Matches [spec.md](./spec.md) SC-001–SC-007 and PRD §9.
