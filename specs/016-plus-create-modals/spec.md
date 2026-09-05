# Feature Specification: Modais de criação (+) alinhados ao tema

**Feature Branch**: `016-plus-create-modals`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Vamos atualizar todos os \"Modals\" que aparecem quando o usuário clica em + para criar novos canais. O modal deve refletir o estilo visual da aplicação e o tema escolhido."

**Depends on**: [007-shell-create-plus](../007-shell-create-plus/) (fluxos «+»); [013-topbar-scene-ux](../013-topbar-scene-ux/) (tema claro/escuro canónico na topbar).

## Clarifications

### Session 2026-09-04

- Q: Restilizar só os modais «+» ou o Dialog partilhado? → A: Restilizar o Dialog partilhado (todos os diálogos herdam estilo Mesa + tema); aceitação continua focada nos «+».
- Q: Com o modal aberto, mudar o tema actualiza já? → A: Actualização ao vivo com o modal aberto (tokens ligados ao tema do shell).
- Q: O alinhamento inclui os campos do formulário? → A: Dialog + inputs/labels/erros dos formulários de criação via «+».
- Q: Os estilos de input são partilhados na app ou só dentro do modal? → A: Tokens/classes de input partilhados (herança app-wide); aceitação foca-se nos «+».

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Modal de criar canal com o look da Mesa (Priority: P1)

Como dono/administrador que clica em **+** junto a **Texto** ou **Voz e vídeo**, quero que o diálogo de **criar canal** use o mesmo estilo visual da aplicação (superfícies, tipografia, botões, raios, espaçamento) — e não um formulário genérico que pareça de outro produto.

**Why this priority**: Pedido explícito; o «+» é o caminho principal de criação; inconsistência visual quebra a confiança na marca.

**Independent Test**: Abrir «Criar canal de texto» e «Criar canal de voz e vídeo» via + → o overlay e o painel batem visualmente com o shell (tokens de painel, botões pílula/primário, tipografia); conteúdo e acções (nome, criar/cancelar) permanecem utilizáveis.

**Acceptance Scenarios**:

1. **Given** sou dono e clico **+** em Texto, **When** o modal abre, **Then** o fundo/overlay e o cartão do diálogo usam as cores e raios do design da Mesa (não um branco/cinza genérico desalinhado).
2. **Given** o modal de criar canal de voz está aberto, **When** observo título, **campos**, labels e botões, **Then** tipografia e controlos (incluindo inputs) seguem o mesmo sistema do resto do shell.
3. **Given** o modal está aberto, **When** cancelo ou fecho (clique fora / Escape, se suportado), **Then** o comportamento de fecho existente mantém-se e o shell por baixo continua legível.

---

### User Story 2 - Modal respeita o tema claro/escuro (Priority: P1)

Como utilizador com tema **claro** ou **escuro** escolhido, quero que o modal de criar canal **acompanhe o tema actual** (contraste, fundos, texto, bordas), sem ficar «preso» a um tema único ou ilegível no outro.

**Why this priority**: Pedido explícito; o tema é preferência de primeira classe (013); um modal só-escuro no tema claro (ou o inverso) é falha visível.

**Independent Test**: Alternar tema na topbar → abrir de novo o modal + de criar canal → superfícies e texto legíveis em ambos os temas; contraste adequado em títulos, labels, inputs e botões.

**Acceptance Scenarios**:

1. **Given** o tema actual é escuro, **When** abro criar canal via +, **Then** o modal usa fundos/texto/bordas do tema escuro e permanece legível.
2. **Given** o tema actual é claro, **When** abro o mesmo modal, **Then** o modal usa o tema claro (não permanece com aparência só-escura).
3. **Given** o modal de criar canal está aberto, **When** altero o tema na topbar, **Then** o modal **actualiza de imediato** (fundos, texto, bordas) para o novo tema, sem precisar de fechar e reabrir.

---

### User Story 3 - Criar servidor via + com o mesmo tratamento (Priority: P2)

Como utilizador que clica no **+** do rail de servidores para **criar servidor**, quero o mesmo alinhamento visual e de tema, para que todos os diálogos disparados por «+» de criação partilhem uma família visual.

**Why this priority**: O pedido fala em canais; o + de servidor é o irmão imediato no mesmo padrão de criação — incluir evita um modal «órfão» a seguir.

**Independent Test**: Abrir «Criar servidor» pelo + do rail → mesmo sistema visual/tema que os modais de canal.

**Acceptance Scenarios**:

1. **Given** clico no + do rail para criar servidor, **When** o modal abre, **Then** o estilo e o tema coincidem com os modais de criar canal actualizados nesta feature.

---

### Edge Cases

