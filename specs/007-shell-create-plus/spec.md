# Feature Specification: Botões «+» para criar servidor e canal

**Feature Branch**: `007-shell-create-plus`

**Created**: 2026-09-04

**Updated**: 2026-09-04 — (1) CSS; (2) «+» secções + mínimo texto/voz; (3) voz = uma cena + manter Editar cena; multi-cena → G10

**Status**: Draft

**Input**: User description: shell «+»; mínimo texto/voz; no voz remover criar/trocar cenas mas manter Editar cena na cena actual.

## Clarifications

### Session 2026-09-04

- Q: Onde fica o «+» de criar canal? → A: *(superseded pela adenda specify)* Inicialmente cabeçalho do servidor; **substituído** por «+» em cada label de secção **Texto** e **Voz e vídeo**.
- Q: «+» de canal para quem não é dono? → A: Ocultar o «+» se o utilizador não puder criar canais
- Q: Com muitos servidores, onde fica o «+» do rail? → A: Fixo no fundo do rail (lista de servidores rola acima; «+» sempre visível)
- Q: Custódia da chave no canal de voz criado ao criar servidor? → A: Criar servidor inclui custódia; voz inicial já com chave de canal
- Q: Sem o painel de cenas, o dono ainda pode mudar o layout? → A: Sim via «Editar cena» na cena actual (única); sem criar/trocar múltiplas cenas — comportamento como uma só cena sempre

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criar servidor pelo «+» do rail (Priority: P1)

Como membro da instância, quero um «+» no rail de servidores para abrir a criação de um novo servidor, sem botão textual «Criar servidor» na coluna de canais. O servidor novo já nasce utilizável com **pelo menos um canal de texto e um de voz/vídeo**.

**Why this priority**: Único ponto de entrada para novos servidores após remover o botão antigo; o mínimo texto+voz evita servidores incompletos.

**Independent Test**: Clicar no «+» do rail → criar servidor → rail actualiza e selecciona o novo; coluna mostra secções Texto e Voz e vídeo, cada uma com ≥1 canal; sem rótulo «Criar servidor» na sidebar.

**Acceptance Scenarios**:

1. **Given** shell com rail visível (incluindo com mais servidores do que cabem no rail), **When** o utilizador observa o rail, **Then** o «+» de criar servidor está visível no fundo sem precisar de rolar até ao último ícone.
2. **Given** shell com rail visível, **When** o utilizador clica no «+» do rail, **Then** abre o fluxo de criação de servidor.
3. **Given** criação de servidor bem-sucedida (com custódia da chave do canal de voz confirmada), **When** o servidor fica seleccionado, **Then** existem **pelo menos um** canal de texto e **pelo menos um** canal de voz/vídeo com chave de canal (Gravar/Religar utilizáveis no voz inicial), e as secções **Texto** e **Voz e vídeo** estão visíveis.
4. **Given** a coluna de canais / acções, **When** o utilizador inspecciona os controlos, **Then** não existe botão rotulado «Criar servidor».

---

### User Story 2 - Criar canal pelo «+» das secções Texto / Voz e vídeo (Priority: P1)

Como dono do servidor seleccionado, quero um «+» alinhado à direita de cada label de secção (**Texto**, **Voz e vídeo**) para criar um canal **desse tipo**, sem escolher o tipo no diálogo.

**Why this priority**: Substitui «Criar canal» e remove o passo de tipo; o contexto da secção define o tipo.

**Independent Test**: Dono vê «+» em ambas as secções; «+» em Texto cria só texto; «+» em Voz cria só voz (com custódia se aplicável); membro não-dono não vê os «+»; labels das secções visíveis mesmo com lista vazia nessa secção; sem botão «Criar canal» textual.

**Acceptance Scenarios**:

