# Data Model: 073-role-card-name-only

**Storage**: None new. Reuses existing `ServerRole` fields.

## Presentation: role card heading

| Before (display) | After |
|------------------|--------|
| `name` + `posição {position}` + optional `(sistema)` | `name` only |

## Unchanged fields (still on model / used elsewhere)

| Field | Still used for |
|-------|----------------|
| `position` | Sort order, ↑/↓ reorder API |
| `is_system` | Hide delete; disable edit paths elsewhere |

## Validation

- Heading text content === role name (no «posição», no «sistema» substring in that node).
- Card actions still gated by `is_system` / permissions as today.
