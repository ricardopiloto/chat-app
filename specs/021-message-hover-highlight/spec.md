# Feature Specification: Destaque ao pairar na mensagem de texto

**Feature Branch**: `021-message-hover-highlight`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Quando o usuário passar o mouse sobre uma mensagem no canal de texto, dê um destaque a mensagem (o conjunto inteiro … text-scroll …), para garantir que ele está selecionado a mensagem desejada."

**Depends on**: visualização de canal de texto existente; [011-text-message-delete](../011-text-message-delete/) (hover já revela «Apagar» na mesma unidade); [017-search-jump-highlight](../017-search-jump-highlight/) (destaque temporário após salto da pesquisa — distinto deste).

## Clarifications

### Session 2026-09-04

- Q: Pairar no avatar ou no nome do autor destaca alguma mensagem? → A: Não. Só o bloco da mensagem sob o ponteiro (texto, anexos, «Apagar»); avatar/nome sozinhos não destacam nada.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver claramente qual mensagem está sob o ponteiro (Priority: P1)

Como membro a ler o histórico de um canal de texto, quero que a **mensagem completa** sobre a qual o ponteiro está (texto, anexos e o resto daquela unidade — não só uma linha de palavras) fique visualmente destacada, para eu ter a certeza de qual é a mensagem alvo (por exemplo antes de apagar).

**Why this priority**: Pedido explícito; hoje o hover só mostra «Apagar» sem marcar o corpo da mensagem, o que é fácil de errar quando há várias bolhas seguidas.

**Independent Test**: Abrir um canal de texto com várias mensagens; passar o rato sobre uma → essa unidade inteira destaca-se; ao sair, o destaque some; as vizinhas não ficam destacadas.

**Acceptance Scenarios**:

1. **Given** um canal de texto com pelo menos duas mensagens visíveis na área de histórico, **When** coloco o ponteiro sobre uma delas, **Then** essa mensagem (o bloco completo daquela mensagem, incluindo anexos/pré-visualizações se existirem) mostra um destaque de fundo/contorno distinto das restantes.
2. **Given** o ponteiro sobre uma mensagem, **When** o movo para outra, **Then** o destaque passa só para a nova; a anterior volta ao aspecto normal.
3. **Given** o ponteiro sai da lista de mensagens (ou daquela unidade), **When** já não está sobre nenhuma mensagem, **Then** nenhum destaque de hover permanece.
4. **Given** várias mensagens seguidas do mesmo autor no mesmo grupo visual, **When** pairar sobre uma delas, **Then** destaca-se **essa** mensagem, não o grupo inteiro do autor.
5. **Given** o ponteiro sobre o **avatar** ou o **nome** do autor (fora de qualquer bloco de mensagem), **When** não está sobre o corpo/anexos/«Apagar» de uma mensagem, **Then** nenhuma mensagem fica com destaque de hover.

---

### User Story 2 - O destaque de hover não se confunde com o da pesquisa (Priority: P2)

Como membro que acabei de saltar para uma mensagem pela pesquisa, quero continuar a reconhecer o destaque da pesquisa (~3 s) e, se pairar noutra mensagem, ver o hover nessa outra, sem o histórico parecer «tudo seleccionado».

**Why this priority**: Já existe um destaque de salto (017); misturá-los quebraria SC da pesquisa e a leitura do hover.

**Independent Test**: Saltar para uma mensagem via pesquisa (destaque de salto visível) e pairar noutra mensagem da lista → estilos distinguíveis; ao sair do hover, o salto (se ainda no temporizador) mantém-se na mensagem da pesquisa.

**Acceptance Scenarios**:

1. **Given** uma mensagem com destaque de salto da pesquisa activo, **When** pairar **nessa** mesma mensagem, **Then** continua a ser reconhecível como o alvo da pesquisa (o hover pode reforçar, mas não substitui o significado do salto).
2. **Given** destaque de salto numa mensagem A, **When** pairar na mensagem B, **Then** B mostra hover e A continua a mostrar o destaque de salto (se o temporizador ainda não acabou).

---

### User Story 3 - Teclado e foco alinhados ao hover (Priority: P2)

Como membro que uso teclado (ou foco no bloco para chegar a «Apagar»), quero o mesmo tipo de destaque na mensagem focada, para o alvo não depender só do rato.

**Why this priority**: «Apagar» já aparece em foco no bloco; o destaque deve seguir a mesma unidade, senão rato e teclado divergem.

**Independent Test**: Focar um bloco de mensagem (Tab / foco no bloco) → destaque equivalente ao hover; ao sair do foco, some (salvo destaque de pesquisa 017).

**Acceptance Scenarios**:

1. **Given** um bloco de mensagem focável, **When** o foco está nesse bloco (incluindo foco no botão «Apagar»), **Then** essa mensagem mostra o mesmo tipo de destaque de «mensagem alvo» que o hover.
2. **Given** um dispositivo sem hover (ecrã táctil), **When** o utilizador não paira, **Then** a lista não fica com um destaque de hover permanente; o destaque de alvo aparece com o foco quando aplicável.

