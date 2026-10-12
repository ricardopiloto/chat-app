# Design

## Context

Ver `proposal.md` — Why. Pontos de código que ancoram este design:

- `frontend/src/voice/GridView.tsx:49`: `--cols` é hoje `Math.min(4, Math.max(1, Math.ceil(Math.sqrt(talkers().length + screens().length))))` — heurística fixa, sem olhar para o tamanho real do contentor, aplicada tanto na grade principal da aplicação como (indirectamente, porque `CallPopoutWindow.tsx` renderiza `<GridView/>` sem alterações) no popout.
- `frontend/src/voice.css:83`: `.call-grid{...grid-template-columns:repeat(var(--cols,2),minmax(0,1fr));grid-auto-rows:minmax(160px,1fr)}` — cada linha tem um mínimo fixo de 160px; se o contentor for mais baixo do que `linhas × 160px`, a grade excede o espaço disponível em vez de encolher.
- `frontend/src/voice.css:209`: `.call-popout{min-height:100vh;...}` — `display` por omissão (`block`), só com `min-height`. Como `.call-grid-view` (linha 82) e `.call-grid` (linha 83) já são `flex:1 1 auto;min-height:0`, mas o pai (`.call-popout`) não é um contexto flex com altura definida, esse `flex:1` não tem nada para esticar — a grade fica à altura mínima do próprio conteúdo (os 160px por linha), nunca enche a janela.
- `frontend/src/chat/ChannelPage.tsx:154`: padrão já usado no projecto para `ResizeObserver` inline dentro de um `onMount`/`onCleanup`, sem nenhuma biblioteca de utilidades — a seguir aqui, não se introduz nenhuma dependência nova.

## Goals / Non-Goals

**Goals:**
- Dentro do popout, sem ecrã partilhado em destaque: todos os tiles do mesmo tamanho, preenchendo toda a área disponível da janela, recalculado em tempo real conforme a janela é redimensionada ou o número de participantes muda.
- Zero mudança de comportamento na grade principal da aplicação (fora do popout) e no modo "spotlight" do próprio popout — ambos mantêm exactamente o CSS/heurística actuais.

**Non-Goals:**
- Mudar o layout do modo spotlight (ecrã partilhado em destaque) dentro do popout — a coluna lateral de câmaras mantém o seu `aspect-ratio` fixo actual (`voice.css:87`).
- Mudar `Stage.tsx` ou os layouts `mestre`/`quad`/`faixa` da grade principal da aplicação.
- Tornar o tamanho-mínimo de legibilidade (nome, vídeo) configurável — se a janela ficar pequena a ponto de dificultar a leitura, isso é aceite (ver Risks), por instrução explícita do utilizador.

## Decisions

### 1. Um prop `fill` em `GridView`, não um componente novo

`GridView` ganha um prop opcional `fill?: boolean` (nome a confirmar na implementação), passado **incondicionalmente** por `CallPopoutWindow.tsx` (`<GridView fill/>`) — quem decide se o spotlight está activo é o próprio `GridView` (sinal interno `spotlight`/memo `focused()`), que `CallPopoutWindow` não vê de fora, por isso não pode ser ele a decidir quando passar o prop. Dentro de `GridView`, o modo `fill` só tem efeito quando `props.fill && !focused()` — ou seja, só no ramo da grade simples, nunca no ramo spotlight (ver Decisão 3 para como isto se reflecte no CSS). Fora do popout (uso actual em `Stage.tsx`/resto da aplicação), o prop simplesmente não é passado — nada muda, mesma heurística `sqrt`, mesmo CSS `minmax(160px,1fr)`.

Alternativa descartada: duplicar `GridView` num componente `PopoutGrid` próprio. Rejeitada — duplicaria a renderização de `Tile`/`ScreenTile`/modo spotlight, que teria de ser mantida sincronizada à mão nos dois sítios para qualquer mudança futura (ex. nova badge num tile). Um prop no componente existente é a mudança mais pequena que ainda isola completamente o comportamento por contexto.

### 2. Colunas escolhidas por medição real do contentor, maximizando o lado menor da célula

Com `ResizeObserver` (mesmo padrão inline de `ChannelPage.tsx:154`, sem nova dependência) a medir a caixa de conteúdo do elemento `.call-grid` sempre que o tamanho muda, e com N = número de tiles (participantes + ecrãs partilhados, inalterado): para cada `cols` de 1 a N, `rows = Math.ceil(N / cols)`, pontuação = `Math.min(largura/cols, altura/rows)` — o lado menor da célula resultante. Escolhe-se o `cols` com a maior pontuação (em caso de igualdade, o menor `cols`, para não oscilar entre duas opções igualmente boas num redimensionamento contínuo).

