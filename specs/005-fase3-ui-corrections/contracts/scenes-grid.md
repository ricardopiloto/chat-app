# Scenes / Grid API deltas (005)

Base: contratos F2 em `specs/003-fase-2-cenas/contracts/`. Esta feature **estende** payloads e autorização.

## GridLayout JSON

```json
{
  "layout_key": "mestre",
  "slot_count": 5,
  "assigned_by": "owner",
  "slots": [
    { "index": 0, "account_id": "…" },
    { "index": 1, "account_id": null }
  ]
}
```

- `layout_key` **required** em respostas GET após migrate.
- Clientes antigos sem campo: servidor trata ausência no PUT como erro 400 *ou* default `quad` só na migração de leitura legacy — preferir **required** após deploy conjunto.

## Endpoints (comportamento novo)

| Método | Path | Mudança |
|--------|------|---------|
| GET | `/api/channels/{id}/grid` | Inclui `layout_key` |
| PUT | `/api/channels/{id}/grid` | Aceita `layout_key`; valida catálogo; **owner only** |
| GET | `/api/channels/{id}/scenes` | Cada cena inclui `layout_key` no layout |
| PATCH | `/api/channels/{id}/scenes/{sid}` | Body pode incluir `layout` com `layout_key`; **owner only** |
| POST | `/api/channels/{id}/scenes/{sid}/activate` | **Owner only** (co_director → 403) |
| GET/PUT | `/api/channels/{id}/roles` | Sem mudança obrigatória; UI deixa de chamar |

## Errors

- `400` — `layout_key` inválido / `slot_count` mismatch / slots inválidos
- `403` — não-dono em activate / put grid / patch scene layout

## WS

- `grid.updated` / `scene.changed` payloads MUST incluir `layout_key` quando transportam layout (mesmo shape que GET).
