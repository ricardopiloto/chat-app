# Contract: Theme preference resolution & persistence

**Feature**: 057-system-theme-preference  
**Surface**: `mesa.theme` localStorage + `data-theme` on `html` / `.app`

## Storage

| Key | Allowed values | Meaning |
|-----|----------------|---------|
| `mesa.theme` | `light` | Force light |
| | `dark` | Force dark |
| | `system` | Follow OS; explicit user choice |
| | *(absent)* | Follow OS; never written by load alone |
| | other | Treat as absent |

## Resolution API (normative intent)

| Input preference | Effective `data-theme` |
|------------------|------------------------|
| `light` | `light` |
| `dark` | `dark` |
| `system` or absent | from `prefers-color-scheme` |

## Side effects

| Event | Required behaviour |
|-------|-------------------|
| Boot / first paint | Effective theme applied ASAP (`html` at minimum) |
| Preference write | Persist value; apply effective; notify same-tab UI; other tabs via `storage` |
| OS scheme change while preference is system/absent | Re-apply effective theme |
| OS scheme change while light/dark | No change |
| Auth / login mount | Apply resolved theme; **no** preference control |

## Acceptance probes

1. Clear `mesa.theme`, OS dark → login + app dark.
2. Set `mesa.theme=light`, OS dark → login + app light after reload.
3. Set `mesa.theme=system`, toggle OS → UI follows within 2s.
4. Invalid value → behaves as absent.
5. Load with absent key does not create `mesa.theme`.
