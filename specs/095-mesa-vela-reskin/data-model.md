# Data Model: 095-mesa-vela-reskin

No persisted domain tables. Runtime/design entities are **CSS tokens**, **font assets**, and **UI chrome state** for the voice header overflow.

## Entities

### DesignTokenSet (Nocturne)

| Field | Notes |
|-------|--------|
| `--color-accent` + `--color-accent-100..900` | Amber ramp (OKLCH lightness scale) |
| `--color-accent-2` + `--color-accent-2-100..900` | **Jade** ramp (security role) |
| `--color-bg` / `--color-surface` / `--color-text` / `--color-divider` | Parchment/ink family |
| `--font-body` | Manrope + Inter fallback |
| `--font-heading` | Utility headings — **not** Fraunces |
| `--font-place` | Fraunces stack for place names only |
| `--radius-token` | `20px` — camera seat frames only |
| `--radius-sm/md/lg/pill` | Unchanged system radii |

### MesaSkinAliases (`.app` / `[data-theme="light"]`)

| Field | Notes |
|-------|--------|
| `--panel`, `--elev`, `--muted`, `--stage`, `--tile`, … | Recalculated per PRD §4.2 |
| `--stage` / `--tile` | Remain dark in light theme |
| `--color-danger*` | Unchanged |

### FontAsset

| Family | Weights | Location |
|--------|---------|----------|
| Inter | existing | `frontend/public/fonts/` (keep) |
| Fraunces | 400, 500, 600 | same; OFL |
| Manrope | 400, 500, 600, 700, 800 | same; OFL |

### PlaceTypographyTarget

| Surface | Applies Fraunces via `.font-place` / `--font-place` |
|---------|------------------------------------------------------|
| Voice channel title | Yes |
| Sidebar server name | Yes |
| Auth brand “Mesa” | Yes |
| Text channel names, dialog titles, settings | No |

### CameraSeatTone

| Tone id | Role |
|---------|------|
| `ember` | Seat background family 1 |
| `plum` | 2 |
| `slate` | 3 |
| `wine` | 4 |
| `umber` | 5 |

Assigned stably per participant/seat (hash or index)—visual only; no backend field required.

### VoiceHeaderOverflow

| Control | Default visible | In ⋯ |
|---------|-----------------|------|
| Title / occupancy | Yes | — |
| Composition / Grade | Yes | — |
| Members | Yes | — |
| E2EE chip | Yes | — |
| Editar cena | No | Yes (when permitted) |
| Blur select | No | Yes (when in call) |

## Validation rules

- Place type only on PlaceTypographyTarget list (FR-005).
- Jade tokens used for E2EE/security chrome (FR-011).
- Five seat tones present in voice UI (FR-010).
- Contrast AA both themes before Done (FR-013).
- No external font CDN (FR-004).

## Relationships

```text
DesignTokenSet ──skin──> MesaSkinAliases ──styles──> Shell / Voice / Text / Auth
FontAsset ──@font-face──> --font-body / --font-place
CameraSeatTone ──classes──> CameraGrid seats
VoiceHeaderOverflow ──UI──> VoiceChannel header
```
