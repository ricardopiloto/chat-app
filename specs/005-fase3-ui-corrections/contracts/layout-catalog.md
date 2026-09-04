# Layout Catalog Contract

Fonte: `docs/design-ref/Mesa - Protótipo v2.dc.html` (`LAYOUTS`). Índices de slot na API: **0-based**. Células abaixo usam número de slot **1-based** só como no protótipo; mapear `slot_index = n - 1`.

## Keys

| layout_key | label | slot_count |
|------------|-------|------------|
| `mestre` | Mestre em destaque | 5 |
| `quad` | Painel 2×2 | 4 |
| `faixa` | Faixa 5-up | 5 |

## Geometry (CSS Grid)

### mestre

- `grid-template-columns: 2fr 1fr 1fr`
- `grid-template-rows: 1fr 1fr`
- Cells: `(1 → col 1, row 1 / span 2)`, `(2 → 2,1)`, `(3 → 3,1)`, `(4 → 2,2)`, `(5 → 3,2)`

### quad

- `grid-template-columns: 1fr 1fr`
- `grid-template-rows: 1fr 1fr`
- Cells: `(1 → 1,1)`, `(2 → 2,1)`, `(3 → 1,2)`, `(4 → 2,2)`

### faixa

- `grid-template-columns: repeat(5, 1fr)`
- `grid-template-rows: 1fr`
- Cells: `(1..5 → col n, row 1)`

## Client duties

- `CameraGrid` / editor MUST aplicar `grid-column` / `grid-row` por célula.
- Miniaturas do painel MUST reflectir a mesma grelha (glyph).

## Server duties

- Reject unknown `layout_key`.
- Reject `slot_count` ≠ catalog count for that key.
- Persist `layout_key` on scene and on active grid payloads.
