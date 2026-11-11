# Design

## Context

Ver `proposal.md` — Why, e `propostas/controles-chamada/README.md` (fonte da proposta visual; `conceito-tokens.png` é a referência de direcção, `conceito.png` é a ilustração original antes de mapear para tokens).

Estado actual (`frontend/src/voice.css`):

```css
.call-control{display:grid;place-items:center;width:36px;height:36px;border-radius:var(--radius-md);border:0;background:var(--surface-container-high);color:var(--on-surface);cursor:pointer}
.call-control.small{width:22px;border-radius:var(--radius-sm)}
.call-control.off{background:color-mix(in srgb,var(--error) 22%,var(--surface-container-high));color:var(--error)}
.call-control.on{background:var(--secondary-container);color:var(--on-secondary-container)}
.call-control.hangup{margin-left:auto;background:var(--error-container);color:var(--on-error-container)}
.call-control:disabled{opacity:.45;cursor:not-allowed}
.call-control-group{position:relative;display:inline-flex;gap:2px}
```

Sem nenhuma regra `:hover`, `:active` ou `:focus-visible`. `.call-control` é partilhado por `CallControls.tsx` (painel do utilizador, botões 36px) e `FloatingPlayer.tsx` (PiP, com `.call-pip-controls .call-control{width:32px…}` / `30px` em media queries estreitas). O divisor entre câmara e menu de blur hoje é só um `gap:2px` dentro de `.call-control-group`, sem traço visível.

## Goals / Non-Goals

**Goals:**
- Hover, pressionado e foco pelo teclado visualmente distintos em `.call-control`, usando só tokens existentes.
- Aplicar-se igualmente ao painel do utilizador e ao PiP, sem duplicar regras.
- Respeitar `prefers-reduced-motion` (padrão já usado em `voice.css`/`entry.css`).
- Actualizar o tamanho do botão principal de 36px para 40px, conforme a tabela da proposta.

**Non-Goals:**
- Mudar `CallControls.tsx`/`FloatingPlayer.tsx` estruturalmente (markup, lógica, atalhos de teclado além do que já existe).
- Mudar o comportamento de blur, partilha de ecrã, microfone/surdo ou encerrar chamada.
- Redesenhar o menu de blur (`.call-menu`) além do necessário para o divisor junto ao botão da câmara.
- Tamanhos do PiP (`32px`/`30px`) não mudam nesta ronda — só ganham os mesmos estados visuais, na mesma proporção já aplicada hoje.

## Decisions

### D1. Estados via pseudo-classes em `.call-control`, sem markup novo

`:hover`, `:active` e `:focus-visible` adicionados directamente a `.call-control` (e variantes `.off`/`.on`/`.hangup` onde a cor de fundo já muda a base do `color-mix`), em vez de classes JS novas — os estados são puramente de interacção do ponteiro/teclado, já cobertos pelo browser, sem precisar de signals novos no SolidJS.

- `:hover:not(:disabled)` — `filter:brightness(1.08)` e sombra curta (`--shadow-floating`, já existe como token). `:active:not(:disabled)` — `filter:brightness(.94)` e `transform:translateY(1px) scale(.97)`, removendo a sombra do hover para dar sensação de "afundar". Um único mecanismo de `filter:brightness()` por cima do fundo que já estiver activo (neutro, `.off`, `.on` ou `.hangup`) substitui ter de calcular uma mistura `color-mix` própria para cada variante — `.on`/`.hangup` são cores sólidas de marca, não misturas de superfície, e recalcular uma mistura por variante arriscava contraste inconsistente entre elas e trabalho a mais para manter os dois temas sincronizados.
- `:focus-visible` — `outline:2px solid var(--primary); outline-offset:2px` (contorno separado do botão, não `box-shadow` colado, conforme o README pede "contorno externo... separado do botão"). Usar `:focus-visible`, não `:focus`, para não mostrar o contorno em cliques de rato (só teclado/leitor de ecrã).
- Guardar `:not(:disabled)` explicitamente em hover/active — browsers continuam a avaliar `:hover` em botões `disabled` por posição do ponteiro; sem essa exclusão, o estado "Indisponível" (já tratado por `.call-control:disabled{opacity:.45}`) ganharia hover indevido.

Alternativa rejeitada: `box-shadow` para simular o contorno de foco em vez de `outline` — `outline` não afecta layout e já é o padrão de acessibilidade esperado; o README pede explicitamente um contorno "separado do botão".

Alternativa rejeitada para hover/active: `color-mix` recalculado por variante — ver justificação acima.

### D2. Transições e `prefers-reduced-motion`

