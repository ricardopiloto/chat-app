# Design

## Context

O popout é uma `BrowserWindow` do Electron (`frontend/electron/main.ts`, `registerPopoutIpc`, linhas ~306-364), criada hoje com `minWidth: 640, minHeight: 480`. Nada na CSS do modo `fill` impõe um piso adicional — `.call-grid.is-fill` já usa `grid-auto-rows:unset` (ver `frontend/src/voice.css`), ao contrário do modo normal que tem `minmax(160px,1fr)`. O único obstáculo à janela mais pequena é, portanto, o valor no construtor do `BrowserWindow`.

A disposição dos tiles é calculada em `frontend/src/voice/gridSize.ts` (`computeGridSize(n, width, height)`), que testa todo `cols` de 1 a N e escolhe o que maximiza `min(width/cols, height/rows)`. Esse valor é lido por `GridView.tsx` via um `ResizeObserver` que só está activo quando `props.fill` é verdadeiro (isto é, só no popout) e alimenta as variáveis CSS `--cols`/`--rows`. Hoje, para uma janela estreita e alta, o algoritmo *pode* convergir para `cols=1` (porque isso maximiza o tamanho do tile nesse caso), mas isso é um efeito incidental da fórmula de pontuação, não uma regra garantida — para alguns N e proporções intermédias o algoritmo pode preferir 2 colunas mesmo com a janela bastante estreita. Ver `openspec/changes/archive/2026-10-12-desktop-popout-equal-grid/` para o histórico da implementação actual.

A ordem de renderização dos tiles (`<For each={talkers()}>` seguido de `<For each={screens()}>` em `GridView.tsx`) já coloca o participante local primeiro (de `snapshot()` em `callSession.tsx`), seguido dos remotos na ordem que `room.remoteParticipants` (um `Map` do LiveKit) expõe — sem timestamp de entrada explícito. Decisão do utilizador (ver proposal.md): manter essa ordem como está, sem adicionar rastreamento de ordem de chegada real.

## Goals / Non-Goals

**Goals:**
- Reduzir o `minWidth`/`minHeight` do popout para 240×180.
- Tornar a disposição em coluna única uma regra explícita e determinística, baseada na proporção da área da grade, em vez de um efeito incidental do algoritmo de maximização.
- Preservar o comportamento já especificado de "partes iguais preenchendo a janela" para os casos em que a grade não está em coluna única.

**Non-Goals:**
- Não introduzir rastreamento de timestamp de entrada por participante (ordem de chegada real) — fica fora de escopo por decisão do utilizador.
- Não alterar o comportamento do modo não-`fill` (a vista "Grade" da janela principal), que continua a usar o piso de 160px e não é afectado por este limiar.
- Não alterar a disposição quando há uma partilha de ecrã em destaque (palco principal + faixa lateral) — esse modo é regido pela spec `frontend-v2/voice-grid` e não entra no escopo desta change.

## Decisions

### D1. Limiar de proporção para coluna única: 0.7 (largura/altura)

`computeGridSize` passa a verificar, antes de testar as colunas, se `width / height < 0.7` e `n > 1`; se sim, retorna `{ cols: 1, rows: n }` directamente, sem correr a maximização. 0.7 foi escolhido porque:
- É estreito o suficiente para não disparar em janelas moderadamente altas onde 2 colunas ainda dão tiles razoáveis (ex. 2 colunas de participantes quadrados).
- É largo o suficiente para cobrir o caso do Discord na imagem de referência (janela claramente mais alta que larga).
- É um valor único e simples de testar/ajustar; não há requisito do utilizador para um valor exacto, por isso foi tratado como detalhe menor de implementação, documentado aqui em vez de na spec como um número "mágico" incontestável — a spec descreve o comportamento (proporção abaixo de 0.7), que é o nível certo de detalhe para um requisito testável.

Alternativa considerada: usar `@container` CSS queries em vez de um cálculo em JS. Rejeitada porque a disposição já depende de um valor computado em JS (`computeGridSize`, consumido via custom properties `--cols`/`--rows`) para o requisito de "partes iguais" existente; adicionar uma segunda fonte de verdade (regra CSS separada para coluna única) criaria dois caminhos a manter em sincronia. Manter tudo em `computeGridSize` é uma mudança de poucas linhas no ponto onde a decisão já é tomada.

### D2. Manter a ordem actual dos tiles (sem join-order real)

Confirmado com o utilizador: a coluna única usa a mesma ordem já produzida por `talkers()` seguido de `screens()` em `GridView.tsx` — nenhuma mudança de ordenação é necessária, só a disposição em coluna muda. Isto evita tocar em `callSession.tsx`/`people.ts` e mantém o escopo da change restrito à disposição da grade.

### D3. Tamanho mínimo de 240×180

Metade, aproximadamente, do mínimo já usado para a janela de selecção de ecrã (480×360, `frontend/electron/main.ts` linhas ~236-237), mantendo a mesma proporção 4:3. Pequeno o suficiente para uma coluna estreita de tiles continuar legível (tile de ~160-200px de largura com barra de título/bordas do SO descontadas), sem chegar a um tamanho degenerado onde os controlos nativos da janela (fechar/arrastar) ficam impraticáveis.

## Risks / Trade-offs

- [Oscilação perto do limiar 0.7 ao redimensionar manualmente a janela] → Como a troca só acontece em resposta a um resize explícito do utilizador (não há transição animada nem redimensionamento automático), uma pequena alternância entre 1 coluna e múltiplas colunas perto do limiar é equivalente ao que já acontece hoje entre, por ex., 2 e 3 colunas — comportamento aceitável, sem necessidade de histerese adicional.
- [Janela muito pequena (perto de 240×180) com muitos participantes torna cada tile ilegível] → Já é o comportamento aceite hoje para muitos participantes em qualquer tamanho de janela (a spec existente exige preencher sem scroll, não exige um tamanho mínimo de tile); nenhuma mitigação nova é necessária nesta change.
- [Mudança no `minWidth`/`minHeight` do Electron não tem teste automatizado prático] → Validado manualmente (ver tasks.md), como já é o padrão para mudanças de configuração de janela neste projecto (ver changes arquivadas de popout anteriores).
