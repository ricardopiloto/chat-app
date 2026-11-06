# Proposal

## Why

A janela de popout do Mesa (chamada de voz/vídeo numa janela do SO separada) tem hoje um tamanho mínimo de 640×480, bem maior do que o necessário — a grade em modo `fill` já não tem nenhum piso de altura de linha (`grid-auto-rows:unset`) e já se redimensiona para preencher a janela, então o único obstáculo a uma janela mais pequena é a restrição imposta no `BrowserWindow`. Além disso, o algoritmo actual de disposição da grade (`computeGridSize`) escolhe o número de colunas só por maximizar o tamanho do tile, sem nenhuma regra explícita para janelas estreitas e altas — ao contrário do Discord, que nesse formato empilha as câmaras numa única coluna vertical. O resultado hoje é incidental (às vezes cai em 1 coluna, às vezes não) e não é uma garantia testável.

## What Changes

- Reduzir o tamanho mínimo da janela de popout (`frontend/electron/main.ts`, `BrowserWindow` de `registerPopoutIpc`) para um valor bem menor que 640×480, alinhado ao precedente já usado para a janela de selecção de ecrã (480×360) mas ainda mais pequeno, permitindo uma coluna única e estreita de tiles.
- Tornar explícita e determinística a regra de disposição em coluna única: quando a proporção da área da grade do popout for estreita e alta (acima de um limiar definido), o sistema SHALL dispor todos os tiles numa única coluna vertical, em vez de deixar isso como efeito incidental do algoritmo de maximização actual.
- Manter a ordem de exibição dos tiles na coluna única igual à ordem já usada na grade hoje (participante local primeiro, depois participantes remotos na ordem já exposta pelo LiveKit, depois partilhas de ecrã) — sem introduzir rastreamento de timestamp de entrada por participante (ver decisão registada em `design.md`).
- Continuar a recalcular a disposição (colunas/linhas, ou coluna única) sempre que o tamanho da janela ou o número de participantes mudar, como já acontece hoje.

## Capabilities

### Modified Capabilities

- `frontend-v2/call-popout`: o requisito "A grade do popout divide o espaço disponível em partes iguais" passa a incluir uma regra explícita de coluna única para janelas estreitas/altas, e o tamanho mínimo da janela de popout diminui.

## Impact

- `frontend/electron/main.ts` — `minWidth`/`minHeight` do `BrowserWindow` do popout (dentro de `registerPopoutIpc`).
- `frontend/src/voice/gridSize.ts` — `computeGridSize`, para adicionar a regra explícita de coluna única por proporção.
- `frontend/src/voice/GridView.tsx` — consumo do resultado de `computeGridSize` (sem mudança de ordenação dos `<For>` existentes).
- Sem impacto em backend, API, ou formato de mensagens.
