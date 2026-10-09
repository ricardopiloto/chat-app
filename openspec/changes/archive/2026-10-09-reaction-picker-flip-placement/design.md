## Context

Ver proposal.md - Why. Estado actual: `MessageRow` renderiza `<EmojiPicker placement="below">` dentro de `.ch-react-anchor` (`position: relative`). A classe `.ch-emoji.below` aplica `top: calc(100% + 4px)`. O ancestral `.ch-scroll` tem `overflow-y: auto`, por isso um filho absoluto que ultrapassa o fundo aumenta o `scrollHeight` e o browser/utilizador acaba por rolar; e um filho que ultrapassa o topo fica cortado (overflow negativo não é rolável). A barra de acções da linha fica em `top: -16px` e só é visível com `:hover`/`:focus-within`; o picker vive dentro dela. O picker mede ~320px de largura e ~340px de altura (pesquisa + abas + grelha de 220px). O frontend não tem test runner; a convenção são scripts `scripts/verify-*.mjs` que compilam `src/chat/logic/*.ts` com esbuild (ex.: `verify-mentions.mjs`).

## Goals / Non-Goals

**Goals:** escolher acima/abaixo conforme o espaço; nunca alterar a rolagem quando há um lado com espaço; nunca cortar nem alargar a área rolável quando não há.

**Non-Goals:** portal/posicionamento flutuante genérico, colisão horizontal (largura fixa de 320px em ecrãs muito estreitos fica para outra change), alterar o picker do composer (sem `placement`, mantém o comportamento actual: acima, `bottom: 48px`).

## Decisions

### D1. Medir ao abrir, no cliente, com uma função pura
Em `src/chat/logic/popover.ts`, `pickPlacement({ below, above })` devolve `{ placement, maxHeight? }`, onde `below = scroll.bottom - anchor.bottom` e `above = anchor.top - scroll.top` (rects de `anchor` e de `anchor.closest(".ch-scroll")`; sem ancestral, usa o viewport). Regra: `below >= H` → abaixo; senão `above >= H` → acima; senão o lado com mais espaço, com `maxHeight` = esse espaço menos a margem de 4px. `MessageRow` chama-a ao abrir e guarda o resultado num sinal que fica fixo enquanto o picker está aberto (sem reposicionar durante rolagem).
- *Alternativa: sempre acima.* Simples, mas corta o picker em mensagens no topo da lista.
- *Alternativa: portal com `position: fixed` e lib de posicionamento.* Resolve tudo, mas é mais código e dependência para um caso pontual.
- *Alternativa: CSS puro (`anchor-positioning`/`position-try`).* Suporte de browsers ainda insuficiente.

### D2. A altura H é uma constante, não uma medição
`popover.ts` exporta `PICKER_HEIGHT_PX` (340) e é essa a única fonte da altura: usada na decisão e escrita pelo `EmojiPicker` na variável CSS `--ch-emoji-h` (a grelha usa `max-height: calc(var(--ch-emoji-h) - <altura fixa do cromado>)`). Não se mede `offsetHeight` após o render, porque em Solid isso exige efeito pós-montagem e reposição visível (flicker).
- *Alternativa: medir após render.* Rejeitada pelo flicker e pela complexidade.

### D3. API do `EmojiPicker` e CSS
`placement?: "above" | "below"` (substitui o actual `"below"`) e `maxHeight?: number`. Sem `placement` mantém-se o comportamento do composer (`bottom: 48px`). Na linha, a variante `.ch-emoji.above` usa `bottom: calc(100% + 4px); top: auto` (explícito, para não herdar os 48px) e `.ch-emoji.below` mantém `top: calc(100% + 4px); bottom: auto`. Com `maxHeight`, a grelha reduz o seu `max-height` e rola internamente.

## Risks / Trade-offs

- [Constante H diferente da altura real após mudanças de CSS] → H vive num só sítio e alimenta o CSS (D2); a tarefa de verificação confirma a altura real.
- [Lista mais curta que o picker] → coberto por D1: lado com mais espaço + `maxHeight`.
- [Barra de acções some se perder `:hover`/`:focus-within`] → o input do picker tem `data-autofocus`, o que mantém `:focus-within`; verificado na tarefa 1.4.
- [Picker abaixo dos rótulos de dia sticky quando abre acima junto ao topo] → verificar `z-index` (20) na tarefa 1.4.
- [Janela redimensionada com o picker aberto] → aceitável; reavalia-se na próxima abertura.

## Open Questions

Nenhuma.
