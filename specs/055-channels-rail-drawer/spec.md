# Feature Specification: Drawer de canais atrás do Server Rail

**Feature Branch**: `055-channels-rail-drawer`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Vamos melhorar a funcionalidade de «Ocultar Canais»: deve funcionar como um Drawer escondido atrás do Server Rail, com uma faixa fina à vista; ao passar o rato a faixa faz enlarge; ao clicar o drawer sai e volta à posição original."

## Clarifications

### Session 2026-09-08

- Q: Âmbito do drawer atrás do rail → A: Sempre que a lista de canais possa ser ocultada, mesmo fora do palco
- Q: Como fechar o drawer aberto → A: Clique na faixa só abre; fechar só com «Ocultar canais» / controlo explícito de fecho
- Q: Onde fica a faixa fina → A: Na aresta direita do Server Rail (entre rail e área principal / lista)
- Q: Com o drawer aberto, como ocupa o espaço → A: Reflow — a lista volta a ocupar a coluna habitual; o main reduz/desloca-se
- Q: Onde vive o controlo explícito «Ocultar / Mostrar canais» → A: No cabeçalho da lista/sidebar de canais (mesmo sítio conceptual de hoje), visível em desktop com rail+lista (palco e fora)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Canais ocultos como drawer atrás do rail (Priority: P1)

Como utilizador com a lista de canais ocultável (incluindo **fora** do modo palco, sempre que o produto permita ocultar canais), quero que a lista fique **escondida atrás do Server Rail**, deixando apenas uma **faixa fina** visível, para o conteúdo principal ganhar espaço sem eu perder o acesso rápido aos canais.

**Why this priority**: É o comportamento central pedido — substitui/aperfeiçoa o «Ocultar canais» actual com a metáfora de drawer atrás do rail, em **todos** os contextos em que ocultar a lista estiver disponível.

**Independent Test**: Activar «Ocultar canais» (em palco ou noutro layout onde ocultar exista) → lista deixa de ocupar a largura normal; apenas uma faixa fina fica acessível junto ao rail; rail + main permanecem utilizáveis.

**Acceptance Scenarios**:

1. **Given** a lista de canais visível na largura normal, **When** o utilizador activa «Ocultar canais», **Then** a lista recolhe para atrás do Server Rail e só uma faixa fina permanece visível.
2. **Given** canais ocultos (drawer fechado), **When** o utilizador olha para a aresta direita do Server Rail, **Then** consegue identificar a faixa do drawer entre o rail e a área principal (não é um «buraco» invisível sem affordance).
3. **Given** canais ocultos, **When** o utilizador navega no Server Rail e no conteúdo principal, **Then** essas áreas continuam clicáveis e legíveis (o drawer fechado não bloqueia o uso do rail nem do main).

---

### User Story 2 - Hover enlarge na faixa + clique para abrir/fechar (Priority: P1)

Como utilizador com canais ocultos, quero **passar o rato na faixa** e ver um efeito de **enlarge** (a faixa cresce/destaca-se), e **clicar** para o drawer **deslizar para a posição original** (lista completa) ou **voltar a esconder-se**, para descobrir e controlar o drawer sem procurar um botão escondido.

**Why this priority**: Define a interacção pedida (hover + click); sem isto o drawer não cumpre o briefing.

**Independent Test**: Com drawer fechado → hover na faixa → enlarge; click → abre à largura/posição original; fechar apenas via «Ocultar canais» / controlo explícito (não por segundo clique na faixa nem por clique fora).

**Acceptance Scenarios**:

1. **Given** o drawer fechado, **When** o ponteiro entra na faixa fina, **Then** a faixa mostra um efeito de enlarge (aumento/destaque visível) enquanto o hover se mantém (ou até o utilizador sair, conforme o padrão visual escolhido).
2. **Given** o drawer fechado, **When** o utilizador clica na faixa (ou no affordance de abrir), **Then** o drawer anima/sai até à posição e largura originais da lista de canais **em reflow** (o main cede espaço à coluna; a lista não fica só como overlay).
3. **Given** o drawer aberto, **When** o utilizador clica de novo na zona da faixa / peeks, **Then** o drawer **não** fecha só por esse clique (fecho só por controlo explícito).
4. **Given** o drawer aberto, **When** o utilizador activa «Ocultar canais» (ou controlo explícito de fecho), **Then** a lista volta atrás do rail com a faixa fina.
5. **Given** preferência de movimento reduzido do sistema, **When** o utilizador faz hover ou abre/fecha, **Then** o feedback continua compreensível (pode ser menos animado, mas não «morto» sem affordance).

