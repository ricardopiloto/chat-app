# Feature Specification: Ir à mensagem a partir da pesquisa

**Feature Branch**: `017-search-jump-highlight`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Vamos melhorar a pesquisa, quando o usuário selecionar o item da pesquisa, nós vamos levar ele até a mensagem exata e vamos destacar no chat qual é a mensagem em questão."

**Depends on**: [014-search-channel-scope](../014-search-channel-scope/) (pesquisa inline, hits com canal/mensagem); visualização de canal de texto existente.

## Clarifications

### Session 2026-09-04

- Q: Mensagem fora do histórico já carregado — até onde tentar? → A: Carregar histórico mais antigo até encontrar, com **limite razoável** de tentativas/páginas; se esgotar → falha US3.
- Q: Duração do destaque? → A: ~**3 segundos**, depois remove automaticamente.
- Q: Feedback quando a mensagem não é encontrada? → A: Aviso breve **não-modal** (toast/banner) + abrir o canal quando possível.
- Q: Posição da mensagem na vista após o salto? → A: **Centrar** a mensagem na área de chat (quando a altura permitir).
- Q: Remover o destaque antes dos 3 s? → A: Só após ~3 s **ou** ao seleccionar outro resultado (não por scroll/clique).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir a mensagem exacta a partir do resultado (Priority: P1)

Como membro que encontrou um resultado na pesquisa da topbar, quero **seleccionar esse resultado** e ser levado **directamente à mensagem correspondente** no canal de texto (não só à conversa genérica), para localizar o contexto sem percorrer o histórico à mão.

**Why this priority**: Hoje a selecção só abre o canal; o pedido principal é «mensagem exacta».

**Independent Test**: Pesquisar um termo conhecido → clicar num resultado → o canal de texto abre (ou fica activo) e a vista posiciona-se na mensagem desse resultado.

**Acceptance Scenarios**:

1. **Given** a pesquisa mostra pelo menos um resultado de mensagem num canal de texto, **When** selecciono esse item, **Then** sou levado ao canal correcto e a mensagem desse resultado fica **visível** e **centrada** na área de chat (quando a altura do painel o permitir).
2. **Given** já estou no mesmo canal do resultado, **When** selecciono o item, **Then** a vista desloca-se até essa mensagem sem exigir mudar de canal.
3. **Given** selecciono um resultado, **When** a navegação completa, **Then** o painel de pesquisa **recolhe** (comportamento actual de fecho ao escolher um hit) e o foco útil fica no chat.

---

### User Story 2 - Destacar a mensagem encontrada no chat (Priority: P1)

Como membro que cheguei à mensagem via pesquisa, quero que essa mensagem fique **visualmente destacada** no histórico, para eu identificar de imediato qual é a mensagem em questão entre as vizinhas.

**Why this priority**: Pedido explícito («destacar no chat»); sem destaque, o salto pode ser ambíguo.

**Independent Test**: Após seleccionar um resultado, a mensagem alvo aparece com destaque temporário claramente distinto das outras bolhas/linhas.

**Acceptance Scenarios**:

1. **Given** acabei de seleccionar um resultado de pesquisa, **When** a mensagem alvo está na vista, **Then** essa mensagem apresenta um **destaque visual** (fundo/contorno ou equivalente) distinto das restantes.
2. **Given** a mensagem está destacada, **When** passam cerca de **3 segundos**, **Then** o destaque **desaparece** sem deixar o chat «preso» num estilo permanente.
3. **Given** selecciono outro resultado a seguir, **When** a nova mensagem fica em foco, **Then** o destaque anterior deixa de aplicar-se e o novo alvo é o destacado.

---

### User Story 3 - Mensagem indisponível ou inacessível (Priority: P2)

Como membro, se a mensagem do resultado **já não existir** ou **não puder ser mostrada** (apagada, sem acesso, falha ao carregar histórico), quero um desfecho claro: chego ao canal quando possível e percebo que o salto exacto falhou, em vez de um ecrã vazio confuso.

**Why this priority**: Casos reais após apagar mensagens (011) ou histórico antigo; não bloqueia o MVP de salto+destaque no caminho feliz.

**Independent Test**: Seleccionar um hit cuja mensagem já não está disponível → canal abre (se ainda acessível) e o utilizador recebe indicação de que a mensagem não foi encontrada; sem destaque fantasma.

**Acceptance Scenarios**:

1. **Given** o resultado aponta para uma mensagem que já não existe, **When** o selecciono, **Then** entro no canal (se ainda membro) **sem** destaque de mensagem inexistente, e vejo um **aviso breve não-modal** (toast/banner) a indicar que a mensagem não foi encontrada.
2. **Given** perdi acesso ao canal/servidor, **When** selecciono o resultado, **Then** não fico num estado partido; o fluxo falha de forma compreensível (sem crash; pesquisa pode fechar).

---

### Edge Cases

