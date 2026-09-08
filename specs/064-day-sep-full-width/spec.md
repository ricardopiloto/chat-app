# Feature Specification: Separadores de dia a largura total da área de scroll

**Feature Branch**: `064-day-sep-full-width`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Faça com que as dash lines criadas em 061-channel-day-separators se extendam até o final da tela da área de scroll do canal de texto (`.text-scroll` / painel de mensagens). Outro ponto: a exibição do dia que estamos a ler (rótulo sticky) está descolada do topo da caixa de scroll e tem de ficar alinhada ao topo dessa área."

**Depends on**: [061-channel-day-separators](../061-channel-day-separators/) — separadores inline (dash line + rótulo) e sticky de dia já existentes.

**Problem**: (1) Os separadores de dia (linha + rótulo no centro) ficam limitados à coluna estreita das mensagens; num painel largo as linhas param a meio e não atravessam a área de scroll até às margens laterais. (2) O rótulo sticky do dia em leitura aparece **descolado** do topo da área de scroll, em vez de ficar **alinhado ao topo** dessa caixa.

## Clarifications

### Session 2026-09-08

- Q: O rótulo sticky do dia em leitura deve alinhar-se ao quê verticalmente? → A: Alinhado ao topo da área de scroll das mensagens (flush com o topo dessa caixa; não descolado para baixo)
- Q: Qual o estilo visual do sticky nesta feature? → A: Mantém chip/pílula compacta; só corrige alinhamento ao topo; dash lines full-width ficam só nos separadores inline
- Q: Até onde vão horizontalmente as dash lines inline? → A: Largura total da área de conteúdo do scroll **dentro** do padding lateral habitual (não coladas à borda exterior do painel)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Linha de dia a atravessar o painel de leitura (Priority: P1)

Como membro a ler um canal de texto num ecrã largo, quero que a **linha horizontal** do separador de dia se estenda de margem a margem **dentro da área de scroll das mensagens** (o painel onde o histórico desliza), com o rótulo do dia (Hoje / Ontem / data) centrado, para o corte entre dias ser óbvio em toda a largura da zona de leitura — não só na coluna estreita do texto.

**Why this priority**: Pedido central; corrige a percepção visual dos separadores já entregues em 061.

**Independent Test**: Abrir um canal de texto com ≥1 separador de dia num painel largo → as linhas à esquerda e à direita do rótulo chegam (ou quase chegam, dentro do padding habitual do painel) às bordas laterais da área de scroll; o bloco de mensagens pode continuar mais estreito/centrado sem encolher a linha.

**Acceptance Scenarios**:

1. **Given** um canal de texto com pelo menos um separador de dia e a área de scroll das mensagens mais larga que a coluna de texto das mensagens, **When** vejo o separador inline, **Then** as linhas de cada lado do rótulo estendem-se à largura do conteúdo da área de scroll (**dentro** do padding lateral habitual), e **não** param na largura máxima do corpo das mensagens nem ignoram esse padding para tocar a borda exterior do painel.
2. **Given** o mesmo canal, **When** redimensiono a janela / o painel (mais largo ou mais estreito), **Then** as linhas do separador acompanham a largura actual da área de scroll; o rótulo permanece centrado e legível.
3. **Given** o comportamento 061 (quando e como aparecem separadores, rótulos Hoje/Ontem/data, sem dias vazios), **When** esta alteração é aplicada, **Then** **não** muda a lógica de *quando* os separadores aparecem — só a **extensão horizontal** das linhas e o alinhamento vertical do sticky (US3).

---

### User Story 2 - Mensagens sem regressão de largura (Priority: P2)

Como membro, quero que o alinhamento/largura das **mensagens** continue utilizável como hoje, enquanto as **linhas** dos separadores inline passam a ser full-bleed na área de scroll.

**Why this priority**: Evita que o «full width» das linhas force mensagens a espalhar-se.

**Independent Test**: Comparar antes/depois → mensagens com a mesma coluna de leitura habitual; só as dash lines inline atravessam o painel.

**Acceptance Scenarios**:

1. **Given** um canal com mensagens longas e vários dias, **When** vejo o histórico, **Then** a largura/leitura das bolhas/linhas de mensagem **não** é forçada a preencher toda a área de scroll só por causa desta feature.

---

### User Story 3 - Sticky do dia colado ao topo da área de scroll (Priority: P1)

Como membro a fazer scroll no histórico, quero que o **rótulo do dia que estou a ler** (indicador sticky) fique **alinhado ao topo** da área de scroll das mensagens — sem espaço vazio / «descolamento» entre o topo da caixa e esse rótulo — para a referência temporal ficar ancorada ao início visível do painel.

**Why this priority**: Pedido explícito na clarificação; corrige UX do sticky 061.

**Independent Test**: Scroll no meio de um bloco de dia com sticky visível → o indicador sticky encosta visualmente ao topo interior da área de scroll (sem gap perceptível de «flutuar» abaixo do topo); regras 061 de mostrar/esconder sticky mantêm-se.

**Acceptance Scenarios**:

