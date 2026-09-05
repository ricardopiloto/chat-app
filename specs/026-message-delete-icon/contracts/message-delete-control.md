# Contrato: Controlo apagar mensagem (ícone)

Âmbito: botão `.msg-delete` no canal de texto (`Channel.tsx`). Fluxo 011 inalterado excepto apresentação.

## Appearance

1. Controlo visível (hover/foco na mensagem) → **ícone de lixeira**; **sem** texto «Apagar» como filho do botão.
2. Ícone, fundo e borda partilham vermelho **claro** / suave (não cinza ghost; não fill `.btn-danger` saturado de Sair).
3. Válido em tema claro e escuro.

## Labels

| Surface | Value |
|---------|--------|
| Visible | Icon only |
| `title` (tooltip) | `Apagar` |
| `aria-label` | `Apagar mensagem` (keep sense) |

## Behavior (unchanged)

- Só se `canDeleteMessage(…)`
- Click → confirmação existente → delete
- Outros «Apagar» (canal/servidor/cena) fora de âmbito

## Out of scope

- Mudar copy do `confirm`
- API / permissões
- Novos fluxos de undo
