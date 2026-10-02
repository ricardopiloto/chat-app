# Tasks

## 1. Largura e hit-testing da linha

- [x] 1.1 Dar ao `ContextMenu` um `class` opcional para o contentor e fazer a linha de canal em `shell/Sidebar.tsx` ocupar a largura do `li` (D1); verificar por medição que "geral" e um nome longo têm a mesma largura que a lista e que `/__foundation` não muda
- [x] 1.2 Tornar os controlos de renomear e opções inertes enquanto escondidos e ativos só com hover ou foco (D2); verificar com `elementFromPoint` que, sem hover, o centro do nome e a área à direita do texto devolvem o botão do canal, e que com hover a zona dos controlos devolve renomear e opções

## 2. Realce

- [x] 2.1 Realçar a linha em hover e `focus-within` e dar feedback de hover ao canal selecionado (D3); verificar a cor de fundo da linha em cada estado (normal, hover, foco, selecionado, selecionado com hover) em modo escuro e claro
- [x] 2.2 Tratar o nome longo com controlos visíveis (D4); verificar que o texto não fica ilegível por trás dos controlos e que clicar no resto do nome abre o canal

## 3. Interação e verificação

- [x] 3.1 Verificar o clique no nome, em renomear e em opções com controlos visíveis (três ações independentes), em canais de texto e de voz (com o selo "Ao vivo"), e para um utilizador sem permissão de gestão (sem controlos, mesma área clicável)
- [x] 3.2 Verificar a navegação por teclado (Tab leva ao botão do canal e depois aos controlos, Enter ativa) e o toque emulado (tocar no nome abre o canal; toque longo continua a abrir o menu de contexto)
- [x] 3.3 Verificar a gaveta abaixo de 768 px: linhas com a largura da gaveta e tocar no nome abre o canal sem ativar controlos
- [x] 3.4 Executar `tsc --noEmit`, `eslint src` e `npm run check:v1-overlap`, e confirmar que `frontend/` e o backend não foram alterados
