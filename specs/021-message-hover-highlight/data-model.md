# Data Model: 021-message-hover-highlight

Sem persistência. Estado visual efémero do bloco de mensagem.

## `MessageTargetChrome` (CSS)

| Estado | Condição | Visual |
|--------|----------|--------|
| `idle` | Ponteiro/foco fora do bloco | Aspecto actual |
| `pointer-target` | `:hover` no `.msg-block` | Fundo `--hover`, raio, bloco completo |
| `focus-target` | `:focus-within` no `.msg-block` | Igual a `pointer-target` |
| `search-jump` | classe `.msg-highlight` (017) | Accent + anel; independente |
| `pointer-target` + `search-jump` | Hover no mesmo bloco que o salto | Ambos; salto mais saliente |

## Fora do modelo

- Avatar / nome do autor: sem estado de alvo.
- Grupo do autor (`.msg-group`): sem estado de alvo.
- `text-scroll`: contentor apenas.

## Validação

- Sair do bloco → `idle` (hover).
- Foco sai do bloco (incluindo do botão Apagar) → `idle` salvo `.msg-highlight` ainda no timer 017.