1. **Given** servidor seleccionado e utilizador dono, **When** observa a navegação de canais, **Then** vê as secções **Texto** e **Voz e vídeo** sempre, cada uma com um «+» à direita do label (rótulos acessíveis, ex. «Criar canal de texto» / «Criar canal de voz e vídeo»).
2. **Given** o «+» da secção Texto, **When** completa o fluxo de criação, **Then** o novo canal é de tipo texto e aparece sob Texto; o diálogo **não** pede escolha de tipo.
3. **Given** o «+» da secção Voz e vídeo, **When** completa o fluxo (incluindo custódia de chave se voz), **Then** o novo canal é de tipo voz/vídeo e aparece sob Voz e vídeo; o diálogo **não** pede escolha de tipo.
4. **Given** utilizador que não é dono, **When** observa as secções, **Then** os «+» de criar canal **não** estão presentes (labels das secções permanecem).
5. **Given** a coluna de canais, **When** inspecciona acções, **Then** não existe botão rotulado «Criar canal».

---

### User Story 3 - Shell carrega sem erro de estilos (Priority: P1)

Como utilizador, quero que a SPA abra com o tema Mesa aplicado, sem falha de estilos.

**Why this priority**: Bloqueia toda a validação das outras histórias.

**Independent Test**: Abrir a app; UI renderiza; sem erro de sintaxe no tema Mesa no pipeline de estilos.

**Acceptance Scenarios**:

1. **Given** o servidor de desenvolvimento ou build da interface, **When** se processa o tema da shell, **Then** completa sem erro de bloco/chaveta inválida.
2. **Given** o browser, **When** a página carrega, **Then** o utilizador vê o chrome Mesa (não ecrã em branco por falha de CSS).

---

### User Story 4 - Invariante mínimo texto + voz (Priority: P1)

Como operador da instância, quero que nenhum servidor fique sem canal de texto ou sem canal de voz/vídeo, para a estrutura de secções e o produto permanecerem coerentes.

**Why this priority**: Exigência explícita do produto; afecta criação, apagar e listagens vazias.

**Independent Test**: Novo servidor já tem ≥1 de cada; tentar apagar o último texto ou o último voz falha com feedback claro; secções continuam visíveis.

**Acceptance Scenarios**:

1. **Given** um servidor com exactamente um canal de texto, **When** alguém autorizado tenta apagá-lo, **Then** a operação é rejeitada e o canal permanece.
2. **Given** um servidor com exactamente um canal de voz/vídeo, **When** alguém autorizado tenta apagá-lo, **Then** a operação é rejeitada e o canal permanece.
3. **Given** um servidor sem canais de um dos tipos (legado, se existir), **When** o dono abre a coluna, **Then** a secção correspondente continua visível (lista vazia) com «+» se for dono, para poder completar o mínimo.

---

### User Story 5 - Uma cena só: sem criar/trocar cenas; manter Editar cena (Priority: P1)

Como dono numa chamada, quero **não** poder criar nem alternar entre várias cenas por agora, mas **continuar a editar a grade** da cena actual («Editar cena»), como se o canal tivesse sempre uma única cena.

**Why this priority**: Simplifica a UI multi-cena sem perder o fluxo de composição já útil; multi-cena volta no backlog (G10).

**Independent Test**: No voz: **não** há painel «Cenas» nem acções de Cena nova / Duplicar / Activar / Apagar / Copiar quadro / lista para trocar cenas; o dono ainda tem **Editar cena**, que edita a cena/layout activos; membros vêem composição/grade actualizados após guardar.

**Acceptance Scenarios**:

1. **Given** um canal de voz/vídeo aberto, **When** o utilizador inspecciona o painel, **Then** **não** vê a área de lista/gestão multi-cena (Cenas, nova, duplicar, activar, apagar, copiar quadro, seleccionar outra cena).
2. **Given** o dono do servidor, **When** usa **Editar cena**, **Then** abre o editor da **cena actual** (activa) e ao guardar altera essa mesma cena/layout — sem escolher entre várias cenas.
3. **Given** a decisão de produto, **When** se consulta o backlog, **Then** a reposição de **múltiplas cenas** (criar/trocar) está em G10; «Editar cena» na cena única **não** é o que o backlog adia.

---

### Edge Cases

