# Research: 066-topbar-notif-panel

## R1 — Root cause of «lista atrás do topbar»

**Decision**: Treat the defect as **clipping by ancestor overflow**, not missing open state.

Evidence:

- `.topbar { overflow: hidden; }` (rounded shell chrome).
- `.topbar-notif-panel { position: absolute; top: calc(100% + 6px); z-index: 40; }` is a **descendant** of `.topbar`.
- Absolute children cannot paint outside a scroll/overflow-hidden ancestor → panel is clipped; user perceives it as «behind» the header.

**Rationale**: Matches reported DOM (panel under header.topbar) and current CSS.

**Alternatives considered**: «z-index too low vs topbar» alone — insufficient while overflow clips; raising z-index inside the same clipping ancestor does not escape the box.

## R2 — Fix strategy (prefer CSS)

**Decision** (try in order):

1. **Preferred**: Set `.topbar { overflow: visible; }` (or `overflow-x: hidden; overflow-y: visible` if a browser accepts the combo) so the dropdown can extend below the bar while keeping `border-radius`.
2. If horizontal bleed becomes an issue: keep clipping on brand/text children only; set `.topbar-actions` / `.topbar-notif { overflow: visible; }` and ensure no intermediate wrapper still clips.
3. **Fallback**: Render the panel via a portal to `document.body` / `.app` with fixed/absolute coords from the button — only if (1)–(2) break the inset topbar look.

Also confirm sibling menus (search results, account) if they share the same pattern — fix notif first per scope; note shared overflow if the same bug appears elsewhere (out of scope unless trivial).

**Rationale**: Minimal change; preserves TopBar logic (toggle, links, 062).

**Alternatives considered**: Redesign topbar without radius — rejected. Always-open side drawer — out of scope.

## R3 — Interaction unchanged

**Decision**: Keep toggle on button, existing close-on-navigate; click-outside if already present stays. No new notification types. Ensure closed panel leaves no blocking layer (`Show when={notifOpen()}` already unmounts).

**Rationale**: Spec FR-003 / FR-004 / US3.

**Alternatives considered**: Modal fullscreen notif — rejected.

## R4 — Narrow viewport

**Decision**: Keep `width: min(280px, 80vw)` (or equivalent); after overflow fix, long lists may need `max-height` + `overflow-y: auto` on the panel so content stays on-screen below the topbar.

**Rationale**: FR-005 / edge case lista longa.

**Alternatives considered**: Full-width sheet on mobile — nice-to-have, not required.