- Mensagem longe no histórico: carregar histórico mais antigo **até um limite razoável** de páginas/tentativas; se a mensagem aparecer, posicionar e destacar; se o limite se esgotar sem a encontrar, seguir US3 (falha clara) — não percorrer o canal sem limite.
- Mesmo canal, mensagem já visível: recentrar se necessário + destaque (sem «flash» desnecessário de mudança de canal).
- Mensagem apagada entre a pesquisa e o clique: US3.
- Resultados rápidos consecutivos: só a última selecção manda no scroll/destaque.
- Destaque: não remover cedo por scroll ou clique; apenas timer ~3 s ou novo resultado seleccionado.
- Canal de voz: a pesquisa actual não devolve hits de voz; fora de âmbito se aparecerem.
- Viewport estreito / pesquisa recolhida: após selecção, o chat e o destaque continuam utilizáveis.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao seleccionar um item de resultado da pesquisa, a aplicação MUST navegar o utilizador para o **canal de texto** dessa mensagem e posicionar a vista de modo a que a **mensagem exacta** fique **visível** e, sempre que a altura do painel o permitir, **centrada** na área de chat.
- **FR-009**: Se a mensagem alvo não estiver na janela de histórico já carregada, a aplicação MUST tentar carregar histórico mais antigo **até um limite razoável** de tentativas/páginas; esgotado o limite sem localizar a mensagem, MUST aplicar FR-006 (sem destaque incorrecto).
- **FR-002**: Após o posicionamento bem-sucedido, a mensagem alvo MUST receber um **destaque visual temporário** claramente distinguível no histórico do chat.
- **FR-003**: O destaque MUST terminar automaticamente após cerca de **3 segundos** e MUST poder ser substituído imediatamente se o utilizador seleccionar outro resultado (o novo alvo cancela o timer do anterior). MUST NOT remover o destaque só por scroll ou clique no chat.
- **FR-004**: Se a mensagem já estiver no canal actual, a selecção MUST ainda assim posicionar e destacar essa mensagem (sem exigir mudar de canal).
- **FR-005**: O painel de pesquisa MUST **recolher** após a selecção de um resultado (paridade com o comportamento actual de fecho ao escolher um hit).
- **FR-006**: Se a mensagem não puder ser localizada ou mostrada, a aplicação MUST evitar destaque incorrecto, MUST abrir o canal quando o utilizador ainda tiver acesso, e MUST mostrar um **aviso breve não-modal** (toast ou banner equivalente) a explicar que a mensagem não foi encontrada — **sem** diálogo modal.
- **FR-007**: Esta feature MUST NOT alterar a sintaxe de pesquisa (`#canal termo`, global, atalho Ctrl/Cmd+F) definida em 014 — apenas o comportamento **após** seleccionar um resultado.
- **FR-008**: Esta feature MUST NOT exigir novos tipos de resultado de pesquisa nem pesquisa em canais de voz.

### Out of Scope

- Redesign do algoritmo de pesquisa, ranking ou snippet.
- Destacar todas as ocorrências do termo no canal (só a mensagem do hit seleccionado).
- «Jump to message» a partir de notificações ou links externos (salvo se reutilizar o mesmo mecanismo internamente sem ser aceitação).
- Alterar permissões de leitura de mensagens.

### Key Entities

- **Resultado de pesquisa (hit)**: referência a uma mensagem num canal/servidor acessível; o utilizador selecciona um hit na lista.
- **Mensagem alvo**: a mensagem exacta a tornar visível e a destacar no histórico do canal de texto.
- **Destaque temporário**: estado visual transitório na mensagem alvo após navegação a partir da pesquisa.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em **≥95%** das selecções de resultados cuja mensagem ainda existe e está acessível, a mensagem alvo fica **visível** no chat em poucos segundos após o clique (sem o utilizador ter de procurar manualmente no histórico).
- **SC-002**: Em revisão visual, **100%** das navegações bem-sucedidas mostram um destaque temporário (~3 s) na mensagem correcta (não noutra bolha adjacente).
- **SC-003**: Em teste com 5 utilizadores, **≥4** confirmam que conseguem identificar de imediato a mensagem do resultado graças ao destaque.
- **SC-004**: Quando a mensagem já não existe, **0** casos de destaque aplicado a uma mensagem errada; o utilizador vê aviso não-modal de falha em **100%** das tentativas de amostra.
- **SC-005**: Sintaxe e atalho de pesquisa de 014 permanecem utilizáveis sem regressão nos caminhos felizes actuais.

## Assumptions

- A pesquisa já devolve hits com identidade suficiente da mensagem e do canal (014); esta feature usa essa selecção.
- O destaque é **temporário** (~**3 segundos**) e auto-remove; também termina ao seleccionar outro resultado; **não** termina só por scroll/clique no chat; não é uma «marcação» permanente.
- Se a mensagem estiver fora da janela de histórico já carregada, a app carrega mais histórico **com limite** (não indefinidamente); se falhar, aplica-se FR-006 / US3. O valor exacto do limite fica para o plano de implementação.
- Recolher a pesquisa ao seleccionar um hit mantém-se intencional (foco no chat).
- Destino é sempre canal de texto (paridade com o âmbito de pesquisa actual).
- Após localizar a mensagem, a vista **centra** o alvo no painel de chat quando possível (fallback: pelo menos totalmente visível).