---

### User Story 3 - Persistência e descoberta do controlo (Priority: P2)

Como utilizador que volta à app, quero que o estado aberto/fechado do drawer de canais seja **lembrado** como hoje (quando aplicável), e que o botão **«Ocultar / Mostrar canais» no cabeçalho da sidebar de canais** esteja disponível em desktop com rail+lista (**palco e fora do palco**), alinhado com o novo drawer.

**Why this priority**: Evita regressão de preferências e garante um fecho/abertura explícitos descobertos (a faixa só abre).

**Independent Test**: Fechar drawer → recarregar → estado coerente; o controlo no cabeçalho da sidebar abre/fecha; a faixa fechada só abre.

**Acceptance Scenarios**:

1. **Given** o utilizador fecha o drawer de canais, **When** regressa mais tarde na mesma instância/cliente com prefs locais, **Then** o estado fechado (ou aberto) é restaurado de forma coerente com a preferência já existente do produto.
2. **Given** layout desktop com rail+lista (em palco ou não), **When** o utilizador olha o cabeçalho da sidebar de canais, **Then** encontra o controlo explícito «Ocultar / Mostrar canais» (ou equivalente) nesse sítio conceptual.
3. **Given** o drawer fechado, **When** o utilizador usa «Mostrar canais» nesse controlo, **Then** o drawer abre em reflow para a posição original.
4. **Given** o drawer aberto, **When** usa «Ocultar canais» nesse controlo, **Then** o drawer fecha atrás do rail com a faixa fina.

---

### Edge Cases

- Viewport estreita / drawer mobile já existente: esta feature foca o padrão **atrás do Server Rail** no layout em que o rail + lista coexistem; não deve partir o drawer mobile actual.
- Clique vs hover: o enlarge no hover **não** abre o drawer sozinho; só o clique (ou teclado equivalente) **abre**.
- Fecho: **não** por segundo clique na faixa nem por clique fora do drawer; só «Ocultar canais» / controlo explícito de fecho.
- Teclado: a faixa / controlo de abrir MUST ser activável por teclado (foco + Enter/Espaço), não só rato.
- Membros panel aberto: o drawer de canais não deve empurrar o layout de forma a tornar o main inutilizável.
- Conteúdo longo na lista: com drawer aberto, scroll da lista de canais continua a funcionar.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Quando «Ocultar canais» (ou equivalente) está activo — **incluindo fora do modo palco**, sempre que a lista de canais possa ser ocultada — a lista MUST comportar-se como um **drawer** posicionado **atrás do Server Rail**, não como uma coluna larga vazia no sítio habitual.
- **FR-001a**: Se hoje «ocultar canais» só existir no palco, o produto MUST tornar a ocultação (e este drawer) disponível também fora do palco nos layouts desktop com rail+lista, de forma consistente com a clarificação de âmbito.
- **FR-002**: Com o drawer fechado, MUST permanecer visível uma **faixa fina** do drawer (affordance) na **aresta direita do Server Rail** (entre o rail e a área principal / sítio da lista), suficiente para hover e clique.
- **FR-002a**: Com o drawer fechado, a faixa MUST NOT cobrir os ícones/acções principais do Server Rail de forma a impedir a selecção de servidores (o rail permanece utilizável — FR-006).
- **FR-003**: Ao **passar o ponteiro** sobre a faixa fechada, a faixa MUST aplicar um efeito de **enlarge** (crescimento ou expansão visual clara) relativamente ao estado de repouso.
- **FR-004**: Ao **clicar** (ou activar por teclado) a faixa / affordance de abertura **com o drawer fechado**, o drawer MUST **abrir** até à posição e largura originais da lista de canais, em **reflow de layout** (a coluna de canais volta a ocupar espaço; o main reduz/desloca-se — não é overlay sobre o main). Essa activação MUST NOT fechar o drawer quando já está aberto.
- **FR-005**: Ao ocultar de novo (**apenas** via comando «Ocultar canais» ou outro controlo explícito de fecho), o drawer MUST **voltar** atrás do Server Rail, deixando novamente a faixa fina. Clique fora do drawer MUST NOT fechar por omissão.
- **FR-006**: O Server Rail e a área principal MUST permanecer utilizáveis com o drawer fechado (sem overlay opaco que bloqueie o rail).
- **FR-007**: O estado aberto/fechado MUST integrar-se com a preferência existente de mostrar/ocultar canais. O controlo explícito «Ocultar / Mostrar canais» MUST viver no **cabeçalho da sidebar/lista de canais** (mesmo sítio conceptual de hoje) e MUST estar disponível em layouts desktop com rail+lista **tanto no palco como fora do palco**.
- **FR-007a**: A faixa peek MUST NOT ser o único meio de fechar; o cabeçalho MUST permanecer o meio explícito de fecho (e também pode mostrar/abrir).
- **FR-008**: Preferência de movimento reduzido: animações de enlarge/slide MUST poder reduzir-se, mantendo estados aberto/fechado e a faixa identificável.
- **FR-009**: O drawer mobile / menu estreito existente MUST continuar a funcionar; esta feature NÃO o substitui em viewports onde o padrão rail+lista lado a lado não se aplica.

