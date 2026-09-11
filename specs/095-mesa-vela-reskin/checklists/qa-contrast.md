# Contrast & QA notes — 095 Mesa à Vela

Recorded during Delivery Phase 5 (`/speckit-implement`), then re-verified and corrected during a phase-by-phase stakeholder review (2026-09-11). The original pass below under-tested: it validated `--color-accent-700` only as a *filled-button* pairing (text-on-its-own-background) and never checked it, or raw `--color-accent`, as *text sitting directly on a page background* — which is where the real failures were. That review found and fixed several AA regressions; this file now reflects the corrected state.

## Contrast spot-checks (SC-005 / FR-013)

| Pair | Foreground | Background | Ratio | Verdict |
|------|------------|------------|-------|---------|
| Body text (dark) | `#EDE6DC` | `#14121A` | 14.99 | PASS ≥4.5 |
| Muted (dark) | `#A0978B` | `#14121A` | 6.45 | PASS ≥4.5 |
| Amber small/icon (dark) | `#D88A3D` | `#14121A` | 6.74 | PASS ≥3 (UI) / ≥4.5 |
| Jade chip text (dark) | `#C2EDDB` | `#14121A` | 14.52 | PASS ≥4.5 |
| Body text (light) | `#241C14` | `#F8F2E6` | 15.05 | PASS ≥4.5 |
| Muted (light) | `#5D534A` | `#F8F2E6` | 6.72 | PASS ≥4.5 |
| Amber seed (light) | `#B9661E` | `#F8F2E6` | 3.78 | PASS ≥3 for UI/icons only — fails 4.5 for text |
| Jade chip text (light) | `#02553F` | `#F8F2E6` | 7.93 | PASS ≥4.5 |
| Primary btn on light | `#FFFAF0` on accent-700 | — | 5.48 | PASS ≥4.5 (accent-700 corrected to `#9C5400`, see below) |
| Primary btn on dark | `#130F08` on `#D88A3D` | — | 6.93 | PASS ≥4.5 |

### Corrections made during stakeholder review

1. **`--color-accent-700` ramp value** (`nocturne.css`): `#A35A00` measured **4.25:1** as text on `--panel` (used by `.btn-primary`/`.btn-ghost` in light theme) — under AA. Recalculated in OKLCH (same hue/chroma, L 0.5417→0.52) to `#9C5400`: 4.64:1 on panel, 5.12:1 on bg. This ramp step feeds every other light-theme text-on-accent-700 use below.
2. **Raw `--color-accent` used directly as small text** in light theme (3.4–4.1:1, under AA) — found in 7 places, all given a light-theme override to `--color-accent-700`/`800`/`900`: `.auth-btn-outline`, `.seg-opt:has(input:checked)` (the Composição/Grade switch), `.msg-reply-quote-author`, `.msg-reply-btn:hover`, `.link-card-kind`, `.composer-reply-label strong`, `.jump-to-present`, `.topbar-notif-clear`.
3. **`.auth-btn-primary` hover/active** (light theme): background lightened accent-700→600 on interaction, dropping button-label contrast to 3.66:1. Changed to darken on interact instead (hover→800: 8.35:1, active→900: 12.43:1; light theme had no `:active` override before).
4. **`.sidebar-section-icon`** opacity 0.85 dragged light-theme icon contrast to 3.04:1 (barely over the 3:1 floor). Removed the opacity — 3.78:1.
5. **Speaking ring** (`.stage .slot.is-speaking`, reduced-motion static variant): `color-mix(accent 55%)` measured 2.85:1 dark / 2.10:1 light against `--stage` — under the 3:1 non-text floor. Raised to 85% → 5.40:1 / 3.31:1. (The motion-enabled pulse keyframes were left as designed; motion itself carries part of the affordance there.)
6. **`--radius-token` (seat-only, R6) leaked onto Grade screen-share tiles** via the shared `.stage .slot` base rule — `.grade-screen-tile` had no radius override. Added `border-radius: var(--radius-lg) !important` there, matching its existing background/border overrides.
7. **`.members-mute-dialog`** referenced an undefined `--bg` token (always fell through to hardcoded `#111`) — pre-existing, unrelated to the amber/jade swap, but still a token-system bypass. Pointed at `--color-neutral-900` instead, matching `.dialog-backdrop`'s established pattern (visually equivalent).

### Known pre-existing gap, not fixed (flagged for a separate decision)

`.members-kick` uses `var(--danger, #d76b6b)` — `--danger` (lowercase) is not a defined token anywhere, so this always resolves to the hardcoded fallback, bypassing the real `--color-danger` token. This predates 095 and isn't caused by the amber/jade swap. **Not fixed as part of this pass** because naively swapping to `--color-danger` would *regress* contrast: `#d13b3b` (dark) measures only 3.62:1 as small text on `--panel`, worse than the current `#d76b6b` fallback's 5.10:1. A real fix needs a decision (new AA-safe danger-text step, or a different existing token) rather than a mechanical find-replace.

## Uncovered surfaces (T027)

Settings nav, members panel, dialogs, toasts inherit Nocturne/Mesa tokens (amber accent, parchment surfaces) — confirmed via grep, zero hardcoded hex/rgb in `RolePermissionsPage.tsx`, `MembersManagePage.tsx`, `SettingsHomePage.tsx`, `RolesManagePage.tsx`, `Dialog.tsx`, `MembersPanel.tsx`, `ToastHost.tsx`, `SettingsNav.tsx`. Settings active nav uses `color: inherit` + amber wash/inset bar (not accent-as-text, avoiding the bug class above). `.dialog`/`.app-toast` are fully token-driven (`--elev`, `--color-text`, `--color-divider`). No remaining blurple hardcodes in the accent ramps.

## Regression smoke (T029)

Checklist for manual confirm (identity already reviewed in phases 1–7):

- [ ] Theme toggle light/dark
- [ ] Join voice; Composition ↔ Grade
- [ ] Members panel open/close
- [ ] User panel mic/cam/leave
- [ ] Screen share Grade contain (if available)
- [ ] Send text message; Auth two-column

Automated: `cd frontend && npx tsc --noEmit` — exit 0 (T026, re-verified after all Phase 8 fixes).
