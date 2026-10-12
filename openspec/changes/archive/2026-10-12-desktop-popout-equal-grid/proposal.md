# Proposal

## Why

Hoje a grade do popout (`GridView`, usada tal como está dentro de `CallPopoutWindow.tsx`) escolhe o número de colunas com uma heurística de raiz quadrada (`Math.ceil(Math.sqrt(n))`, máximo 4) e cada linha tem uma altura mínima fixa de 160px (`.call-grid{grid-auto-rows:minmax(160px,1fr)}`). Além disso, o contentor do popout (`.call-popout`) não é um contexto de esticamento (`display:block`, só `min-height:100vh`) — as filas do grid não consomem a altura real da janela, ficam ao tamanho mínimo do conteúdo. O resultado: com uma só pessoa na chamada, a câmara não enche a janela; com várias pessoas e a janela pequena, o grid não encolhe os tiles — ou sobra espaço vazio, ou aparece scroll, em vez de todos os tiles ficarem do mesmo tamanho e caberem sem cortar nada.

O utilizador pediu explicitamente, depois de validar o popout em uso real: dentro do popout, todas as câmaras devem ter o mesmo tamanho e, juntas, preencher 100% do espaço disponível na janela — dividindo esse espaço pelo número de pessoas na chamada (com câmara ligada ou não, a grade já mostra todos os participantes sem distinção, isso não muda) — encolhendo os tiles conforme a janela encolhe, em vez de cortar/fazer scroll.

## What Changes

- Dentro do popout especificamente (não na grade principal da aplicação, que mantém o seu próprio comportamento e o seu próprio caso de uso com barra lateral/chat ao lado): o número de colunas e linhas da grade passa a ser calculado a partir do tamanho real do contentor (via `ResizeObserver`), escolhendo a combinação colunas×linhas que preenche exactamente a área disponível com células todas do mesmo tamanho, sem mínimo de altura/largura fixo.
- `.call-popout`/`.call-grid-view`/`.call-grid` (CSS, só quando usados a partir do popout) passam a formar uma cadeia de esticamento real (`height:100%`/`flex`) até ao `<body>` da janela, para a grade poder efectivamente ocupar toda a janela, não só o mínimo do conteúdo.
- Sem alteração ao modo "spotlight" (ecrã partilhado em destaque) nem à grade principal da aplicação (`Stage.tsx`, layouts `mestre`/`quad`/`faixa`) — fora de escopo.

## Capabilities

### Modified Capabilities
- `frontend-v2/call-popout`: novo requisito sobre o dimensionamento da grade dentro da janela de popout — tiles de tamanho igual, preenchendo todo o espaço disponível, reduzindo de tamanho (nunca cortando nem criando scroll) conforme a janela encolhe.

## Impact

- **Frontend** (`frontend/src/voice/GridView.tsx`, `frontend/src/voice.css`, possivelmente `frontend/src/voice/CallPopoutWindow.tsx`): lógica de dimensionamento da grade específica ao contexto do popout; sem mudança de API, sem mudança de backend.
- **Sem impacto**: backend, grade principal da aplicação fora do popout, modo spotlight.
