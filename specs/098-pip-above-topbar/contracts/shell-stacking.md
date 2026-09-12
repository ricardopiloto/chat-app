# Contract: Shell stacking (PiP vs top bar)

**Feature**: 098-pip-above-topbar  
**Date**: 2026-09-11  
**Type**: UI presentation contract (CSS stacking / hit-testing)

## Parties

- **Floating call PiP**: `.voice-pip` (`FloatingVoicePip`)
- **Top bar chrome**: `.topbar` strip (not channel pane headers)
- **Top-bar menus**: `.topbar-notif-panel`, `.topbar-search-results`, `.account-menu` when opened from the top bar
- **Higher overlays**: `.dialog-backdrop` / dialogs; `.context-menu-root`

## Guarantees

### SS-01 — PiP above chrome

When the PiP overlaps the top bar chrome strip, the PiP paints fully above the strip. Pointer events on the PiP (drag handle, controls) hit the PiP, not the strip underneath.

### SS-02 — Open menus above PiP

When a top-bar menu listed above is open, that menu paints above the PiP. Menu items remain visible and clickable even if the PiP sits under the menu’s bounding box.

### SS-03 — Dialogs / context menus above PiP

Existing full-screen dialogs and shell context-menu roots continue to paint above the PiP.

### SS-04 — Themes

SS-01–SS-03 hold under both light and dark themes (same stacking rules; no theme-only exception).

### SS-05 — Non-goals

Does not change PiP media, corner memory, top-bar content, or introduce OS-level always-on-top windows.

## Target layer order (implement guidance)

```text
dialogs (~100) ≥ context menus (~80) > top-bar menus (≥70) > .voice-pip (~55) > .topbar chrome (z-index auto / no trap) > shell content
```

Exact integers may shift as long as the relative order and SS-01–SS-03 hold.

## Failure signals

| Symptom | Likely breach |
|---------|----------------|
| PiP edge hidden under header | SS-01 |
| Click on PiP activates brand/actions | SS-01 |
| Open notif/search/account hidden under PiP | SS-02 |
| Dialog appears under PiP | SS-03 |
