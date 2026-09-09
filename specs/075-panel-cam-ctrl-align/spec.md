# Feature Specification: Controlo de câmara do painel — tamanho e alinhamento

**Feature Branch**: `075-panel-cam-ctrl-align`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Vamos ajustar o botão da camera [user-panel call-ctrl-split camera-blur] ele ainda está muito maior que os demais [mic/ensurdecer/sair 32×32]. Quando no modo palco, os ícones devem ficar alinhados (centralizados) [user-panel-calls]. A borda do ícone da camera está passando do limite do user-panel [stage-mode channels-collapsed]."

**Problem**: No painel do utilizador, o grupo câmara/blur é visualmente maior (~72×46) que microfone, ensurdecer e sair (~32×32). Em modo palco (especialmente com a lista de canais recolhida), os controlos não ficam centrados e a borda do controlo da câmara ultrapassa os limites do painel.

## Clarifications

### Session 2026-09-08

- Q: Câmara + blur no painel estreito (canais recolhidos)? → A: Manter split **horizontal** (câmara + chevron), compacto (altura dos pares) até a largura total **caber** no painel sem overflow
- Q: Onde aplicar a centragem dos ícones? → A: Centrar **só** quando o painel está em **coluna estreita** (ex. canais recolhidos); não exigir centragem em todo o modo palco com canais abertos

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Câmara com o mesmo porte dos outros controlos (Priority: P1)

Como participante numa chamada, quero que o controlo da **câmara** (incluindo o seletor de blur, se existir) tenha **altura e presença visual alinhadas** com microfone, ensurdecer e sair, para a barra de controlos parecer uniforme.

**Why this priority**: Pedido principal — o split da câmara destaca-se demais.

**Independent Test**: Em chamada com painel visível, comparar o grupo câmara com um botão vizinho (ex. microfone): mesma altura exterior; o grupo não parece «um bloco maior».

**Acceptance Scenarios**:

1. **Given** estou numa chamada com controlos no painel do utilizador, **When** comparo o grupo câmara/blur com microfone/ensurdecer/sair, **Then** a **altura exterior** do grupo câmara é a **mesma** que a dos outros botões de controlo do painel.
2. **Given** o grupo câmara inclui botão principal + chevron/menu de blur, **When** olho para a barra (incluindo painel estreito), **Then** o conjunto permanece **split horizontal compacto** — mesma altura dos pares; largura total cabe no painel sem overflow (não ~dobro da altura nem bloco desproporcional).
3. **Given** uso o chevron/menu de blur, **When** abro e escolho uma opção, **Then** a funcionalidade de blur/fundo continua utilizável via o chevron do split (não se remove nem se muda para long-press só para encolher).

---

### User Story 2 - Ícones centrados na coluna estreita (Priority: P1)

Como participante em **modo palco com o painel em coluna estreita** (ex. lista de canais recolhida), quero que os ícones de chamada fiquem **centralizados** nessa coluna, para o cartão estreito parecer equilibrado.

**Why this priority**: Pedido de alinhamento no layout estreito reportado; com canais abertos o layout largo pode manter o alinhamento horizontal actual.

**Independent Test**: Stage + channels collapsed → ícones do grupo de chamada centrados horizontalmente na coluna; com canais abertos, não é obrigatório recentrar todo o grupo.

**Acceptance Scenarios**:

1. **Given** modo palco **e** lista de canais **recolhida** (painel em coluna estreita), **When** olho para o grupo de controlos, **Then** os ícones estão **centralizados** nesse contentor/coluna.
2. **Given** modo palco **com** lista de canais **expandida** (painel mais largo / fila horizontal), **When** olho para os controlos, **Then** não é obrigatório centrar o grupo como na coluna estreita; a fila pode manter o alinhamento horizontal actual (ex. «Sair» à direita), desde que a câmara continue com a mesma altura dos pares e sem desalinhamento vertical por tamanho.

---

### User Story 3 - Sem overflow da borda no painel estreito (Priority: P1)

Como participante em modo palco com **canais recolhidos**, quero que a borda/contorno do controlo da câmara **não ultrapasse** os limites do painel do utilizador, para o chrome não «sair» do cartão.

**Why this priority**: Overflow reportado com medidas do painel estreito.

**Independent Test**: Stage + channels collapsed → borda do split/botão da câmara fica **dentro** do retângulo do `user-panel`; nenhum clip visual a «romper» a borda do cartão.