Isto garante sempre `cols × rows` suficiente para os N tiles e escolhe, entre as combinações possíveis, a que deixa os tiles mais próximos de um formato equilibrado (evita colunas finíssimas numa janela larga e baixa, ou linhas finíssimas numa janela estreita e alta) — sem depender de nenhum breakpoint fixo.

Alternativa descartada: *container queries* CSS (`@container`) com breakpoints de largura. Rejeitada — a escolha óptima depende de duas dimensões (largura e altura) e de N ao mesmo tempo; expressar isso em regras CSS por breakpoint exigiria uma combinatória de regras escritas à mão por cada N provável, sem cobrir o caso geral, e N já é um valor calculado em JS (contagem de participantes).

### 3. CSS: cadeia de esticamento real condicionada ao modo `fill`, sem tocar no spotlight

**Achado das revisões (`review-architect.md` e `review-fullstack.md`)**: `.call-popout` envolve o `<GridView/>` sempre que há uma chamada activa — tanto no ramo da grade simples como no ramo spotlight (ambos dentro do mesmo `.call-grid-view`, filho directo de `.call-popout`, em `CallPopoutWindow.tsx`/`PopoutStage`). Mudar `.call-popout` para `height:100vh;display:flex;flex-direction:column` sem condição aplicar-se-ia também ao spotlight (que tem a mesma `flex:1 1 auto` hoje sem nada para esticar), contradizendo o `Non-Goal` desta própria change de deixar o spotlight inalterado. Correcção:

- `GridView` aplica `classList={{ "is-fill": props.fill && !focused() }}` no elemento raiz `.call-grid-view` — a classe só existe quando `fill` está activo **e** não há nenhum ecrã em destaque.
- `voice.css` ganha `.call-popout:has(> .call-grid-view.is-fill){height:100vh;display:flex;flex-direction:column}` (selector `:has()`, suportado pela versão do Chromium empacotada com Electron ^38 já usada no projecto) — só quando o filho directo tem essa classe é que `.call-popout` deixa de ser `min-height:100vh;display:block` (comportamento actual, preservado em todos os outros casos, incluindo spotlight). O spotlight dentro do popout fica assim pixel-a-pixel como está hoje — nem melhora nem piora com esta change, exactamente como o `Non-Goal` pede.
- Nova classe `.call-grid.is-fill{grid-auto-rows:unset;grid-template-rows:repeat(var(--rows,1),minmax(0,1fr))}` substitui, só quando `fill` está activo (mesma condição `props.fill && !focused()`), o `grid-auto-rows:minmax(160px,1fr)` por linhas exactas sem mínimo — `--rows` vem do mesmo cálculo da Decisão 2. `grid-template-columns` continua a reutilizar `repeat(var(--cols,2),minmax(0,1fr))`, só alimentado pelo `--cols` novo em vez da heurística `sqrt`.
- `gap:8px`/`padding:6px` de `.call-grid` mantêm-se inalterados em modo `fill` — são espaçamento visual entre tiles, não "espaço vazio sobrante"; o pedido do utilizador é sobre os tiles serem iguais e preencherem o resto, não sobre remover a respiração visual entre eles.

## Risks / Trade-offs

- [`ResizeObserver` a disparar em cada pixel durante um arrasto de redimensionamento da janela pode causar recomputação frequente] → Mitigação: o cálculo em si é aritmética simples (percorrer no máximo N opções de `cols`), sem trabalho pesado nem rede — mesmo perfil de custo do `ResizeObserver` já em uso em `ChannelPage.tsx`; não é necessário debounce.
- [Com muitos participantes numa janela de popout pequena, os tiles podem ficar pequenos a ponto de dificultar ler nomes/vídeo] → Mitigação: aceite deliberadamente — é exactamente o comportamento pedido ("se a janela ficar muito pequena, reduzimos o tamanho... para manter a regra de tamanhos iguais"); o utilizador controla o tamanho da janela.
- [A pontuação `min(largura/cols, altura/rows)` pode empatar entre dois valores de `cols` para certos N e janelas quase quadradas] → Mitigação: desempate deterministico pelo menor `cols` (Decisão 2) evita alternância/flicker entre duas disposições igualmente boas durante um redimensionamento contínuo.

## Migration Plan

Aditivo e isolado por prop: `fill` por omissão ausente/`false` mantém a grade principal da aplicação pixel-a-pixel igual a hoje. Aplica-se ao popout de imediato, sem depender de nenhuma outra change em curso.
