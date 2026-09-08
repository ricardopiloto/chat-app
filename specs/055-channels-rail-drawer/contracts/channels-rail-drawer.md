# Contract: Channels rail drawer (UI)

**Feature**: 055-channels-rail-drawer  
**Surface**: Shell desktop (`.shell` + `.shell-nav` + `.server-rail` + `aside.sidebar`)

## Shell classes (normative intent)

| Condition | Expected layout |
|-----------|-----------------|
| Desktop, channels expanded | Rail ~68px + sidebar ~238px (reflow) |
| Desktop, channels collapsed | Rail ~68px + peek column ~8–12px; sidebar content not fully usable; peek affordance on rail’s **right** edge |
| Narrow / mobile drawer | Existing hamburger/`drawer-open` behaviour; **no** peek-behind-rail requirement |

Do **not** require `.stage-mode` to collapse/expand the channel list.

## Interactions

| Input | Drawer collapsed | Drawer expanded |
|-------|------------------|-----------------|
| Hover / focus-visible on peek | Enlarge peek (or reduced-motion equivalent) | n/a (peek not primary) |
| Activate peek (click / Enter / Space) | **Open** (reflow) | Must **not** close |
| Header «Ocultar canais» | n/a or no-op | **Close** |
| Header «Mostrar canais» | **Open** | n/a or no-op |
| Click outside drawer | No close | No close |

## Accessibility

- Peek control: focusable, named (e.g. aria-label «Mostrar canais»).
- Header toggle: `aria-expanded` reflects open state.
- `prefers-reduced-motion: reduce`: no reliance on motion alone for meaning.

## Persistence

- Read/write boolean expanded via local prefs (see data-model); restore on load (SC-004).
