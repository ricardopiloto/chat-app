# Feature Specification: Apagar mensagens no canal de texto

**Feature Branch**: `011-text-message-delete`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Vamos adicionar uma melhoria no canal de texto, o usuário poderá deletar qualquer mensagem enviada por ele mesmo, o criador do canal pode deletar qualquer mensagem adicionada ao canal que ele criou, o criador do servidor pode deletar qualquer mensagem no servidor."

## Clarifications

### Session 2026-09-04

- Q: O que fica no histórico após apagar? → A: Remoção completa: some do histórico para todos (sem placeholder «mensagem eliminada»)
- Q: Como se abre a acção «Apagar»? → A: Controlo visível no hover/foco da mensagem
- Q: O autor pode apagar a própria mensagem sem limite de tempo? → A: Sem limite: autor apaga a própria a qualquer momento

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apagar a própria mensagem (Priority: P1)

Como membro num canal de texto, quero apagar uma mensagem que **eu** enviei, para corrigir erros ou remover conteúdo que já não quero partilhar.

**Why this priority**: Caso de uso mais frequente; base da hierarquia de permissões.

**Independent Test**: Enviar uma mensagem → pairar/focar na mensagem → acção «Apagar» → confirma → a mensagem desaparece do histórico para mim e para outro membro no mesmo canal.

**Acceptance Scenarios**:

1. **Given** uma mensagem enviada por mim num canal de texto, **When** escolho apagar e confirmo, **Then** a mensagem deixa de aparecer no histórico para todos os membros com acesso ao canal.
2. **Given** uma mensagem de outro membro (e eu não sou criador do canal nem dono do servidor), **When** vejo o histórico, **Then** não tenho acção para apagar essa mensagem.
3. **Given** apaguei a minha mensagem, **When** outro membro tinha o canal aberto, **Then** a mensagem também desaparece do ecrã dele sem precisar de recarregar a página (actualização em tempo quase real).

---

### User Story 2 - Criador do canal apaga qualquer mensagem do canal (Priority: P1)

Como **criador do canal** de texto, quero apagar qualquer mensagem nesse canal (minha ou de outros), para moderar o espaço que criei.

**Why this priority**: Pedido explícito; completa a moderação ao nível do canal.

**Independent Test**: Com conta criadora do canal e outra conta a enviar mensagens → o criador apaga a mensagem alheia → ambos deixam de a ver.

**Acceptance Scenarios**:

1. **Given** sou o criador do canal de texto, **When** apago uma mensagem de outro membro nesse canal, **Then** a mensagem é removida do histórico para todos.
2. **Given** sou membro mas **não** criador do canal nem dono do servidor, **When** tento apagar mensagem alheia, **Then** a operação é recusada e a mensagem permanece.
3. **Given** sou criador do canal A mas não do canal B no mesmo servidor, **When** estou no canal B, **Then** não posso apagar mensagens alheias só por ser criador de A.

---

### User Story 3 - Dono do servidor apaga qualquer mensagem no servidor (Priority: P1)

Como **criador/dono do servidor**, quero apagar qualquer mensagem em qualquer canal de texto desse servidor, para moderação global da instância do servidor.

**Why this priority**: Pedido explícito; nível mais alto da hierarquia.

**Independent Test**: Dono do servidor apaga mensagem noutro canal de texto criado por outra pessoa → mensagem removida para todos.

**Acceptance Scenarios**:

1. **Given** sou o dono do servidor, **When** apago uma mensagem em qualquer canal de texto desse servidor, **Then** a mensagem é removida do histórico para todos os membros.
2. **Given** não sou dono do servidor nem criador do canal nem autor da mensagem, **When** tento apagar, **Then** a operação é recusada.
3. **Given** sou dono do servidor S1, **When** estou num canal de outro servidor S2 onde sou só membro, **Then** as regras de S2 aplicam-se (não herdo poder de S1).

---

### Edge Cases

