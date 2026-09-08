# Data Model: 048-user-panel-span-rail

UI layout regions (no persistence).

## Region: App chrome (`.app`)

| Attribute | Rule |
|-----------|------|
| Outer border | 1px, theme divider / subtle border token |
| Corner radius | `var(--radius-lg)` |
| Padding / gap | `var(--shell-gutter)` (unchanged from 045) |
| Children | TopBar, Shell (± members inside shell) |

## Region: Shell nav (`.shell-nav`)

| Attribute | Rule |
|-----------|------|
| Role | Single left track of `.shell` |
| Internal columns | Rail width + sidebar width (stage-aware) |
| Internal rows | (1) rail+sidebar stretch · (2) user-panel auto |
| Gap | `var(--shell-gutter)` between columns and between row1/row2 |

### Children

```text
shell-nav
├── server-rail          (row1, col1) — height limited to row1
├── sidebar              (row1, col2) — header + nav cards only
└── user-panel           (row2, col1–2) — continuous base card
```

## Region: Server rail

| Attribute | Rule |
|-----------|------|
| Vertical extent | Only above user-panel (row 1) |
| Scroll | List scrolls inside rail; create control stays in rail card |

## Region: User panel

| Attribute | Rule |
|-----------|------|
| Geometry | One card; full width of shell-nav |
| Content | Identity + optional call controls (unchanged behaviour) |
| Radius / fill | Same card language as 045 |

## State (layout modes)

| Mode | Nav columns | Panel span |
|------|-------------|------------|
| Default | 68 + 238 | full nav |
| Stage collapsed | 68 + 52 | full nav |
| Stage expanded | 68 + 238 | full nav |
| Members open | nav unchanged; shell gains members column | full nav |

## Validation rules

- No server icons in the vertical band occupied by user-panel.
- Gutter visible between rail bottom and panel top.
- Outer chrome border continuous around topbar + shell (+ members).
