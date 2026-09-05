# Data model: 022-search-group-highlight

Sem persistência. Estado de UI (igual 017, alvo alterado).

## SearchJumpHighlight (runtime)

| Campo | Tipo | Notas |
|-------|------|--------|
| `highlightedEl` | `HTMLElement \| undefined` | Agora o **`.msg-group`**, não `.msg-block` |
| `highlightTimer` | timeout id | `HIGHLIGHT_MS` = 3000 |
| Jump target message id | string (query) | Usado para achar o bloco e depois o grupo |

## Message group (visual)

| Relação | Descrição |
|---------|-----------|
| Contains | 1 avatar, 1 meta, N `.msg-block` (`data-message-id`) |
| Highlight | Classe `msg-highlight` no grupo quando jump OK |

## Rules

- Apply highlight only if message element found **and** `closest(".msg-group")` succeeds.
- On clear/replace: remove class from previous group only.
- Never add `msg-highlight` to `.msg-block` for search jumps.
