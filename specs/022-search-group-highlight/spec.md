# Feature Specification: Destaque do grupo na pesquisa

**Feature Branch**: `022-search-group-highlight`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Vamos melhorar o destaque das mensagens resultantes das pesquisas. Ao invés de destacar só a mensagem, nós vamos destacar [o bloco msg-group — avatar + meta + mensagens daquele grupo visual]."

**Depends on**: [017-search-jump-highlight](../017-search-jump-highlight/) (salto + destaque temporário a partir da pesquisa); [014-search-channel-scope](../014-search-channel-scope/) (hits). Relacionado mas **distinto** de [021-message-hover-highlight](../021-message-hover-highlight/) (hover no ponteiro — não altera este pedido).

## Clarifications

### Session 2026-09-04

- Q: Ênfase extra na mensagem do hit dentro do grupo? → A: Só o grupo destacado (sem estilo extra na bolha do hit).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Destacar o grupo visual da mensagem encontrada (Priority: P1)

Como membro que seleccionei um resultado da pesquisa e fui levado à mensagem, quero que o **grupo visual completo** dessa mensagem (avatar, nome/hora e o bloco da conversa daquele autor naquele agrupamento — o contentor `msg-group`) fique destacado, e não só a linha/bolha isolada da mensagem, para eu reconhecer imediatamente o contexto do hit.

**Why this priority**: Pedido explícito a melhorar o destaque de 017; o alvo visual passa do bloco da mensagem individual para o grupo.

**Independent Test**: Pesquisar → clicar num hit → a mensagem fica centrada/visível e o **grupo** (avatar + meta + conteúdo do grupo) mostra o destaque temporário; as mensagens noutras linhas/grupos não.

**Acceptance Scenarios**:

1. **Given** selecciono um resultado de pesquisa cuja mensagem está num grupo com avatar e meta visíveis, **When** o salto completa, **Then** o destaque visual aplica-se ao **grupo inteiro** (incluindo avatar e linha de nome/hora), não apenas à linha de texto da mensagem.
2. **Given** o grupo está destacado, **When** passam cerca de **3 segundos** (mesmo temporizador de 017), **Then** o destaque do grupo desaparece.
3. **Given** selecciono outro resultado a seguir, **When** o novo salto completa, **Then** o destaque sai do grupo anterior e passa ao grupo da nova mensagem alvo.

---

### User Story 2 - Grupo com várias mensagens do mesmo autor (Priority: P1)

Como membro, se o hit aponta para uma mensagem no meio de um grupo com várias mensagens seguidas do mesmo autor, quero que **todo esse grupo** fique destacado (não só a bolha do hit), para o destaque coincidir com a unidade visual que leio no chat.

**Why this priority**: É o caso em que «só a mensagem» vs «o grupo» mais se nota; clarifica o âmbito do destaque.

**Independent Test**: Hit numa mensagem que partilha grupo com outras do mesmo autor → o grupo completo (todas as bolhas daquele agrupamento) recebe o destaque; o scroll continua a tornar a mensagem do hit reconhecível (centrada quando possível).

**Acceptance Scenarios**:

1. **Given** um grupo com duas ou mais mensagens do mesmo autor e o hit é a segunda, **When** salto via pesquisa, **Then** o destaque cobre o grupo completo (avatar, meta e todas as mensagens daquele grupo), não só a segunda — **sem** ênfase visual adicional exclusiva na bolha do hit.
2. **Given** o mesmo cenário, **When** o salto completa, **Then** a mensagem do hit continua **visível** e **centrada** na área de chat quando a altura o permitir (comportamento de posicionamento de 017 mantém-se; só muda o alvo do estilo de destaque).

---

### User Story 3 - Paridade com falhas e regressões de 017 (Priority: P2)

Como membro, quero que os casos de falha e as regras de duração/substituição de 017 continuem a valer, só com o destaque no grupo: sem destaque fantasma se a mensagem não existe; toast quando o salto falha.

**Why this priority**: Evita regressão do fluxo já aceite; escopo é o alvo visual, não reabrir política de seek/toast.

**Independent Test**: Hit para mensagem apagada → toast, sem grupo destacado; hit válido → grupo destacado ~3 s.

**Acceptance Scenarios**:

