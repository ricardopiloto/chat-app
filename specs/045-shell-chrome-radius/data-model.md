# Data Model: 045-shell-chrome-radius

Sem persistência. Modelo = **layout tokens + cartões de chrome**.

## Entities

### Shell gutter token

| Field | Type | Value | Notes |
|-------|------|-------|-------|
| `--shell-gutter` | length | `8px` | Subtil; padding `.app`, gaps grid/sidebar |

### Chrome card

| Field | Applies to | Radius | Notes |
|-------|------------|--------|-------|
| surface | topbar, server-rail, sidebar-header, sidebar-nav, user-panel, pane/home-empty | `var(--radius-lg)` | Overflow hidden when scrolling |
| gutterToNeighbor | all above | `--shell-gutter` | Uniform |

### Sidebar card stack

| Card | Role |
|------|------|
| `sidebar-header` | Server name / invite chrome |
| `sidebar-nav` | Channel list (scroll) |
| `user-panel` | Identity + call controls |

Parent `.sidebar` is a **layout stack** (gap only), not a filled full-bleed column.

### App chrome frame

| Field | Rule |
|-------|------|
| outer inset | `.app` padding ≥ `--shell-gutter` (top/sides; bottom as needed) |
| topbar alignment | Same content width as `.shell` (shared parent padding) |
| topbar↔body gap | `--shell-gutter` |

## Relationships

```text
.app (bg + padding)
 ├── .topbar (card)
 └── .shell (grid gap)
      ├── .server-rail (card)
      ├── .sidebar (stack gap)
      │    ├── .sidebar-header (card)
      │    ├── .sidebar-nav (card)
      │    └── .user-panel (card)
      └── .shell-main / .pane (card)
```

## State transitions

N/A (estático). Stage/drawer alteram larguras de coluna mas **preservam** card + gutter rules.

## Validation

- Seis cartões SC-001 com cantos visíveis face a `--color-bg` ou vizinho com gap.
- Nunca fundir header+nav+user-panel num único background sem gap.
- `--shell-gutter` idêntico em light/dark (não tema-dependente).
