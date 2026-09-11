# Quickstart: 095-mesa-vela-reskin

Validate Mesa à Vela identity (PRD fidelity, not pixel-perfect) across themes without IA regressions. **Pause for stakeholder review after each delivery phase.**

## Prerequisites

- Backend + frontend running (`cargo run`, `npm run dev`).
- Fonts under `frontend/public/fonts/` (Fraunces + Manrope + Inter).
- Contracts: [design-tokens](./contracts/design-tokens.md), [place-typography](./contracts/place-typography.md), [voice-header-overflow](./contracts/voice-header-overflow.md), [seat-speaking](./contracts/seat-speaking.md).
- PRD: [prd-visual-refresh.md](../../docs/design-ref/prd-visual-refresh.md).

## Automated smoke

```bash
cd frontend && npx tsc --noEmit
```

Expect: exit 0 after each phase that touches TS/TSX.

## Phase gates

| After phase | Review focus |
|-------------|--------------|
| 1 Tokens | Amber/jade ramps, Mesa vars, fonts load (limited chrome polish OK) |
| 2 Shell | Rail/sidebar/topbar light+dark |
| 3 Voice | ⋯ menu, five seats, speaking + reduced motion |
| 4 Text/Auth | Composer/messages/Auth structure preserved |
| 5 QA | Settings/members/dialogs/toasts + AA contrast both themes |

## Manual scenarios (full Done)

### 1. Identity light + dark (US1 / SC-001)

1. Shell dark then light.
2. **Expect**: amber primary, parchment surfaces; not blurple-led; identity match to PRD (not pixel clone).

### 2. Place typography (US2 / SC-002)

1. Voice title, server name, Auth brand → **Fraunces**.
2. Text `#geral`, dialog title → **not** Fraunces.

### 3. Voice header overflow (US3 / SC-003)

1. Default: mode switch, Members, `⋯`, E2EE—no free-standing Editar cena / blur.
2. `⋯`: blur + Editar cena work when applicable.
3. Composition ↔ Grade still works.

### 4. Speaking + seats (US4 / SC-004 / SC-008)

1. Speaking → amber cue; with reduced motion → static cue.
2. Multiple camera seats → five-tone family distinguishable.
3. Screen share tile still contain (085).

### 5. Text + Auth (US5)

1. Send message; composer pill/circular send styling OK; behavior unchanged.
2. Auth two-column layout preserved with new tokens/type.

### 6. Uncovered screens + contrast (SC-005)

1. Settings, members/roles, a dialog, a toast—legible under new tokens.
2. Spot-check AA: body, muted, amber-as-small, jade chip—both themes.

### 7. Regression smoke (SC-006)

Join voice, toggle mode, members panel, theme toggle, user panel as shipped—after each phase.

## Pass criteria

Matches [spec.md](./spec.md) SC-001–SC-008 and FR-001–FR-017; phase pauses honored.