- Sem servidor seleccionado: «+» do rail disponível; «+» das secções ocultos (ou secções não aplicáveis).
- Não-dono: secções e listas visíveis; «+» de criar canal ocultos.
- Secção sem canais: label + «+» (se dono) permanecem; lista vazia sob o label.
- Apagar último canal do tipo: bloqueado (mensagem clara); regra mais específica que «último canal do servidor» — o servidor MUST manter ≥1 texto e ≥1 voz.
- Criação de voz (secção ou servidor novo): custódia de chave / checkbox permanece; texto omite esses passos.
- Criar servidor sem confirmar custódia do voz inicial: não cria o servidor (ou não conclui até confirmar).
- Modo palco / drawer: rail + coluna escondem-se juntos; ao reabrir, «+» do rail e das secções estão disponíveis conforme regras.
- Convite e rodapé: mantêm-se.
- Após correção CSS: chips/tema legíveis sem regressão grosseira.
- Multi-cena: canais com várias cenas já gravadas — a UI MUST operar só sobre a **cena activa**; MUST NOT oferecer criar/activar outra. Dados extra podem permanecer no servidor até G10.
- «Editar cena» MUST permanecer disponível ao dono e MUST editar sempre a cena/layout activos (não uma cena seleccionada na lista, porque a lista some).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O produto MUST NOT mostrar um botão com o texto «Criar servidor» na coluna de canais / acções da sidebar.
- **FR-002**: O rail de servidores MUST incluir um botão «+» **fixo no fundo do rail** (abaixo da área rolável dos ícones de servidores) que inicia a criação de um novo servidor. Com muitos servidores, a lista MUST rolar acima; o «+» MUST permanecer sempre visível no viewport do rail (quando o rail está visível).
- **FR-003**: O «+» do rail MUST ter rótulo acessível (ex. «Criar servidor») e estado visual distinto dos ícones de servidores (não selecciona servidor; abre criação).
- **FR-004**: O produto MUST NOT mostrar um botão com o texto «Criar canal» na coluna de canais / acções.
- **FR-005**: Em cada label de secção **Texto** e **Voz e vídeo**, o produto MUST mostrar (para o dono) um «+» alinhado à **direita** do label. MUST NOT colocar o «+» de criação no cabeçalho junto ao nome do servidor nem em cada linha de canal.
- **FR-006**: Os «+» de secção MUST ter rótulos acessíveis distintos por tipo. MUST ser **mostrados apenas** ao dono (ou quem já podia criar canais) com servidor seleccionado. MUST NOT aparecer para membros sem permissão.
- **FR-007**: O «+» de **Texto** MUST iniciar criação de canal **texto**; o «+» de **Voz e vídeo** MUST iniciar criação de canal **voz/vídeo**. O diálogo MUST NOT pedir ao utilizador para escolher o tipo.
- **FR-008**: As secções **Texto** e **Voz e vídeo** MUST estar sempre presentes na coluna quando há servidor seleccionado, mesmo que uma lista esteja vazia.
- **FR-009**: Todo servidor MUST ter em permanência **pelo menos um** canal de texto e **pelo menos um** canal de voz/vídeo. A criação de servidor MUST resultar nesse mínimo. O fluxo de criar servidor MUST incluir a custódia da chave do canal de voz inicial (mostrar chave + confirmação de guarda), e o canal de voz inicial MUST nascer **com** chave de canal (não legado sem chave). Apagar o último canal de um tipo MUST ser rejeitado.
- **FR-010**: Demais acções (ex. Convite) MUST permanecer excepto remoções em FR-001 e FR-004.
- **FR-011**: O tema visual da shell MUST ser válido e processável; MUST NOT deixar CSS órfão/chavetas inválidas que impeçam a interface de carregar.
- **FR-012**: Após FR-011, a SPA MUST carregar com o tema Mesa aplicado sem falha de estilos atribuível a sintaxe inválida no tema.
- **FR-013**: Fluxos de criação via «+» de secção (nome; custódia só em voz) MUST reutilizar o comportamento existente, excepto a remoção da escolha de tipo (FR-007). A criação de servidor MUST combinar nome do servidor + custódia do voz inicial + aprovisionamento texto+voz (FR-009).
- **FR-014**: No ecrã do canal de voz/vídeo, o produto MUST NOT mostrar a UI de **múltiplas cenas** (painel «Cenas», criar/duplicar/activar/apagar/copiar quadro, seleccionar outra cena). O produto MUST continuar a oferecer **Editar cena** (dono) para editar a **cena actual** / layout activo.
- **FR-015**: Nesta feature, o produto MUST comportar-se para o utilizador como se existisse **uma única cena** por canal de voz: editar a grade = editar essa cena. MUST NOT exigir apagar cenas extra no servidor. A reintrodução de criar/trocar várias cenas fica **fora de âmbito** (backlog G10).

