# Contrato: API de `slot_count` na cena

Âmbito: `PATCH /api/channels/{channel_id}/scenes/{scene_id}` com `layout` (e fluxos que chamam `validate_layout`).

## Body `layout` (existente, semântica nova)

```json
{
  "layout_key": "mestre" | "quad" | "faixa",
  "slot_count": 6,
  "assigned_by": "owner",
  "slots": [ { "index": 0, "account_id": "…" }, … ]
}
```

## Validação (MUST)

| Regra | Erro típico |
|-------|-------------|
| `2 ≤ slot_count ≤ 8` | `slot_count must be 2–8` |
| `slots.length == slot_count` | length mismatch |
| índices únicos em `0..slot_count-1` | out of range / duplicate |
| `layout_key` conhecido | parse error |
| **Não** exigir `slot_count == catalog(layout_key)` | — removido |

## Efeitos

- Persistir meta + slots da cena.
- Se cena **activa**: actualizar `channel.grid_slot_count` e broadcast grid (comportamento actual).
- Clientes sem permissão de admin/editor: inalterados (403 como hoje).

## Provisionamento

- Criação de canal voz: alinhar intervalo de `grid_slot_count` a **2–8** se o campo existir; default 4 ok.

## Testes contract

- Aceitar `mestre` + `slot_count: 6` com 6 slots.
- Aceitar `faixa` + `slot_count: 3`.
- Rejeitar `slot_count: 9` e `1`.
- Rejeitar mismatch length / índice.
