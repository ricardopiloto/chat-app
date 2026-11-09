# Proposal

## Why

Na vista de Grade (`frontend/src/voice/GridView.tsx`), quando uma partilha de tela é promovida a destaque (spotlight), as câmaras dos outros participantes vão hoje para uma coluna lateral **direita** (`.call-spotlight-side`, `grid-template-columns: minmax(0,1fr) minmax(240px,27%)` em `voice.css:84`), tirando largura horizontal da área de visualização da partilha. O utilizador quer essa faixa na parte **inferior** da tela, para dar mais área à partilha, e uma opção de pôr a partilha em destaque em tela-cheia real do navegador.

## What Changes

- Em destaque, a faixa de câmaras/partilhas secundárias passa da lateral direita para a parte inferior da tela — o projecto já tem exactamente este layout (linha inferior, faixa horizontal com scroll) como alternativa em viewport estreito (`voice.css:95`, `@media (max-width:767px)`); esta change torna-o o padrão em qualquer largura, não só no mobile.
- O tile principal do destaque ganha um botão de tela-cheia real (Fullscreen API do navegador — é o primeiro uso desta API no projecto), separado e com ícone distinto do botão já existente que liga/desliga o destaque (esse já usa os ícones `open_in_full`/`close_fullscreen`, mapeados para `Maximize2`/`Minimize2`; o botão novo usa `Maximize`/`Minimize`, sem o "2", para não colidir visualmente nem semanticamente com o botão de destaque).
- Escopo: só o tile principal do destaque na vista de Grade. A vista de Composição não tem conceito de destaque (iniciar uma partilha nela já muda automaticamente para Grade, comportamento de `improve-call-view-controls`, inalterado); os tiles normais da grade e as partilhas secundárias (não promovidas) não ganham botão de tela-cheia.
- **BREAKING (fidelidade visual):** `openspec/specs/frontend-v2/voice-grid/spec.md`, requirement "Grade e partilha fiéis aos mockups", fixa explicitamente "as câmaras SHALL ficar numa coluna lateral direita" como parte da fidelidade ao mockup original. Esta change diverge disso deliberadamente, por pedido directo do utilizador — mesmo padrão de reversão explícita já usado em `electron-custom-title-bar` para outro requirement aceite.

## Capabilities

### Modified Capabilities
- `frontend-v2/voice-grid`: os requirements "Destaque (spotlight) de uma partilha de ecrã" e "Grade e partilha fiéis aos mockups" passam a especificar a faixa inferior (não lateral) e a acrescentar a opção de tela-cheia no tile principal.

## Impact

- `frontend/src/voice/GridView.tsx`: botão de tela-cheia no `ScreenTile` principal, estado sincronizado com o evento `fullscreenchange` do documento (cobre a saída por Esc nativa do navegador).
- `frontend/src/voice.css`: `.call-spotlight-layout`/`.call-spotlight-side` passam de colunas para linhas (o `@media (max-width:767px)` que já tinha este layout pode ser simplificado ou removido, já que passa a ser o comportamento em qualquer largura).
- `frontend/src/components/ui/icon-map.ts`: duas entradas novas (`fullscreen`→`Maximize`, `fullscreen_exit`→`Minimize`).
- `frontend/src/i18n/catalogs/voice.en.ts`/`voice.pt-BR.ts`: chaves novas para os rótulos do botão de tela-cheia.
