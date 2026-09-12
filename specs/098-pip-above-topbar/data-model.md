# Data Model: Floating PiP Above Top Bar

**Feature**: 098-pip-above-topbar  
**Date**: 2026-09-11

No persistent or network entities. Layering is a **UI presentation** concern only.

## Conceptual entities (shell)

### Top bar chrome strip

- **Identity**: App header `.topbar` (brand, version, instance, actions).
- **Role**: Persistent chrome; must remain visible and usable when PiP does not cover it.
- **Stacking**: Must sit **below** floating call PiP when regions overlap (FR-001).

### Top-bar menu (open)

- **Kinds**: Notifications panel, search results, account menu (and equivalents under topbar).
- **Role**: Ephemeral overlay anchored to top-bar actions.
- **Stacking**: When open, must sit **above** floating call PiP (FR-006).

### Floating call PiP

- **Identity**: `.voice-pip` (fixed overlay from `FloatingVoicePip`).
- **Attributes (unchanged)**: corner placement / drag position, media preview, controls (return / hang up).
- **Stacking**: Above top bar chrome; below open top-bar menus and below full-screen dialogs / context-menu roots.

### Modal / dialog layer

- **Identity**: Existing `.dialog-backdrop` / dialog stack.
- **Stacking**: Remains above PiP (assumption / edge case).

## Relationships

```text
dialog / context-menu  >  open top-bar menus  >  floating PiP  >  top bar chrome  >  main shell content
```

## State transitions

| State | Expected paint order |
|-------|----------------------|
| PiP visible, no menu | PiP above top bar strip |
| PiP overlaps strip + menu open | Menu above PiP; strip still below PiP where not covered by menu |
| Dialog open | Dialog above PiP |

## Validation rules

- No new stored fields.
- Corner memory and PiP show/hide rules unchanged (FR-004).
