# Tasks

## 1. Estados visuais em `.call-control`

- [x] 1.1 Em `frontend/src/voice.css`, actualizar `.call-control` para 40×40px e adicionar `transition` (filter, box-shadow, transform) na faixa 120–160ms. Verify: botões do painel do utilizador renderizam a 40px nos dois temas.
- [x] 1.2 Adicionar `:hover:not(:disabled)` (`filter:brightness(1.08)` + `--shadow-floating`) e `:active:not(:disabled)` (`filter:brightness(.94)` + `translateY(1px) scale(.97)`) directamente em `.call-control` — o mesmo `filter`, sem receita própria por variante, cobre `.off`/`.on`/`.hangup` automaticamente por cima do fundo que cada uma já tem. Verify: hover/active visíveis em microfone, surdo, câmara, partilha de ecrã e encerrar chamada, claro e escuro, com contraste aceitável em `.on`/`.hangup` no tema claro.
- [x] 1.3 Adicionar `:focus-visible{outline:2px solid var(--primary);outline-offset:2px}` em `.call-control`, sem afectar `:focus` por clique de rato. Verify: navegar por Tab mostra o contorno; clicar com o rato não mostra.
- [x] 1.4 Envolver a parte de `transform` (deslocamento/escala do `:active`) em `@media (prefers-reduced-motion:no-preference)`, mantendo cor/sombra a transitar sempre. Verify: com "reduzir movimento" activado no SO, pressionar um botão não desloca nem reduz escala.
- [x] 1.5 Confirmar que `.call-control:disabled` continua sem hover/active (já tem `opacity:.45;cursor:not-allowed`, mas precisa do `:not(:disabled)` nas novas regras para não ganhar hover indevido). Verify: microfone desactivado (modo escuta) não reage a hover.

## 2. Botão acoplado: câmara + definições de blur

- [x] 2.1 Dentro de `.call-control-group`, para o par câmara+`.small`: remover o `gap` entre os dois (`gap:0` só nesse par, ou wrapper próprio), quadrar os cantos que se tocam (`border-radius` direito a 0 no botão da câmara, esquerdo a 0 no `.small`) e adicionar `border-left:1px solid var(--outline-variant)` no `.small`, encostado directamente (sem gap). Fixar `height:40px` explícito em `.call-control.small` (hoje só herda da base). Verify: o conjunto lê-se como um único contentor arredondado com um traço fino interno, igual ao `conceito-tokens.png`, nos dois temas.

## 3. Verificação no painel e no PiP

- [ ] 3.1 Conferir no painel do utilizador (`CallControls.tsx`) e no mini-player flutuante (`FloatingPlayer.tsx`) que os novos estados aparecem nos dois, sem quebrar os tamanhos já reduzidos do PiP (`32px`/`30px` nas media queries existentes). Verify manual, claro e escuro, largura normal e estreita.
- [ ] 3.2 Smoke manual: abrir o menu de blur, passar o cursor e pressionar cada opção dentro de `.call-menu`, confirmar que o hover existente (`background:var(--surface-container-high)`) continua a funcionar sem conflito com as novas regras de `.call-control`. Verify manual.