- Modal aberto + troca de tema: o visual do diálogo actualiza ao vivo (sem exigir fecho).
- Modal aberto em viewport estreito: conteúdo scrollável ou compacto; botões de acção acessíveis; sem cortar o título.
- Erros de validação (nome vazio, falha de rede): mensagens de erro legíveis em ambos os temas.
- Backdrop: clique fora fecha se já era o comportamento; contraste do overlay adequado em claro e escuro.
- Foco: trap/foco inicial no campo de nome (ou no título) mantém-se acessível; Escape fecha se já suportado.
- Não regressar campos/fluxos de criação (tipo implícito por secção Texto vs Voz; custódia/chave no servidor) — só apresentação.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Os diálogos abertos ao clicar **+** para **criar canal de texto** e **criar canal de voz/vídeo** MUST usar o sistema visual da Mesa (cores de painel, tipografia, raios, botões) alinhado ao restante do shell.
- **FR-007**: O alinhamento visual MUST ser aplicado no **componente/padrão de diálogo partilhado** da app, de modo a que outros diálogos que o usam herdem o mesmo estilo e tema (sem exigir redesenho individual nesta feature).
- **FR-002**: Esses diálogos MUST reflectir o **tema actual** do utilizador (claro e escuro), com texto e controlos legíveis em ambos, **incluindo enquanto o diálogo está aberto** (mudança de tema na topbar actualiza o visual do modal ao vivo).
- **FR-008**: A apresentação do diálogo MUST usar tokens/variáveis de tema do shell (não cores fixas de um único tema), de forma a que a troca de tema propague sem remount obrigatório.
- **FR-003**: O diálogo de **criar servidor** aberto pelo **+** do rail MUST receber o mesmo tratamento visual e de tema (família «criação via +»).
- **FR-004**: O comportamento funcional de criação (campos, validações, pedidos ao servidor, tipo implícito por secção) MUST permanecer equivalente ao actual — esta feature NÃO altera regras de negócio de criação.
- **FR-005**: Inputs, labels, títulos, mensagens de erro e acções (Criar / Cancelar ou equivalentes) nos formulários de criação via **+** MUST manter hierarquia visual clara e estados hover/focus/disabled/erro coerentes com o design system da app (não inputs «browser default» desalinhados do shell).
- **FR-006**: Esta feature MUST NOT exigir novos endpoints de backend.
- **FR-009**: O alinhamento dos controlos de formulário nos modais «+» MUST cobrir pelo menos nome (e quaisquer campos já existentes nesses formulários); NÃO introduz campos novos.
- **FR-010**: O alinhamento dos inputs MUST usar **tokens/classes de formulário partilhados** do shell (não um tema de input exclusivo só nos modais «+»), de modo a que controlos `.input` (ou equivalente) herdem o estilo Mesa + tema em toda a app.

### Out of Scope

- Redesenhar conteúdo/copy/fluxos de diálogos que não sejam de criação via **+** (logout, E2EE, convite, etc.) — podem herdar o visual do Dialog partilhado, mas não entram nos critérios de aceitação desta feature.
- Novos campos no formulário de criar canal/servidor.
- Alterar permissões (quem pode criar).
- Animações elaboradas ou wizard multi-passo.

### Key Entities

- **Modal de criação (+)**: superfície de diálogo (overlay + painel) para criar canal ou servidor, disparada pelos controlos «+».
- **Tema da interface**: claro | escuro; preferência do utilizador já existente.
- **Sistema visual Mesa**: tokens de cor, raio, tipografia e botões já usados no shell autenticado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão lado a lado (tema escuro e claro), **100%** dos modais de criar canal via + são reconhecíveis como parte da Mesa (sem contraste «página HTML crua» vs shell).
- **SC-002**: Em **ambos** os temas, um revisor consegue ler título, **campo de nome**, labels e botões principais sem falha de contraste óbvia (texto ilegível sobre o fundo do modal ou input).
- **SC-003**: Em teste com 5 utilizadores donos, **≥4** não descrevem o modal de criar canal como «fora do resto da app» após a mudança.
- **SC-004**: **0** regressões de fluxo: criar canal texto/voz e criar servidor pelo + continua a concluir com sucesso nos caminhos felizes actuais.
- **SC-005**: Com o modal de criar canal aberto, alternar o tema actualiza a aparência do modal de imediato em **100%** das tentativas de amostra (sem fechar/reabrir).

## Assumptions

- Os diálogos de criação usam o **Dialog partilhado**; esta feature actualiza esse padrão visual (tokens/classes) para Mesa + tema; outros consumidores herdam sem ser o foco da aceitação.
- O tema aplica-se via o mesmo mecanismo já usado no shell; o modal herda tokens (não cores hardcoded de um único tema) para actualizar ao vivo.
- «Estilo visual da aplicação» = direcção Nocturne / Mesa já presente no shell (protótipo v2 e CSS actual), não um redesign paralelo.
- Incluir criar servidor via + evita inconsistência imediata; outros Dialogs herdam o visual do componente partilhado, mas não são o foco dos cenários de aceitação.
- Os formulários de criação via + (nome e campos já existentes) entram no alinhamento visual; sem campos novos.
- Inputs usam classes/tokens **partilhados** do shell (herança app-wide), alinhado à abordagem do Dialog partilhado.
