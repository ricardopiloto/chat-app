# Contract: User panel span + chrome outer border (048)

Extends [045 shell-chrome-cards](../../045-shell-chrome-radius/contracts/shell-chrome-cards.md).

## Tokens

| Token | Role |
|-------|------|
| `--shell-gutter` | Gap inside `.shell-nav` (rail↔sidebar, row1↔panel); unchanged |
| `--radius-lg` | Outer `.app` corners **and** card corners (incl. spanning `.user-panel`) |
| Border color | `var(--color-divider)` (or equivalent subtle theme border) @ **1px** |

## DOM / grid

1. `.shell-nav` **MUST NOT** use `display: contents`.
2. `.shell-nav` **MUST** be the left track of `.shell` and contain:
   - `.server-rail`
   - `.sidebar` (header + nav only)
   - `.user-panel` as **direct child** spanning all nav columns
3. `.user-panel` **MUST NOT** be nested inside `.sidebar`.
4. Gap between rail/sidebar row and `.user-panel` **MUST** be `var(--shell-gutter)`.

## Geometry acceptance

| Check | Rule |
|-------|------|
| Panel width | Equals visual width of rail + gutter + sidebar |
| Rail bottom | Above panel top; no overlap |
| Outer frame | `.app` has 1px border + `border-radius: var(--radius-lg)` enclosing topbar + shell |

## Modes

- Stage / members: panel remains full-span of nav; outer border still encloses full chrome including members column when open.
- Narrow/drawer: existing drawer behaviour preserved; panel span rules apply when nav is visible.

## Non-goals

- Changing rail/sidebar nominal widths except as required by nav grid.
- Redesign of UserPanel controls/copy.
- Per-card outer borders instead of single `.app` frame.
- Box-shadow / glow on the outer frame.