`transition: background-color 140ms ease, box-shadow 140ms ease, transform 140ms ease` na regra base de `.call-control` (dentro da faixa 120–160ms pedida). Envolver só a parte de `transform` (deslocamento/escala) num bloco `@media (prefers-reduced-motion:no-preference)`, mantendo cor e sombra a transitar sempre (não são consideradas "movimento"), seguindo o padrão já usado em `voice.css` (`@media (prefers-reduced-motion:no-preference){.call-tile.is-speaking{...}}`).

### D3. Tamanho do botão 36px → 40px

Só a largura/altura da variante principal (painel do utilizador) muda; as variantes do PiP (`32px`/`30px`) mantêm as proporções já definidas hoje, sem necessidade de recalcular — o README não pede mudança de tamanho no PiP, só no painel principal. `.call-control.small` (botão de definições de câmara) passa a fixar `height:40px` explicitamente (hoje herda `height:36px` da base só por omissão, sem override próprio) — ao mudar a base para 40px sem este ajuste explícito, `.small` ficaria `22×40px` sem isso ter sido decidido conscientemente; com D4 (abaixo), a altura de `.small` passa a ter de bater exactamente com a do botão da câmara de qualquer forma, por ficarem visualmente no mesmo contentor.

### D4. Botão "acoplado": câmara + definições de blur como um único contentor

A imagem de referência (`conceito-tokens.png`) mostra o botão da câmara e o botão de definições (chevron) como **um único rectângulo arredondado**, com um traço fino a separar as duas metades por dentro — não dois botões independentes lado a lado. A implementação correcta não é só adicionar uma borda ao `.small`; são três ajustes juntos, aplicados apenas ao par câmara+chevron dentro de `.call-control-group` (não a outras utilizações soltas de `.small`, se existirem):

1. **Sem espaço entre os dois:** `gap:0` nesse par específico (em vez do `gap:2px` actual do grupo), ou isolar esse par num wrapper próprio dentro de `.call-control-group`.
2. **Cantos quadrados do lado que se toca:** o botão da câmara perde o arredondamento à direita (`border-radius` direito a 0) e o `.small` perde o arredondamento à esquerda (`border-radius` esquerdo a 0) — os dois cantos exteriores mantêm `--radius-md`, para o conjunto parecer um único contentor arredondado.
3. **Divisor:** `border-left:1px solid var(--outline-variant)` no `.small`, como já proposto — agora encostado directamente ao botão da câmara (sem o `gap`), lendo-se como um traço interno, não uma linha flutuando num espaço vazio.

`--outline-variant` já é o token usado para divisores noutros pontos do mesmo ficheiro (`.call-controls{border-bottom:1px solid var(--outline-variant)}`), mantendo consistência.

### D5. Fundo do painel

O README também referencia `--surface-container-low` como "Fundo do painel" — `.call-controls` já usa um `border-bottom`, não um fundo próprio (herda do contentor pai). Fora de escopo mudar o fundo do contentor nesta proposta: o foco é nos **botões**, não no painel em si; confirmar na implementação se o contentor já usa esse token antes de considerar mudança (Non-Goal se já estiver correcto).

## Risks / Trade-offs

- [`:hover` em ecrãs tácteis pode "colar" o estado de hover após um toque em alguns browsers] → Mitigar com `@media (hover:hover) and (pointer:fine)` a envolver a regra de `:hover`, se se confirmar o problema em teste manual; não bloqueante para a primeira versão.
- [Mudar 36px → 40px pode apertar o espaço em larguras de painel estreitas] → O README já pede "ajustar a dimensão quando o painel disponível for estreito"; reaproveitar o mesmo padrão de media query já usado para `.call-pip-controls .call-control` reduzir de tamanho, aplicado ao painel principal se necessário.
- [`filter:brightness()` pode ler-se de forma pouco previsível sobre fundos já muito claros no tema claro] → Conferir visualmente hover/active de `.on`/`.hangup` no tema claro; ajustar o factor de `brightness` (não a técnica) se o contraste ficar insuficiente.

## Migration Plan

1. Actualizar `.call-control` e variantes em `voice.css` (tamanho, hover, active, focus-visible, transições, reduced-motion).
2. Adicionar divisor em `.call-control-group .small`.
3. Conferir visualmente em `CallControls.tsx` (painel) e `FloatingPlayer.tsx` (PiP) nos dois temas (claro/escuro).
4. Rollback: reverter `voice.css` para o estado anterior; nenhuma migração de dados ou API envolvida.

## Open Questions

Nenhuma bloqueante.