---

### Edge Cases

- Pairar só no avatar ou no nome do autor (fora do bloco da mensagem): **nenhum** destaque de hover.
- Lista vazia: nada a destacar.
- Mensagem só com anexo (sem texto): o bloco inteiro (anexo) recebe o destaque.
- Mensagem muito alta (vários anexos / pré-visualizações): o destaque cobre **toda** a unidade, não só o primeiro parágrafo.
- Scroll durante o hover: o destaque segue a mensagem sob o ponteiro; não «gruda» numa mensagem que já não está sob o rato.
- Destaque de pesquisa (017) e hover ao mesmo tempo: ambos podem coexistir; o de pesquisa permanece o mais marcado / de salto; o hover é um estado de apontar, mais subtil se os dois se sobrepõem na mesma mensagem.
- `prefers-reduced-motion`: se houver transição, deve ser nula ou mínima; o contraste do destaque mantém-se.
- Tema claro e escuro: o hover é legível em ambos, sem esconder o texto.
- Composer, anexos pendentes e cabeçalho do canal: **fora** desta feature (só o histórico na área de scroll das mensagens).
- Canais de voz: fora de âmbito.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Na área de histórico do canal de texto (a lista rolável de mensagens), ao pairar o ponteiro sobre uma mensagem, o produto MUST destacar visualmente **essa unidade completa de mensagem** (corpo, anexos e pré-visualizações dessa mensagem — o mesmo conjunto em que hoje aparece «Apagar»).
- **FR-002**: O destaque MUST aplicar-se a **uma** mensagem de cada vez (a que está sob o ponteiro **no bloco dessa mensagem** ou em foco nesse bloco). MUST NOT destacar o grupo inteiro de mensagens consecutivas do mesmo autor só porque o ponteiro está numa delas. MUST NOT destacar a área de scroll completa. MUST NOT destacar qualquer mensagem quando o ponteiro está **apenas** no avatar ou no nome do autor.
- **FR-003**: O destaque de hover MUST desaparecer quando o ponteiro deixa essa mensagem. MUST NOT ficar permanente.
- **FR-004**: O mesmo destaque de «mensagem alvo» MUST aparecer quando o bloco da mensagem está em foco (paridade com a revelação de «Apagar» ao focar).
- **FR-005**: O estilo de hover/foco MUST ser claramente distinto do destaque temporário de salto da pesquisa (017): o de pesquisa continua a sinalizar «esta é a mensagem do resultado»; o de hover/foco sinaliza «o ponteiro/foco está aqui».
- **FR-006**: O destaque MUST ser legível em tema claro e escuro e MUST NOT esconder o texto nem o botão «Apagar».
- **FR-007**: Esta feature MUST NOT alterar o envio, apagar, pesquisa, ou o comportamento do salto 017 (duração ~3 s, centrar, toast).

### Out of Scope

- Destacar ocorrências do termo de pesquisa em todas as mensagens.
- Selecção múltipla de mensagens / modo «mensagens seleccionadas» persistente.
- Menu de contexto ao pairar (reacções, editar, etc.).
- Hover em canais de voz, composer, ou lista de membros.
- Mudar quando «Apagar» aparece (já ligado a hover/foco do bloco).

### Key Entities

- **Unidade de mensagem**: um item do histórico (uma mensagem enviada), com o seu texto e anexos; é o alvo do hover, do foco e de «Apagar».
- **Destaque de alvo (hover/foco)**: estado visual transitório enquanto o ponteiro ou o foco está nessa unidade.
- **Destaque de salto (pesquisa)**: estado visual temporário da 017 após ir a um resultado; independente do hover.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com 5 pessoas, **≥4** identificam correctamente qual mensagem está sob o ponteiro sem hesitar, em listas com mensagens agrupadas do mesmo autor.
- **SC-002**: **100%** das unidades de mensagem visíveis na lista (texto, só anexo, ou misto) recebem o destaque no bloco **completo** ao pairar, não só numa linha de texto.
- **SC-003**: Ao sair com o ponteiro, **0** mensagens ficam com destaque de hover residual.
- **SC-004**: Em revisão lado a lado, o destaque de hover/foco é distinguível do destaque de salto da pesquisa em **100%** das amostras (claro e escuro).

## Assumptions

- A unidade a destacar é a **mensagem individual** (o bloco que já revela «Apagar»), não o grupo do autor, o avatar, o nome, nem toda a coluna de histórico. O utilizador apontou a lista rolável como *sítio* do histórico, não como o objecto a pintar.
- Hover de rato e foco de teclado usam o **mesmo** tratamento visual de «alvo».
- O destaque é mais suave que o da pesquisa (017), para o salto continuar a ser o mais saliente quando os dois coincidem.
- Sem hover (toque), não há estado de hover permanente; o foco continua a poder mostrar o alvo.
- Não é uma selecção persistente: soltar o rato / sair do bloco limpa o hover.
