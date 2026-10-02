# Design

## Context

Ver `proposal.md` para a motivação e as medições. A linha de canal é `ChannelRow` em `shell/Sidebar.tsx`: `li > ContextMenu > div.group > (button de navegação | input de renomear) + span de controlos`. O `ContextMenu` (`components/ui/Overlay.tsx`) envolve os filhos num `div.context-target`, e `components/ui.css` define `.context-target { relative inline-flex }`. Como é `inline-flex`, o contentor, e com ele a linha, encolhe ao conteúdo (89 px para "geral" numa lista de ~224 px). O realce `hover:bg-surface-container` já está na linha, por isso cobre só essa largura.

Os controlos são `absolute right-1 top-1/2` com `opacity-0` e `group-hover:opacity-100 focus-within:opacity-100`. `opacity: 0` não tira o elemento do hit-test, de modo que, sem hover, `elementFromPoint` sobre o nome devolve "Renomear canal" ou "Definições do canal". Em linhas encolhidas os controlos ocupam quase toda a linha.

O requisito existente "Renomear canal" não define a área realçada nem a prioridade do clique. O `ContextMenu` só é usado na sidebar e na página `/__foundation`.

## Goals / Non-Goals

**Goals:**
- A linha do canal ocupa a largura da lista, com o mesmo realce e a mesma área clicável para qualquer nome.
- Controlos escondidos não recebem ponteiro; visíveis, não escondem o nome de forma ilegível.
- Realce coerente em hover, foco por teclado e canal selecionado.

**Non-Goals:**
- Alterar o conjunto de ferramentas, as permissões ou o fluxo de renomeação.
- Alterar a navegação por teclado ou os destinos de navegação dos canais.
- Redesenhar o menu de contexto (botão direito e toque longo continuam como estão).

## Decisions

### D1 — Corrigir a largura na origem, sem mudar o `ContextMenu` para todos
O `ContextMenu` passa a aceitar um `class` opcional para o contentor. A sidebar passa `w-full` (e a linha `w-full`/`flex-1`) para ocupar a largura do `li`. O padrão `.context-target` continua `inline-flex`, para a página de fundação ficar igual. **Alternativas:** mudar `.context-target` para `flex` (afeta todos os usos); seletor `:has` só na sidebar (acopla CSS a estrutura). Escolhida a prop de classe por ser local e explícita.

### D2 — Controlos escondidos sem ponteiro
Os controlos ganham `pointer-events-none` por omissão e `group-hover:pointer-events-auto` e `focus-within:pointer-events-auto` quando visíveis. Mantêm-se focáveis por teclado (o foco já os revela). **Alternativa:** `invisible`/`hidden` fora do hover, que os tiraria da ordem de tabulação. Rejeitada: o teclado precisa de lá chegar.

**Refinamento na implementação (toque):** o toque aplica `:hover` antes do clique, por isso só `pointer-events-none` não bastava: tocar na zona dos controlos abria a renomeação. Em dispositivos sem nenhum ponteiro com hover (`@media (any-hover: none)`) os controlos ficam inertes e invisíveis, e continuam alcançáveis por teclado (o foco volta a mostrá-los e a ativá-los) e pelo toque longo (menu de contexto). Escolheu-se `any-hover` e não `hover`: um computador híbrido com rato e ecrã tátil ainda tem hover. O ambiente de teste (Chromium sem cabeça) reporta `any-hover: none`, por isso a verificação lança o browser com `--blink-settings` para definir as capacidades do ponteiro.

### D3 — Foco e estado selecionado
O realce da linha passa a usar também `focus-within`. O canal selecionado mantém `bg-surface-container-high` e ganha um realce de hover mais forte em vez de nenhum. Os tokens vêm de `tokens.css`; nenhum valor novo.

### D4 — Nome longo
Os controlos ficam sobrepostos à direita; o nome já trunca com reticências. Quando os controlos aparecem, o botão de navegação reserva espaço à direita para o texto não ficar atrás deles (padding só no hover/foco, para não saltar a largura do texto fora dele). **Alternativa:** manter só a sobreposição com fundo opaco (como hoje). Aceitável como fallback se a reserva de espaço pesar.

### D5 — Verificação por hit-testing
A verificação mede, no browser de teste, a largura da linha, o que `elementFromPoint` devolve no nome, à direita do texto e na zona dos controlos, com e sem hover e com toque emulado, e a cor de fundo da linha nos estados. Não depende de captura de ecrã subjetiva.

## Risks / Trade-offs

- **A linha inteira parecer clicável incluindo os botões de gestão** → os botões ficam visualmente distintos (fundo próprio) e cada ação tem comportamento independente.
- **`pointer-events-none` esconde os controlos de leitores de ecrã?** Não: o elemento continua na árvore de acessibilidade e na ordem de tabulação; só deixa de receber ponteiro.
- **Toque**: sem hover, só o toque longo (menu de contexto) chega às ações de gestão, como hoje; fica registado como comportamento esperado.
- **Alterar um componente partilhado** → a prop é opcional e o valor por omissão não muda; a página de fundação serve de verificação de regressão.

## Open Questions

- Nenhuma que mude o que será construído. O fallback de D4 pode ser decidido na implementação conforme o resultado visual.
