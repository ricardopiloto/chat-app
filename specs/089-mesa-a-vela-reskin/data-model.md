# Data Model: 089-mesa-a-vela-reskin

No database entities. This feature models **design tokens** and **UI roles** as the “data” of the reskin.

## Entities

### DesignTokenSet (Nocturne)

| Token / group | Role | Mesa à Vela seeds (approx.) |
|---------------|------|------------------------------|
| `--color-accent` + `--color-accent-100..900` | Primary accent ramp | Amber `#D98A3D` / strong `#F0A452` (light: deeper `#B9661F` / `#A8570F`) |
| `--color-accent-2` + ramp **or** `--color-security` | Jade security/E2EE | `#5CB394` dark / `#2C8A69` light — path per FR-010 audit |
| `--color-bg`, `--color-surface`, `--color-text`, `--color-divider` | Generic surfaces/text | Dark parchment/ink; light parchment/ink per PRD §3 |
| `--color-danger*` | Danger | **Unchanged** (FR-009) |
| `--font-body` | Default UI | `"Manrope", "Inter", system-ui, sans-serif` |
| `--font-heading` | Generic headings | Stay utility (Manrope/Inter)—**not** Fraunces globally |
| `--font-place` | Place display | `"Fraunces", …` |
| `--radius-sm/md/lg/pill` | General chrome | Keep 8/14/22/pill |
| `--radius-token` | Camera seat frame only | `20px` (FR-013) |

### MesaSkinAliases (mesa-theme `.app` / light)

| Alias | Notes |
|-------|--------|
| `--panel`, `--elev`, `--muted`, `--hover`, `--press`, `--chip`, `--input-bg`, `--sel-*` | Recalc to parchment/ink |
| `--stage`, `--tile`, `--tile-line`, `--on-stage` | Stay **dark** in both themes (existing + PRD rule) |

### PlaceTypographyContext

| Surface | Uses Fraunces? |
|---------|----------------|
| Voice channel title (`.pane-title` in voice) | Yes |
| Sidebar server name | Yes |
| Auth brand “Mesa” | Yes |
| Text channel names (`#geral`), dialog titles, settings headings | No (Manrope) |

### VoiceHeaderChrome

| Control | Default visible | In `⋯` |
|---------|-----------------|--------|
| Title / occupancy | Yes | — |
| Composição / Grade | Yes | — |
| Members | Yes | — |
| E2EE chip | Yes | — |
| Editar cena | No | Yes (when allowed) |
| Blur select | No | Yes |

### CameraSeatVisual

| Field | Notes |
|-------|--------|
| `seatTone` | One of ember / plum / slate / wine / umber |
| `nameplate` | Bottom gradient overlay |
| `cornerRadius` | `var(--radius-token)` |
| `speaking` | Amber ring/pulse; static under reduced motion |

### FontAsset

| Family | Weights | Location |
|--------|---------|----------|
| Inter | existing | `frontend/public/fonts/Inter-*.woff2` (keep) |
| Fraunces | 400, 500, 600 | same dir + LICENSE |
| Manrope | 400, 500, 600, 700, 800 | same dir + LICENSE |

## State transitions

```text
[blurple Inter product]
  → audit accent-2
  → install fonts + Nocturne/Mesa token recalc
  → shell restyle
  → voice overflow + seats + speaking amber
  → text composer + Auth place type
  → QA uncovered + contrast AA
[Mesa à Vela product]
```

Theme toggle (`data-theme`) mechanism **unchanged**—only token values change.

## Validation rules

- Steady-state chrome must not read as blurple-led (SC-001).
- Fraunces only on PlaceTypographyContext (SC-002).
- Screen tiles must not inherit camera seat “face crop” styling (FR-007 / 085).
- WCAG AA for body/muted text and amber/jade small UI (FR-011).
- Focus ring distinguishable on amber primary buttons (PRD §8.3).
