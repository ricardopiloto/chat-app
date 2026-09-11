# Contrast AA checklist — Mesa à Vela (089)

**Date**: 2026-09-10  
**Themes**: dark + light  
**Target**: WCAG AA — 4.5:1 normal text, 3:1 large text / UI icons

## Spot-checks (implementer)

| Pair | Dark | Light | Notes |
|------|------|-------|-------|
| Body `--color-text` on `--color-bg` | `#EDE6DC` / `#14121A` | `#241C14` / `#F8F2E6` | Pass by construction (high contrast parchment/ink) |
| Muted `--muted` on `--panel` | `#A89F90` / `#1C1926` | `#6B5F52` / `#F3EBDC` | Spot-check in shell; deepen muted if fails |
| Amber small UI on bg | accent-500 icons | accent-700 on light | Prefer accent-700 for text-sized amber on light |
| Jade E2EE chip | accent-2-200 on accent-2 wash | same tokens | Chip uses jade wash + border |
| Focus on `.btn-primary` | amber outline on amber border | accent-700 | Visual check PRD §8.3 |

## Uncovered screens

Settings / members / invites / toasts: inherit Nocturne tokens — open both themes and confirm no unreadable islands (SC-007).

## Sign-off

- [x] Tokens recalculated for parchment/amber/jade
- [x] Reduced-motion speaking static path present
- [ ] Manual walkthrough by reviewer (quickstart §1–§6)
