# Data Model: 085-screen-share-fit

No new persisted entities. Presentation attributes on existing Grade tiles (083).

## Grade tile (existing)

| Field | Notes for 085 |
|-------|----------------|
| `kind` | `"camera"` → fit **fill/cover**; `"screen"` → fit **show-all/contain** |
| `key` | Unchanged (`cam:` / `screen:`) |
| `accountId` | Unchanged |

## Fit mode (conceptual)

| Mode | Applies to | User-visible behavior |
|------|------------|------------------------|
| **Fill** | Camera tiles (Grade + Composition) | Frame fills tile; edges may crop (current) |
| **Show-all** | Screen tiles in Grade only | Entire shared frame visible; letterbox neutro escuro / tipo slot when aspect ratios differ |

## Validation rules

- Screen tiles MUST NOT use Fill.
- Camera tiles MUST NOT switch to Show-all as part of this feature.
- Letterbox empty area MUST read as neutral dark / slot-like (not Grade chrome color matching required).
- Spotlight does not change Fit mode.

## State

No new client signals. Fit is implied by tile `kind` + CSS class `.grade-screen-tile`.