1. **Given** a mensagem do hit já não existe, **When** selecciono o resultado, **Then** vejo o aviso breve não-modal de 017 e **nenhum** grupo fica destacado.
2. **Given** um grupo destacado pela pesquisa, **When** faço scroll ou clico noutro sítio do chat (sem novo hit), **Then** o destaque **não** desaparece antes do temporizador (~3 s) ou de um novo resultado seleccionado (mesma regra de 017).

---

### Edge Cases

- Grupo com uma só mensagem: o destaque do grupo e o da «mensagem só» coincidem visualmente — aceitável.
- Mensagem muito alta / grupo alto: centrar a mensagem do hit (017); o estilo cobre o grupo mesmo que parte fique fora do viewport.
- Sobreposição com hover futuro (021): o destaque de **pesquisa** (temporário no grupo) e o de **hover** (ponteiro) devem permanecer distinguíveis se ambos existirem; esta feature **não** redefine o hover.
- Canal de voz / hits sem mensagem: fora de âmbito (igual 017).
- Dois hits no mesmo grupo seguidos: reaplicar destaque no mesmo grupo (reiniciar timer) é correcto.
- Sem ênfase secundária na bolha do hit: o único estilo de destaque de pesquisa é o do grupo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Após um salto bem-sucedido a partir da pesquisa (017), o sistema MUST aplicar o destaque visual temporário ao **contentor de grupo** da mensagem alvo (a unidade que inclui avatar, meta e as mensagens daquele agrupamento), e MUST NOT limitar o destaque apenas ao bloco individual da mensagem.
- **FR-001a**: O sistema MUST NOT aplicar um estilo de destaque de pesquisa adicional/exclusivo à bolha da mensagem do hit dentro do grupo; o grupo é o **único** alvo do estilo.
- **FR-002**: A duração, substituição por novo hit, e a regra de não limpar por scroll/clique MUST permanecer as de 017 (~3 s; novo resultado substitui).
- **FR-003**: O posicionamento da vista MUST continuar a centrar a **mensagem** do hit (quando a altura permitir), mesmo que o estilo de destaque cubra o grupo.
- **FR-004**: Se a mensagem não for encontrada, MUST NOT destacar nenhum grupo; manter o feedback de falha de 017.
- **FR-005**: O destaque de pesquisa MUST ser visualmente reconhecível no tema claro e escuro.
- **FR-006**: Esta feature MUST NOT alterar o comportamento de hover sobre mensagens (âmbito de 021), nem a lógica de pesquisa/hits (014), excepto o alvo do estilo de destaque no salto.

### Key Entities

- **Message group (visual)**: Agrupamento consecutivo de mensagens do mesmo autor no histórico (avatar + meta + uma ou mais mensagens). É o alvo do destaque desta feature.
- **Search hit / jump target**: Mensagem identificada pelo resultado da pesquisa; define qual grupo destacar e onde centrar a vista.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão visual após saltar de um hit, o utilizador identifica o alvo pelo destaque do **grupo** (avatar/meta incluídos) em ≤1 s de olhar para a área de chat.
- **SC-002**: Em grupos com ≥2 mensagens, 100% das mensagens desse grupo partilham o mesmo destaque de pesquisa enquanto o temporizador corre, **sem** estilo extra só na mensagem do hit.
- **SC-003**: O destaque de pesquisa desaparece automaticamente em ~3 s sem acção extra, ou ao seleccionar outro hit.
- **SC-004**: Hits para mensagens inexistentes não deixam nenhum grupo destacado; o aviso de falha de 017 continua a aparecer.
- **SC-005**: Em teste manual, o scroll ainda coloca a mensagem do hit visível/centrada como em 017.

## Assumptions

- O agrupamento visual actual do chat (várias mensagens do mesmo autor no mesmo grupo) é a definição de «grupo» — não se inventa um novo modelo de agrupamento.
- Duração e regras de limpeza herdam 017; não se reabre clarificação de timer.
- Centrar a mensagem do hit (não necessariamente o centro geométrico do grupo) é suficiente; a identificação visual do hit dentro do grupo faz-se pela posição na vista, não por um segundo estilo.
- Melhorias de hover (021) são um produto separado; se ambas estiverem activas, estilos devem poder coexistir sem esta spec detalhar o CSS do hover.
- Sem alterações de API, pesquisa ou permissões.