### Out of Scope

- Reintroduzir criar/duplicar/activar/apagar/listar várias cenas e troca entre elas — **backlog G10**.
- Remover o botão/fluxo **Editar cena** da cena actual (mantém-se na 007).
- Alterar APIs de cenas para além do necessário para editar só a cena activa sem o painel multi-cena.

### Key Entities

- **Servidor**: agrupador no rail; invariante ≥1 canal texto e ≥1 voz/vídeo.
- **Canal**: texto ou voz/vídeo; tipo determinado pelo «+» da secção na criação; listado sob a secção correspondente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: **0** botões rotulados «Criar servidor» ou «Criar canal» na coluna de canais / acções (desktop e drawer).
- **SC-002**: **100%** das criações de canal pelo dono partem do «+» da secção correcta; **0%** dos diálogos de criar canal pedem escolha de tipo.
- **SC-003**: Após criar um servidor novo com custódia confirmada, **100%** têm ≥1 texto e ≥1 voz com chave de canal; Gravar não fica bloqueado só por «legado sem chave» nesse voz inicial.
- **SC-004**: Em teste de apagar o último canal de um tipo, **100%** das tentativas são rejeitadas com feedback visível e o canal permanece.
- **SC-005**: Com lista vazia numa secção, **100%** das observações ainda mostram o label dessa secção.
- **SC-006**: SPA carrega sem erro de processamento do tema Mesa em **100%** das tentativas pós-correção; UI visível em ≤5 s em rede local normal.
- **SC-008**: Com mais ícones de servidor do que cabem no rail, em **100%** das observações o «+» de criar servidor permanece visível no fundo do rail sem scroll até ao último servidor.
- **SC-009**: Em revisão do canal de voz, **0** UI de criar/trocar múltiplas cenas; o dono **consegue** abrir **Editar cena** e persistir alterações na cena activa em **100%** dos testes com permissão.

## Assumptions

- Rail da 006 permanece; só se acrescenta o «+» de criar servidor (fixo no fundo) e se remove o botão textual.
- Permissão de criar canal = dono do servidor; «+» das secções ocultos para os demais.
- Convite / rodapé mantêm-se.
- Na criação de servidor, o produto aprovisiona automaticamente um canal de texto e um de voz/vídeo (nomes razoáveis, ex. «geral» / «mesa»); o diálogo de criar servidor inclui o bloco de custódia da chave do voz inicial; sem confirmação de custódia, a criação do servidor não completa.
- Criação adicional de voz via «+» da secção mantém custódia como hoje.
- Servidores legado sem um dos tipos: secção vazia + «+» (dono) para completar; apagar respeita o mínimo por tipo assim que ambos existirem.
- Acessibilidade: cada «+» anunciável por rótulo, não só o glifo.
- Correção CSS do tema Mesa já pode estar no código; permanece no âmbito de validação desta feature (US3).
- Cenas no voz (007): UX = **uma cena**; manter **Editar cena** na activa; ocultar criar/trocar/listar. Multi-cena = G10. Dados de cenas extra no servidor podem ficar.
- Subtítulo do cabeçalho pode omitir picker de nome de cena; ocupação da grade / canal basta.