1. **Given** o sticky de dia está visível (inline do mesmo dia já saiu do topo), **When** observo o topo da área de scroll, **Then** o rótulo sticky (chip compacto) está **alinhado ao topo** dessa área (flush), não descolado para baixo com um vão óbvio, e **não** desenha uma dash line full-width própria.
2. **Given** as regras 061 (esconder sticky quando o separador inline desse dia está visível no topo), **When** o inline reaparece no topo, **Then** o sticky continua a esconder-se como antes; só muda o **alinhamento vertical** quando o sticky está mostrado.
3. **Given** scroll contínuo entre dias, **When** o sticky actualiza o rótulo, **Then** permanece flush ao topo da área de scroll como chip compacto.

---

### Edge Cases

- Painel estreito (largura ≈ coluna de mensagens): as linhas ainda vão até às margens da área de scroll; não devem «transbordar» para fora do painel nem gerar scroll horizontal.
- Overflow / scrollbar vertical: as linhas não devem provocar barra de scroll horizontal na área de mensagens.
- Tema claro e escuro: contraste das linhas e do rótulo mantém-se legível (sem regressão visual face a 061).
- Separador no início do histórico / único dia: mesma regra de largura total da área de scroll.
- Sticky flush: o alinhamento ao topo aplica-se à **borda superior da área de scroll**; padding lateral do painel pode continuar a existir para o conteúdo, mas o sticky não deve parecer «afastado» do topo por padding/offset vertical extra.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O produto MUST fazer com que as **linhas horizontais** dos separadores de dia **inline** se estendam à **largura total da área de conteúdo** da área de scroll do canal de texto (**dentro** do padding lateral habitual do painel), e não fiquem limitadas à largura tipográfica da coluna de mensagens quando essa coluna é mais estreita que o painel. As linhas MUST **não** colar-se à borda exterior do painel ignorando esse padding.
- **FR-002**: O rótulo do separador (Hoje / Ontem / data completa) MUST permanecer **centrado** entre as linhas esquerda e direita.
- **FR-003**: Esta feature MUST **não** alterar as regras de 061 sobre *quando* existem separadores (só dias com mensagens; Hoje/Ontem/data; sticky show/hide).
- **FR-004**: A largura típica de leitura das **mensagens** MUST permanecer independente da largura full-bleed das linhas do separador (mensagens não precisam ocupar toda a área de scroll).
- **FR-005**: As linhas MUST **não** introduzir scroll horizontal na área de mensagens nem sair visualmente para fora dessa área.
- **FR-006**: Em redimensionamento do painel, as linhas MUST acompanhar dinamicamente a largura da área de scroll.
- **FR-007**: Quando o rótulo sticky do dia em leitura estiver visível, MUST ficar **alinhado ao topo** da área de scroll das mensagens (sem descolamento vertical perceptível relativamente ao topo dessa caixa).
- **FR-008**: O sticky MUST permanecer um **chip/pílula compacta** (rótulo sem dash line full-width própria); as linhas a atravessar o painel aplicam-se aos separadores **inline**.

### Key Entities

- **Área de scroll do canal de texto**: painel de leitura onde o histórico desliza verticalmente; referência de largura para as dash lines e de topo para o sticky.
- **Separador de dia inline**: marcador (linhas + rótulo) no início de um bloco de dia com mensagens (061).
- **Rótulo sticky do dia**: indicador fixo do dia civil actualmente em vista enquanto se faz scroll (061); nesta feature deve ancorar-se ao topo da área de scroll.
- **Coluna de mensagens**: faixa mais estreita onde o corpo das mensagens é apresentado; pode ser mais estreita que a área de scroll.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Num painel de leitura claramente mais largo que a coluna de mensagens, um revisor verifica em ≤1 minuto que as linhas do separador atingem a largura do conteúdo da área de scroll (dentro do padding lateral), e não terminam na borda da coluna de texto nem na borda exterior do painel por fora do padding.
- **SC-002**: Em 100% dos casos de teste de redimensionamento (estreito ↔ largo), não aparece scroll horizontal novo na área de mensagens causado pelo separador.
- **SC-003**: Checklist visual 061 (aparecimento de separadores, rótulos relativos, sticky show/hide) permanece válido; zero regressões funcionais reportadas nesses critérios após a alteração.
- **SC-004**: Em tema claro e escuro, o separador full-width continua legível (rótulo e linhas) sem competir com o texto das mensagens.
- **SC-005**: Com sticky visível, um revisor confirma em ≤1 minuto que o rótulo está alinhado ao topo da área de scroll (sem vão vertical óbvio entre o topo da caixa e o indicador).

## Assumptions

- O âmbito é **só visual/layout** na área de scroll do canal de texto; não há novos dados, notificações ou APIs de produto.
- «Até ao final» da área de scroll = largura do **conteúdo** dessa área **dentro** do padding lateral habitual — mais larga que a coluna de mensagens, sem colar à borda exterior do painel.
- O padding interno habitual do painel de mensagens continua a definir as margens laterais das dash lines; o sticky MUST anular o descolamento **vertical** relativamente ao topo da área de scroll.
- O rótulo sticky permanece uma **pílula/chip compacta** (sem dash line full-width própria); só o alinhamento ao topo é corrigido nesta feature.
- Mensagens continuam com a coluna de leitura actual (ex.: largura máxima de leitura confortável); só as linhas do separador «escapam» dessa coluna em largura.
