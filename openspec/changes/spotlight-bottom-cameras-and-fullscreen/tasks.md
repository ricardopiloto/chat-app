# Tasks

## 1. Faixa inferior (D1)

- [ ] 1.1 Em `frontend/src/voice.css`, trocar `.call-spotlight-layout` de `grid-template-columns: minmax(0,1fr) minmax(240px,27%)` para `grid-template-rows: minmax(0,1fr) auto` (palco principal em cima, faixa inferior em baixo), e `.call-spotlight-side` de `flex-direction: column` (com `overflow-y: auto`) para `flex-direction: row` (com `overflow-x: auto`), aplicando em qualquer largura — não só dentro de `@media (max-width:767px)`. Ajustar `.call-spotlight-side>*` (hoje `aspect-ratio:16/10; height:auto`) para uma largura fixa razoável na faixa horizontal (ex. `width:160px` ou semelhante, como já existe dentro da media query hoje). Remover ou simplificar a regra dentro de `@media (max-width:767px)` que já não é necessária por ter passado a ser o padrão; verificar que não sobra nenhuma regra duplicada ou conflituosa. Verificar visualmente (tarefa 4.1) que a faixa fica em baixo em qualquer largura testada.

## 2. Tela-cheia do tile principal (D2, D3, D4)

- [ ] 2.1 Em `frontend/src/components/ui/icon-map.ts`, confirmar que `Maximize`/`Minimize` (sem o "2") são exportações válidas de `lucide-solid` na versão instalada, acrescentar aos imports e mapear `fullscreen` → `Maximize`, `fullscreen_exit` → `Minimize`. Verificar com `npx tsc --noEmit`.
- [ ] 2.2 Em `frontend/src/voice/GridView.tsx`, `ScreenTile`: quando `props.main` é verdadeiro, acrescentar uma `ref` ao `<figure>` e um botão de tela-cheia (distinto do botão `call-spotlight` já existente, com ícone `fullscreen`/`fullscreen_exit` conforme o estado), que chama `elementoDoFigure.requestFullscreen().catch(() => {})` ou `document.exitFullscreen().catch(() => {})` conforme o estado actual. Mover o `<span class="call-chip live">` (hoje fora do `<ScreenTile main />`, em `.call-spotlight-main`) para dentro do `<figure>` desse tile, para continuar visível durante a tela-cheia (D2).
- [ ] 2.3 Sincronizar o estado do botão com `document.addEventListener("fullscreenchange", ...)` montado em `onMount`/removido em `onCleanup` enquanto o tile principal existe, comparando `document.fullscreenElement` com a `ref` do `<figure>` (D3) — nunca assumir o estado final só pela promessa de `requestFullscreen()`/`exitFullscreen()` resolvida. No `onCleanup` do tile principal, se `document.fullscreenElement` ainda for essa `ref`, chamar `document.exitFullscreen()` para não ficar "preso" em tela-cheia de um elemento removido (ex. ao desligar o destaque ou a partilha terminar enquanto em tela-cheia).
- [ ] 2.4 Acrescentar as chaves i18n novas (rótulo/aria-label do botão nos dois estados) em `frontend/src/i18n/catalogs/voice.en.ts`/`voice.pt-BR.ts`, seguindo o padrão já usado para `call.spotlightOn`/`call.spotlightOff`. Verificar com `npm run verify:i18n-keys`.

## 3. Verificação

- [ ] 3.1 Correr `npx tsc --noEmit`, `npx eslint src`, `npm run verify:i18n-keys`, `npm run build` em `frontend/`; confirmar que passam.
- [ ] 3.2 Verificar manualmente numa chamada com destaque activo: a faixa de câmaras aparece em baixo em pelo menos três larguras de janela (estreita, média, larga); o botão de tela-cheia funciona (entra e sai), a legenda e o chip "Em transmissão" continuam visíveis em tela-cheia; sair por tecla Esc actualiza o botão correctamente; desligar o destaque ou terminar a partilha enquanto em tela-cheia não deixa a página "presa" em tela-cheia.

## 4. Revisão

- [ ] 4.1 Revisão dupla (arquiteto + fullstack, skills `spec-review-architect` / `spec-review-fullstack`).
- [ ] 4.2 `openspec validate spotlight-bottom-cameras-and-fullscreen --strict`.
