# Data Model: 018-scene-camera-count

## `CameraCount` (N)

| Campo | Tipo | Regras |
|-------|------|--------|
| `N` / `slot_count` | inteiro | **2 ≤ N ≤ 8** |

## `LayoutFamily` (`layout_key`)

| Valor | Identidade visual | Destaque |
|-------|-------------------|----------|
| `mestre` | 1 grande + N−1 satélites | Slot índice **0** (fixo) |
| `quad` | Grelha equilibrada de N | Nenhum |
| `faixa` | Faixa horizontal N-up | Nenhum |

`layout_key` e `N` são **ortogonais**: qualquer família × qualquer N válido.

## `GridLayout` (persistido / draft)

| Campo | Notas |
|-------|-------|
| `layout_key` | Família |
| `slot_count` | = N |
| `slots[]` | Exactamente N entradas; `index` ∈ `0..N-1` únicos; `account_id` opcional |
| `assigned_by` | `owner` no editor |

### Transições de N (rascunho)

| Evento | Efeito |
|--------|--------|
| N ↑ | Novos slots vazios no fim; dirty |
| N ↓ (excesso só vazio) | Remover vazios (preferir índices altos); reindexar; dirty |
| N ↓ (precisa tirar ocupado) | Editor selecciona slots a remover; reindexar restantes; dirty |
| Troca `layout_key` | Mantém N e atribuições por índice; dirty |
| Guardar | Persiste; se cena activa → `channel.grid_slot_count` + broadcast |
| Descartar | Volta a `baseLayout` |

## `Scene` / `Channel` (existentes)

- `scene.slot_count`, `scene.layout_key`, slots da cena.
- `channel.grid_slot_count` espelha N da cena activa após save/activate.

## Validação servidor

- `slot_count` ∈ [2,8]
- `slots.length == slot_count`
- Índices únicos no intervalo
- Contas únicas por slot
- `layout_key` válido **sem** igualdade forçada a um N de catálogo
