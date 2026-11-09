# Design

## Context

`frontend/src/voice/GridView.tsx` já tem o destaque (spotlight) implementado: `focused()` (memo) decide se há uma partilha promovida; quando sim, renderiza `.call-spotlight-layout` com `.call-spotlight-main` (a partilha, via `<ScreenTile share={main()} main />`) e `.call-spotlight-side` (as restantes câmaras/partilhas). O layout é só CSS (`voice.css:84-95`): hoje colunas (`grid-template-columns`), com uma variante em linhas já existente só para `@media (max-width:767px)`. Nenhum ficheiro do projecto usa a Fullscreen API (`requestFullscreen`/`fullscreenElement`/evento `fullscreenchange`) hoje — confirmado por `grep -rl`.

## Goals / Non-Goals

**Goals:**
- Faixa de câmaras/partilhas secundárias na parte inferior do destaque, em qualquer largura de janela, não só no mobile.
- Tela-cheia real do navegador para o tile principal do destaque, com ícone e rótulo distintos do alternador de destaque já existente.
- Estado de tela-cheia sempre correcto mesmo quando a saída não passa pelo botão (tecla Esc, gesto do sistema operativo).

**Non-Goals:**
- Tela-cheia para tiles da grade normal (sem destaque) ou para partilhas secundárias dentro do destaque — só o tile principal.
- Mudar o comportamento da vista de Composição (não tem destaque).
- Suportar os prefixos antigos `webkitRequestFullscreen`/`mozRequestFullScreen` (a API sem prefixo já cobre os browsers com que o Electron e os browsers modernos do projecto funcionam; registado como risco menor, não como trabalho desta change).

## Decisions

### D1: Faixa inferior é só CSS — promover o layout móvel ao padrão

`.call-spotlight-layout` passa de `grid-template-columns: minmax(0,1fr) minmax(240px,27%)` para `grid-template-rows: minmax(0,1fr) auto` (palco principal em cima, faixa em baixo) em qualquer largura; `.call-spotlight-side` passa de `flex-direction: column` para `flex-direction: row` com scroll horizontal, exactamente a regra que hoje só existe dentro de `@media (max-width:767px)`. Remover essa media query (ou reduzi-la a ajustes finos de tamanho, se precisarem) — o layout que antes era só do mobile passa a ser sempre o layout do destaque. Sem mudança de DOM/estrutura, só de CSS — `GridView.tsx` não precisa de alteração para este ponto.

### D2: Tela-cheia aplica-se ao `<figure>` do tile principal, não só ao `<video>`

`document.documentElement.requestFullscreen()`/`element.requestFullscreen()` pode ser chamado em qualquer elemento; esse elemento (e os seus descendentes) ocupa o ecrã. Chama-se no `<figure class="call-tile call-screen is-main">` do `ScreenTile` principal (precisa de uma `ref` nova só nesse tile), não no `<video>` interno — para que a legenda (`figcaption`) e o chip "Em transmissão" (`.call-chip.live`, hoje fora do `<figure>`, em `.call-spotlight-main`, ver nota abaixo) continuem visíveis durante a tela-cheia, consistente com o cenário "mantendo visível a legenda e o indicador de transmissão em curso" do spec delta.

**Nota de implementação**: hoje `<span class="call-chip live">` está fora do `<ScreenTile main />>`, como irmão dentro de `.call-spotlight-main` (`GridView.tsx:96`). Para ficar visível durante a tela-cheia do `<figure>`, mover este chip para dentro do `<figure>` (ex. como mais um filho, ao lado do chip "Tela" já existente) — pequeno ajuste de estrutura, sem mudar o que o chip mostra.

### D3: Estado de tela-cheia sincronizado pelo evento `fullscreenchange`, não por um sinal local isolado

Um `createSignal<boolean>(false)` local ao `ScreenTile` principal, actualizado num listener de `document.addEventListener("fullscreenchange", ...)` montado só enquanto esse tile existe (`onMount`/`onCleanup`), que compara `document.fullscreenElement` com a `ref` do próprio `<figure>`. Isto cobre todas as formas de saída (botão próprio, tecla Esc, gesto do sistema) com uma única fonte de verdade — nunca assumir que `requestFullscreen()`/`exitFullscreen()` resolvido implica o estado final (pode ser rejeitado pelo browser, ex. sem interacção do utilizador), só o evento decide o estado mostrado.

Se o tile principal deixar de existir enquanto está em tela-cheia (a pessoa desliga o destaque, ou a partilha termina, no meio da tela-cheia), o `onCleanup` do componente desmontado deve chamar `document.exitFullscreen()` se `document.fullscreenElement` ainda for esse elemento — evita ficar "preso" em tela-cheia de um elemento que o DOM já removeu.

### D4: Ícones novos, distintos do alternador de destaque já existente

`frontend/src/components/ui/icon-map.ts` ganha `fullscreen` → `Maximize` e `fullscreen_exit` → `Minimize` (sem o "2", distintos de `Maximize2`/`Minimize2` já usados por `open_in_full`/`close_fullscreen`, o alternador de destaque). Confirmar que `Maximize`/`Minimize` existem como exportações de `lucide-solid` na versão instalada antes de os importar (o padrão já usado no resto do ficheiro é `grep` pelo nome antes de acrescentar ao bloco de imports).

## Risks / Trade-offs

- A reversão do requirement de fidelidade ao mockup (D1, câmaras na coluna lateral direita) é deliberada e já registada no `proposal.md`/spec delta — qualquer auditoria futura de fidelidade visual deve saber que esta divergência é intencional, não uma regressão esquecida.
- A Fullscreen API pode ser rejeitada pelo browser fora de um gesto directo do utilizador (ex. chamada programática sem clique); como o botão novo só é accionado por clique directo, este risco é baixo, mas o tratamento de erro (`.catch()` na promessa de `requestFullscreen()`) deve existir para não deixar uma promessa rejeitada sem tratamento.
- Electron (desktop): a janela principal já não é maximizada pelo SO (`electron-custom-title-bar`); a Fullscreen API do conteúdo web é independente disso e deve funcionar normalmente dentro da janela, mas vale confirmar visualmente nas três plataformas como parte da verificação manual desta change.
