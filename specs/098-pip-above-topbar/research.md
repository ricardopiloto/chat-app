# Research: Floating PiP Above Top Bar

**Feature**: 098-pip-above-topbar  
**Date**: 2026-09-11

## R1 — Root cause

**Decision**: Treat the bug as a **CSS stacking** mismatch: `.voice-pip` (`position: fixed; z-index: 40`) sits below `.topbar` (`position: relative; z-index: 50`), so overlapping PiP is covered and clicks hit the header.

**Rationale**: Matches reported DOM path (`header.topbar`) and measured styles in `mesa-theme.css`.

**Alternatives considered**: Clip/overflow on topbar (already `overflow: visible` for menus — not the cause). Move PiP in DOM order alone (insufficient while topbar has higher z-index).

## R2 — Stacking context trap (FR-006)

**Decision**: Do **not** only raise `.voice-pip` above `.topbar` while leaving `.topbar { z-index: 50 }`. Open menus (`.topbar-notif-panel`, `.topbar-search-results`, `.account-menu`) are descendants of `.topbar`; they cannot paint above an external PiP that beats the whole topbar stacking context.

**Rationale**: Spec clarify — PiP &gt; strip; open menus &gt; PiP. CSS stacking: child z-index cannot escape a parent stacking context.

**Alternatives considered**: Raise PiP only (fails FR-006). Raise menu z-index inside topbar only (still trapped).

## R3 — Preferred fix (CSS-first)

**Decision**:

1. Remove or set `.topbar` `z-index` to `auto` (keep `position: relative` + `overflow: visible` for menu anchors).
2. Set `.voice-pip` to a mid shell layer (target **55**), above normal chrome / drawers (≤25–30).
3. Raise top-bar menu panels to **≥70** (notif, search results, account under topbar) so open menus beat PiP.
4. Leave `.context-menu-root` (~80) and `.dialog-backdrop` (~100) above PiP.

**Rationale**: Satisfies FR-001/002/006 without portals; themes share the same rules (FR-005).

**Alternatives considered**: Portal menus to `document.body` with fixed positioning (works but more TS; keep as fallback). Dynamically bump topbar z-index when a menu opens (fragile; topbar would cover PiP again while open—OK for menus but reintroduces strip covering PiP if strip shares the bump).

## R4 — Regression watch after removing topbar z-index

**Decision**: After clearing `.topbar` z-index, manually verify drawers / floating shell pieces do not cover the top bar strip incorrectly; adjust only if needed (e.g. modest positive z-index on strip **only if** menus are portaled, or ensure competing overlays stay ≤ PiP and menus stay ≥70 outside any trap).

**Rationale**: Historical `z-index: 50` likely kept the bar above mid-layer shell chrome; clearing it is required for FR-006 unless portaling.

**Alternatives considered**: Keep topbar at 50 + portal menus (acceptable fallback if auto topbar regresses badly).

## R5 — Scope boundaries

**Decision**: No changes to PiP drag logic, corner classes, media, or top-bar content; no new PiP features; no backend.

**Rationale**: Spec FR-003/004 and assumptions.

## R6 — Validation

**Decision**: Manual quickstart: overlap PiP on top bar (visibility + drag + control click); open notif/search/account over PiP; both themes; dialog still covers PiP; `npm run build`.

**Rationale**: Spec SC-001–SC-003.
