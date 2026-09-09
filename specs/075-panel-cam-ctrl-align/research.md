# Research: 075-panel-cam-ctrl-align

## R1 — Why the camera control is taller than peers

**Decision**: Treat oversized camera control as a **CSS cascade conflict**: global `.call-ctrl-split` stage sizes win over `.user-panel-ctrl` 32×32.

**Rationale**: In `mesa-theme.css`:

- Panel peers use `.user-panel-ctrl { width/height: 32px }`.
- Global `.call-ctrl-split > .btn { min-height: 44px }` and `.call-ctrl-split .call-ctrl { min-width: 44px; width: 48px; padding: 12px }` apply to the same buttons inside `.user-panel-cam-split`, producing ~48×44+border ≈ the reported ~72×46 visual block with border/padding.
- Panel already tries a partial fix (`.user-panel-cam-split .call-ctrl-chevron { height: 32px; width: 22px }`) but does **not** fully override the main camera `.btn` / `min-height` / `width` / `padding` from the global split rules.

**Alternatives considered**:

| Option | Why rejected |
|--------|----------------|
| Enlarge mic/deafen/leave to 44px | Violates FR-006 |
| Stack camera + chevron vertically | Clarification: keep horizontal split |
| Remove blur chevron / long-press | Violates FR-003 |

---

## R2 — How to shrink without breaking stage chrome

**Decision**: Add **higher-specificity rules** under `.user-panel .call-ctrl-split` / `.user-panel-cam-split` that force:

- Split outer height **32px** (match peers), `align-items: stretch` or center as needed
- Camera main button **32×32** (reset `min-height`/`min-width`/`width`/`padding` from global split)
- Chevron remaining **horizontal**, compact width (~18–22px), same height 32px
- Outer split `box-sizing: border-box`; ensure border is included so total width fits narrow panel

**Rationale**: Stage / floating voice chrome can keep 44px split; only the user panel is in scope.

**Alternatives considered**: Duplicate markup without `.call-ctrl-split` class — more churn; CSS override is enough.

---

## R3 — Centering only in narrow column

**Decision**: Apply `justify-content: center` (and neutralize `.user-panel-leave { margin-left: auto }`) only under:

```css
.shell.stage-mode.channels-collapsed .user-panel-calls { … }
```

**Rationale**: Spec FR-004 / clarify: center **only** when stage + channels collapsed (narrow column ~68+52). With channels expanded, keep current horizontal row with leave pushed right via `margin-left: auto`.

**Alternatives considered**: Center whenever `stage-mode` — rejected by clarify. Center whenever `channels-collapsed` outside stage — out of reported scope; optional consistency later, not required.

---

## R4 — Overflow containment

**Decision**: After size fix, verify closed split fits within `.user-panel` content box; if border still clips, tighten chevron width / gap / panel padding or `overflow: hidden` on panel **only if** it does not clip speaking ring / menus incorrectly. Prefer fitting content over clipping the closed control.

**Rationale**: FR-005 is about closed control geometry, not the open blur menu (overlay MAY escape). Speaking aura (`inset: -3px`) must not force camera growth (edge case in spec).

**Alternatives considered**: Widen user-panel in collapsed mode — rejected (assumption: do not enlarge panel for old split).

---

## R5 — Markup / TS changes

**Decision**: Prefer **CSS-only**. Touch `UserPanel.tsx` only if a dedicated class is needed for centering/state (unlikely — `AppShell` already sets `stage-mode` + `channels-collapsed` on `.shell`).

**Rationale**: Markup already has `user-panel-cam-split`, `user-panel-ctrl`, `call-ctrl-split`.

---

## Resolved clarifications (from spec)

1. Horizontal compact split (not stack / not hide chevron).
2. Center only in narrow column (stage + channels collapsed).

No remaining NEEDS CLARIFICATION for plan.