### Key Entities

- **Channel drawer**: A superfície da lista de canais que pode estar **aberta** (posição original em **reflow**) ou **fechada** (atrás do Server Rail + faixa).
- **Peek strip (faixa)**: Aresta visível do drawer fechado na **direita do Server Rail** (entre rail e main), alvo de hover enlarge e de clique para abrir.
- **Server Rail**: Coluna de servidores; o drawer fecha **atrás** dela; a faixa emerge à direita do rail.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 10 activações de «Ocultar canais» (em palco **e** fora do palco, onde aplicável), 10/10 vezes a lista deixa de ocupar a largura original e só a faixa fina (mais o rail) permanece como affordance de canais.
- **SC-002**: Em 10 hovers na faixa fechada, 10/10 vezes o utilizador observa enlarge/destaque da faixa (ou equivalente estático sob movimento reduzido).
- **SC-003**: Em 10 ciclos abrir (faixa) → fechar (controlo explícito), 10/10 o drawer atinge a posição original em **reflow** ao abrir e a posição atrás do rail ao fechar.
- **SC-004**: Em 5 sessões com preferência de ocultar já gravada, 5/5 restauram um estado coerente com essa preferência após reabrir a app (mesmo cliente).
- **SC-005**: Em viewport estreita, o fluxo de menu/drawer já existente não regressa (canais e servidores continuam acessíveis).

## Assumptions

- O pedido aplica-se sempre que a lista de canais **possa ser ocultada**, **mesmo fora do palco** — não só ao modo mesa/palco. Não se aplica a ocultar canais privados por ACL (outra feature).
- Se a UI actual só expõe «ocultar» no palco, esta feature alarga a disponibilidade do ocultar+drawer (e do botão no cabeçalho da sidebar) aos layouts desktop com rail+lista.
- O controlo explícito permanece no **cabeçalho da sidebar de canais**; a faixa só abre.
- «Posição original» = largura e sítio habituais da lista de canais quando não está oculta, obtidos por **reflow** do layout (não overlay sobre o main).
- A faixa peek fica na **aresta direita** do Server Rail (entre rail e main), não na borda esquerda da app nem como overlay sobre os ícones do rail.
- Enlarge no hover não abre sozinho o drawer (só feedback visual); abertura é por activação explícita (clique/teclado) na faixa.
- Fecho é só por controlo explícito («Ocultar canais»); não por toggle na faixa nem por clique fora.
- Persistência reutiliza o mecanismo de preferência local já usado para expandir/ocultar canais no produto.
- O efeito visual (duração, pixels de enlarge) pode ser definido no plano; a spec exige que seja **percebido** como enlarge, não um valor exacto de CSS.
