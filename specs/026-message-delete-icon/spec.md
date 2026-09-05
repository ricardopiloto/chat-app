# Feature Specification: Ícone de lixeira no Apagar mensagem

**Feature Branch**: `026-message-delete-icon`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Para o «Apagar» da mensagem, ao invés de mostrar o texto «Apagar», coloque um ícone de lixeira em um tom claro de vermelho (o fundo e a borda tem que combinar)."

**Depends on**: [011-text-message-delete](../011-text-message-delete/) (controlo de apagar mensagem no canal de texto).

## Clarifications

### Session 2026-09-04

- Q: Tooltip ao pairar na lixeira? → A: Sim — dica curta «Apagar» ao pairar; o botão continua só com o ícone (padrão dos controlos icon-only).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reconhecer e usar o apagar por ícone (Priority: P1)

Como participante autorizado a apagar uma mensagem no canal de texto, quero ver um **ícone de lixeira** (em vez do texto «Apagar») num tom claro de vermelho, com fundo e borda a combinar, para o controlo ser mais compacto e visualmente coerente com uma acção destrutiva.

**Why this priority**: É o pedido principal; substitui o rótulo textual do controlo existente.

**Independent Test**: Em canal de texto, passar o rato (ou focar) numa mensagem que se pode apagar → o controlo mostra lixeira em vermelho claro (fundo + borda combinando), sem o texto «Apagar» visível; clicar continua a pedir confirmação e a apagar como hoje.

**Acceptance Scenarios**:

1. **Given** estou num canal de texto e posso apagar uma mensagem, **When** o controlo de apagar fica visível (hover ou foco), **Then** vejo um ícone de lixeira e **não** o rótulo textual «Apagar» nesse botão.
2. **Given** o controlo está visível, **When** o observo, **Then** o ícone, o fundo e a borda partilham um tom claro de vermelho coerente (não cinza/neutro genérico só no ícone).
3. **Given** o controlo está visível, **When** activo o apagar e confirmo, **Then** a mensagem é removida como no comportamento actual (sem mudança de permissões ou fluxo de confirmação além do aspecto do botão).

---

### User Story 2 - Continuar a perceber a acção sem o texto (Priority: P1)

Como utilizador de teclado ou leitor de ecrã, quero que o controlo continue a anunciar claramente que apaga a mensagem, mesmo sem o texto «Apagar» visível.

**Why this priority**: Trocar texto por ícone não pode perder acessibilidade.

**Independent Test**: Focar o controlo → nome acessível indica apagar mensagem; pairar → dica «Apagar»; confirmação continua clara.

**Acceptance Scenarios**:

1. **Given** o botão de apagar está focável, **When** o foco chega ao controlo, **Then** o nome acessível comunica a acção de apagar a mensagem (equivalente ao sentido de «Apagar mensagem»).
2. **Given** o controlo está visível, **When** pair o rato sobre a lixeira, **Then** aparece uma dica curta «Apagar» (o botão em si continua sem texto «Apagar»).
3. **Given** activei o apagar, **When** aparece a confirmação, **Then** a confirmação continua a deixar claro que a acção é permanente / não anulável (como hoje).

---

### User Story 3 - Temas claro e escuro (Priority: P2)

Como utilizador em tema claro ou escuro, quero que o tom vermelho claro do controlo (ícone, fundo, borda) continue legível e reconhecível em ambos os temas.

**Why this priority**: A app tem tema claro/escuro; o «vermelho claro» não pode desaparecer num dos temas.

**Independent Test**: Alternar tema → o controlo de apagar (quando visível) mantém aparência de acção destrutiva suave e combinação ícone/fundo/borda.

**Acceptance Scenarios**:

1. **Given** tema claro, **When** o controlo de apagar está visível, **Then** ícone, fundo e borda combinam num vermelho claro legível sobre a mensagem.
2. **Given** tema escuro, **When** o controlo de apagar está visível, **Then** o mesmo princípio de combinação e reconhecimento destrutivo aplica-se (ajuste de contraste permitido, sem voltar ao texto «Apagar»).

---

### Edge Cases

- Mensagens sem permissão de apagar: o controlo continua a não aparecer (inalterado).
- Mensagens só com anexos / várias bolhas no grupo: o controlo continua associado à mensagem correcta (inalterado), só muda o aspecto.
- Confirmação de apagar e outros «Apagar» da app (canal, servidor, cena): **fora de âmbito** — só o controlo de apagar **mensagem** no canal de texto.
- Dica ao pairar: curta «Apagar»; o texto **visível no botão** continua a ser só o ícone.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O controlo de apagar mensagem no canal de texto MUST mostrar um **ícone de lixeira** em vez do texto visível «Apagar».
- **FR-002**: Ícone, fundo e borda do controlo MUST partilhar um **tom claro de vermelho** visualmente combinado (acção destrutiva suave, não só o glifo vermelho sobre fundo neutro incompatível).
- **FR-003**: O fluxo de apagar (visibilidade por hover/foco, confirmação, permissões, remoção) MUST permanecer o de [011](../011-text-message-delete/), salvo a apresentação do botão.
- **FR-004**: O controlo MUST manter um nome acessível que comunique apagar mensagem (o utilizador não depende só do texto «Apagar» pintado no botão).
- **FR-004a**: Ao pairar sobre o controlo, MUST mostrar uma dica curta «Apagar»; o botão em si permanece icon-only (sem rótulo textual «Apagar»).
- **FR-005**: A aparência MUST ser aceitável em tema claro e escuro (contraste suficiente para reconhecer o controlo).
- **FR-006**: Outros botões ou menus com a palavra «Apagar» fora deste controlo de mensagem MUST NOT ser alterados por esta feature.

### Key Entities

- **Message delete control**: Controlo por mensagem no canal de texto que inicia o apagar (hoje rótulo «Apagar»).
- **Destructive accent (light red)**: Tom de vermelho claro partilhado por ícone, fundo e borda desse controlo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão visual, 100% das aparições do controlo de apagar mensagem usam ícone de lixeira e **0** mostram o texto «Apagar» como rótulo do botão.
- **SC-002**: Em tema claro e escuro, observadores concordam que ícone, fundo e borda combinam num vermelho claro (não cinza/ghost genérico só no glifo).
- **SC-003**: Um utilizador autorizado completa apagar (com confirmação) à primeira tentativa após a mudança visual, sem instruções extra.
- **SC-004**: Nome acessível / foco continua a identificar a acção de apagar em teste com teclado (Tab até ao controlo).
- **SC-005**: Em hover sobre o controlo, a dica «Apagar» aparece; o botão continua sem texto «Apagar» como rótulo.

## Assumptions

- Âmbito = só o botão de apagar **mensagem** no canal de texto (011); não menus de canal/servidor/cena.
- A confirmação modal/dialog pode continuar a usar texto «Apagar» / «Apagar esta mensagem?» — o pedido aplica-se ao controlo no fluxo da mensagem.
- Dica ao pairar = «Apagar» (curta), alinhada aos controlos icon-only da barra de chamada.
- «Tom claro de vermelho» = vermelho suave/claro (não vermelho saturado de perigo máximo); fundo e borda no mesmo família de cor.
- Hover/foco que revelam o controlo (011 / highlight de mensagem) mantêm-se.
- Não se exige novo fluxo de confirmação nem mudanças de API.