**Acceptance Scenarios**:

1. **Given** modo palco **e** lista de canais **recolhida**, **When** estou numa chamada, **Then** a borda do controlo da câmara (grupo split) **não** ultrapassa os limites do painel do utilizador.
2. **Given** o mesmo estado estreito, **When** comparo com microfone/ensurdecer/sair, **Then** todos os controlos cabem na largura útil do painel sem overflow horizontal do cartão.

---

### Edge Cases

- Menu de blur aberto: o painel flutuante do menu MAY sair do cartão (overlay); o **botão/split fechado** MUST permanecer dentro dos limites do painel.
- Aura de «a falar» no microfone: não deve forçar o grupo câmara a crescer nem a sair do painel.
- Fora da coluna estreita (painel largo / canais abertos): controlos uniformes em altura; centragem do grupo **não** é obrigatória.
- Sem câmara disponível / câmara desligada: o tamanho do controlo permanece alinhado aos pares.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: No painel do utilizador, o grupo de controlo da **câmara** (botão + chevron/blur, se presente) MUST ter a **mesma altura exterior** que os controlos de microfone, ensurdecer e sair do mesmo grupo.
- **FR-002**: O grupo câmara MUST permanecer um **split horizontal** (botão câmara + chevron) **compacto**: mesma altura dos pares (FR-001); a largura total MUST caber no painel do utilizador sem overflow (incl. canais recolhidos). MUST NOT parecer um bloco substancialmente maior que os pares.
- **FR-003**: O acesso ao menu/opções de **blur/fundo** MUST permanecer no **chevron** (ou equivalente) do mesmo split horizontal — não substituir por long-press/outro sítio só para reduzir tamanho.
- **FR-004**: Quando o painel do utilizador está em **coluna estreita** (modo palco com lista de canais recolhida, ou equivalente), os ícones/controlos de chamada MUST ficar **centralizados** no contentor do grupo. Com canais **abertos** / painel largo, a centragem do grupo **não** é obrigatória (layout horizontal actual MAY manter-se).
- **FR-005**: Em modo palco com **lista de canais recolhida**, a borda/contorno do grupo câmara (estado fechado) MUST permanecer **inteiramente dentro** dos limites do painel do utilizador — sem overflow horizontal (nem vertical) do cartão por causa desse controlo.
- **FR-006**: Microfone, ensurdecer e sair MUST continuar a partilhar o mesmo porte visual entre si; esta feature MUST NOT torná-los maiores para «igualar» a câmara — a câmara é que se alinha a eles.

### Key Entities

- **Painel do utilizador**: cartão inferior da navegação com avatar/handle e controlos de chamada.
- **Grupo de controlos de chamada**: microfone, ensurdecer, câmara (± blur), sair.
- **Modo palco**: layout em que o utilizador está no palco/voz com a navegação lateral estreita ou parcialmente recolhida.
- **Lista de canais recolhida**: estado em que a coluna de canais está oculta/colapsada, deixando o painel mais estreito.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão visual lado a lado, a altura exterior do grupo câmara coincide com a dos botões microfone/ensurdecer/sair do painel (mesmo «tile» visual).
- **SC-002**: Em modo palco com canais recolhidos (coluna estreita), um revisor confirma que os ícones do grupo de chamada estão centrados no contentor.
- **SC-003**: Em modo palco com canais recolhidos, um revisor confirma que a borda do controlo da câmara **não** ultrapassa o contorno do painel do utilizador.
- **SC-004**: Em 100% dos fluxos testados, abrir o menu de blur (se aplicável) continua possível após o ajuste de tamanho.

## Assumptions

- Os outros controlos do painel (~quadrado compacto) são a referência de tamanho; não se aumenta o painel só para caber o split antigo.
- O chevron de blur permanece no **split horizontal**; o grupo pode ser **ligeiramente** mais largo que um único botão, mas altura = pares e largura total MUST caber no painel estreito sem overflow (sem empilhar nem esconder o chevron).
- «Centralizados» aplica-se **só** à **coluna estreita** (ex. stage + canais recolhidos), no eixo horizontal do contentor dos controlos — não a todo o modo palco com canais abertos.
- Overlay do menu aberto pode escapar do cartão; o requisito de contenção aplica-se ao **controlo fechado**.
- Âmbito: painel do utilizador / controlos de chamada; não redesenhar o stage inteiro nem outros menus.
