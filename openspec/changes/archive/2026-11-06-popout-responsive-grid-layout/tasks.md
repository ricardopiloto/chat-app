# Tasks

## 1. Tamanho mínimo da janela de popout

- [x] 1.1 Em `frontend/electron/main.ts` (`registerPopoutIpc`), alterar `minWidth: 640, minHeight: 480` para `minWidth: 240, minHeight: 180` no `BrowserWindow` do popout, e verificar manualmente (build Electron local) que a janela do popout pode ser arrastada até esse tamanho mínimo e não encolhe mais do que isso. (minWidth/minHeight 240×180 confirmados em `frontend/electron/main.ts` (`registerPopoutIpc`))

## 2. Regra explícita de coluna única em `computeGridSize`

- [x] 2.1 Em `frontend/src/voice/gridSize.ts`, adicionar a verificação de proporção antes da maximização actual: se `n > 1` e `width / height < 0.7`, retornar `{ cols: 1, rows: n }` directamente. Estender `frontend/scripts/verify-popout-grid.mjs` (mesmo padrão de `check()` já usado nesse ficheiro) com um caso cobrindo: janela estreita/alta retorna 1 coluna (ex. `width=200, height=600, n=4`), e proporções não estreitas continuam a retornar o resultado da maximização de hoje (ex. `width=800, height=600, n=4`). Verificar rodando `npm run verify:popout-grid` (dentro de `frontend/`). (early return para width/height < 0.7 em `frontend/src/voice/gridSize.ts`; casos em `frontend/scripts/verify-popout-grid.mjs`; `npm run verify:popout-grid` passa (8/8))
- [x] 2.2 Adicionar a `frontend/scripts/verify-popout-grid.mjs` um caso para o limite `n=1`: mesmo com `width/height < 0.7`, o resultado continua `{ cols: 1, rows: 1 }` (comportamento inalterado, já que um único tile já preenche a janela independentemente da regra nova). Verificar rodando `npm run verify:popout-grid`. (caso n=1 coberto em `frontend/scripts/verify-popout-grid.mjs`; `npm run verify:popout-grid` passa (8/8))
- [x] 2.3 Adicionar a `frontend/scripts/verify-popout-grid.mjs` um caso para a transição: comparar `computeGridSize` logo acima e logo abaixo do limiar 0.7 para o mesmo `n`, confirmando que a disposição muda de múltiplas colunas para coluna única exactamente na proporção esperada. Verificar rodando `npm run verify:popout-grid` e confirmar que todas as checagens (antigas e novas) passam. (transição no limiar 0.7 coberta em `frontend/scripts/verify-popout-grid.mjs`; `npm run verify:popout-grid` passa (8/8))

## 3. Verificação visual no popout real

- [x] 3.1 Rodar o build Electron local (`npm run electron:dev` ou equivalente já usado no projecto), abrir uma chamada com 3-4 participantes (ou simulados), abrir o popout, e redimensionar a janela para estreita e alta — confirmar visualmente que os tiles empilham numa única coluna preenchendo a largura, na ordem local → remotos → partilhas de ecrã, igual à ordem já usada na grade principal hoje. (verificação visual confirmada manualmente pelo usuário no build real)
- [x] 3.2 Redimensionar a mesma janela de volta para uma proporção larga — confirmar visualmente que a grade volta a múltiplas colunas preenchendo o espaço em partes iguais, sem espaço vazio nem scroll (comportamento já existente, deve continuar intacto). (verificação visual confirmada manualmente pelo usuário no build real)
- [x] 3.3 Repetir 3.1 encolhendo a janela até perto do novo mínimo (240×180) com 2+ participantes — confirmar que nenhum tile é cortado e não aparece scroll. (verificação visual confirmada manualmente pelo usuário no build real)

## 4. Validação da spec

- [x] 4.1 Rodar `openspec validate popout-responsive-grid-layout --strict` e confirmar que a change passa sem erros. (`openspec validate popout-responsive-grid-layout --strict` passa sem erros)
