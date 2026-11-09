# Review — Desenvolvedor Fullstack

**Change:** spotlight-bottom-cameras-and-fullscreen
**Data:** 2026-11-08
**Veredito geral:** Aprovado

## 1. Desenvolvimento do backend
Veredito: N/A

- Sem componente de backend.

## 2. Desenvolvimento do frontend
Veredito: OK

- Confirmei por leitura de `voice.css`: `.call-tile`/`.call-screen` já é `position: relative` (linha 29) e `.call-chip` é `position: absolute; top:8px; left:8px` por omissão, com `.call-chip.screen` à esquerda e `.call-chip.live` já definido para a direita (`right:8px`, linha 49). Mover o chip "Em transmissão" para dentro do `<figure>` (tarefa 2.2) não colide com o chip "Tela" já lá dentro — um ancora à esquerda, o outro à direita, exactamente como D2 pressupõe, sem precisar de nenhum ajuste de CSS extra para este ponto específico.
- Tarefa 1.1 (faixa inferior) é implementável como descrita — confirmei que `.call-spotlight-side` dentro do `@media (max-width:767px)` já tem a forma final pretendida (`flex-direction:row`, `overflow-x:auto`, largura fixa por item); é mesmo só promover essa regra ao caso geral e ajustar/remover a media query, sem reescrever lógica.
- Responsividade já estava no radar do `design.md` (a faixa inferior nasce precisamente de generalizar o comportamento mobile); não há lacuna aqui.

## 3. Deploy e operação
Veredito: N/A

- Sem infraestrutura, sem variável de ambiente nova.

## 4. Qualidade de código
Veredito: OK

- A tarefa 2.3 (sincronização por `fullscreenchange` + `exitFullscreen()` no `onCleanup`) está bem especificada o suficiente para codar sem ambiguidade — cobre os três casos reais (botão próprio, Esc, desmontagem do tile a meio da tela-cheia).
- Nenhum teste automatizado previsto para a Fullscreen API — correcto: é uma API do browser difícil/impossível de exercitar fielmente num ambiente de testes headless sem um browser real com permissão de utilizador; a tarefa 3.2 (verificação manual) é o lugar certo para isto, como o projecto já faz para outras interacções de browser que dependem de gesto do utilizador.
- Organização: tudo cabe em `GridView.tsx`/`voice.css`/`icon-map.ts`/catálogos i18n já existentes, sem refactor novo.

## 5. Execução das decisões arquiteturais
Veredito: OK

- `tasks.md` segue D1-D4 fielmente, sem reabrir nenhuma decisão.

## Bloqueantes antes de implementar
- Nenhum.

## Limitações técnicas a reportar ao Arquiteto
- Nenhuma.

## Revisão pós-implementação (2026-11-09)
**Veredito geral:** Aprovado, com um ajuste cosmético recomendado antes da verificação manual

- Conferido no diff real: o botão de tela-cheia (`.call-fullscreen`) e a sincronização de estado estão em `ScreenTile` (`GridView.tsx`), guardados por `if (!props.main) return;` dentro do `onMount` — tiles normais da grade e partilhas secundárias não ganham listener nem botão, como o Non-Goal exige.
- `verify:i18n-keys`, `tsc --noEmit`, `eslint src` e `build` passaram conforme a saída registada pelo Codex; nenhum teste automatizado foi criado para a Fullscreen API, como já previsto nesta revisão antes da implementação (API de gesto do utilizador, não exercitável de forma fiel em ambiente headless).
- Código organizado dentro dos arquivos já previstos, sem refactor fora de escopo.
- **Achado (cosmético, não bloqueante):** `.call-fullscreen` não está agrupado visualmente com `.call-spotlight` na legenda — ver detalhe no parecer do Arquiteto. Recomendo corrigir antes da tarefa 3.2 para a verificação manual já testar o layout final, mas não é um bloqueante de arquitetura nem de lógica.

## Bloqueantes antes de arquivar
- Nenhum.