- Mensagem com anexos de mídia: ao apagar a mensagem, os anexos associados deixam de estar acessíveis (não ficam órfãos utilizáveis no chat).
- Apagar a última mensagem visível: o histórico fica vazio ou mostra o estado vazio habitual, sem erro.
- Duplo clique / pedido repetido de apagar: o segundo pedido não corrompe o canal (já apagada → «não encontrada» ou equivalente inócuo).
- Membro com convite sem histórico: continua a não ver mensagens antigas; apagar não altera essa regra.
- Canal de voz / mensagens de sistema: **fora de âmbito** desta feature (só mensagens de canal de **texto**).
- Confirmação: apagar mensagem alheia (moderação) MUST pedir confirmação explícita; apagar a própria pode usar o mesmo padrão de confirmação para evitar apagar por engano.
- Hierarquia: quem puder apagar por mais do que uma regra (ex. autor e dono) precisa apenas de uma acção «Apagar» bem-sucedida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O **autor** de uma mensagem de canal de texto MUST poder apagar essa mensagem a qualquer momento (sem janela temporal), enquanto a mensagem existir.
- **FR-002**: O **criador do canal** de texto MUST poder apagar qualquer mensagem nesse canal.
- **FR-003**: O **dono (criador) do servidor** MUST poder apagar qualquer mensagem em qualquer canal de texto desse servidor.
- **FR-004**: Quem não satisfizer FR-001, FR-002 nem FR-003 MUST NOT conseguir apagar a mensagem (recusa clara; mensagem intacta).
- **FR-005**: Após apagar com sucesso, a mensagem MUST deixar de ser listada no histórico para todos os membros autorizados a ver o canal, e os clientes ligados MUST ser notificados para removerem a mensagem da vista.
- **FR-006**: Apagar uma mensagem MUST remover também o acesso útil aos seus anexos de mídia associados (quando existirem).
- **FR-007**: A acção de apagar MUST aparecer como controlo no hover/foco da mensagem no histórico de canal de texto, e apenas quando o utilizador actual tem permissão sobre essa mensagem.
- **FR-008**: O produto MUST pedir confirmação antes de apagar (evitar remoção acidental).

### Out of Scope

- Editar mensagens (alterar texto/anexos sem apagar).
- Apagar mensagens em canais de voz/vídeo ou outros tipos de eventos.
- Papéis/cargos genéricos além de autor, criador do canal e dono do servidor.
- Moderação em massa (apagar intervalo de mensagens de uma vez).
- Soft-delete / placeholder permanente «mensagem eliminada» no histórico (clarificado: remoção completa da vista).

### Key Entities

- **Mensagem de texto**: enviada por um autor num canal; pode ser apagada segundo as regras de permissão.
- **Autor**: conta `sender` da mensagem.
- **Criador do canal**: conta que criou o canal de texto.
- **Dono do servidor**: conta proprietária do servidor.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com 3 papéis (autor comum, criador do canal, dono do servidor), **100%** das tentativas autorizadas apagam a mensagem em ≤3 s (rede local) e **100%** das tentativas não autorizadas são recusadas sem remover a mensagem.
- **SC-002**: Após apagar, um segundo membro com o canal aberto deixa de ver a mensagem em ≤3 s em **100%** das tentativas de amostra (rede local).
- **SC-003**: Em **100%** das tentativas, um não-autor sem poderes de canal/servidor não vê controlo de apagar em mensagens alheias (ou vê-o desactivado / ausente).
- **SC-004**: Apagar mensagem com anexo: **0** pré-visualizações úteis do anexo permanecem no fio após o apagar bem-sucedido.

## Assumptions

- «Criador do canal» = conta registada como criadora desse canal; «criador do servidor» = dono do servidor.
- Âmbito: **apenas canais de texto**.
- Remoção = mensagem deixa de aparecer no histórico para todos (sem placeholder «mensagem eliminada»).
- Anexos da 009/010 são invalidados/removidos com a mensagem.
- Confirmação única (diálogo) para todas as eliminações.
- Entrada na UI: botão/ícone «Apagar» no hover ou foco da mensagem (não exige menu de contexto nesta feature).
- Autor: sem limite de tempo para apagar a própria mensagem.
- A 010 (colar/WebP) pode decorrer em paralelo; esta feature não depende dela.
