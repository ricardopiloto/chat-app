# Feature Specification: Renomear canais com hierarquia

**Feature Branch**: `054-channel-rename`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Vamos adicionar a opção do usuário poder renomear canais que ele criou, respeitando a hierarquia do servidor. Criador do Servidor pode editar qualquer canal; Pessoas com a permissão correta no canal podem editar o canal."

**Depends on**: canais e papéis/capacidades ([047-server-channel-permissions](../047-server-channel-permissions/)); chrome de canais na barra lateral.

**Problem**: Hoje o utilizador pode criar canais e (em alguns casos) apagar ou gerir permissões, mas **não há um fluxo claro para renomear** um canal. Quem criou o canal, o dono do servidor e quem tem permissão de gestão de canais precisam de poder alterar o nome sem depender de workarounds.

## Clarifications

### Session 2026-09-08

- Q: Quem tem a «permissão correcta» para renomear (além do dono e do criador)? → A: Papel com capacidade **Gerenciar canal** no servidor (qualquer canal visível); não ACL nova por canal.
- Q: Como o utilizador renomeia na UI? → A: Duplo-clique no nome do canal na barra lateral para editar inline.
- Q: Nomes de canal no mesmo servidor podem repetir-se? → A: Sim — permitir nomes iguais (como na criação actual); o rename não introduz unicidade obrigatória.
- Q: Em ecrãs tacteis / estreitos, como iniciar o rename? → A: Duplo-toque no nome (equivalente ao duplo-clique no desktop).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Criador renomeia o seu canal (Priority: P1)

Como membro que **criou** um canal, quero renomeá-lo com **duplo-clique no nome** na barra lateral, para corrigir o nome sem pedir ao dono.

**Why this priority**: Pedido central — «canais que ele criou».

**Independent Test**: Utilizador A cria canal «geral» → duplo-clique no nome → renomeia para «avisos» → o nome novo aparece na lista e ao abrir o canal.

**Acceptance Scenarios**:

1. **Given** sou o criador de um canal (e não necessariamente o dono do servidor), **When** faço duplo-clique no nome na barra lateral e confirmo um nome válido, **Then** o canal passa a mostrar o novo nome na barra lateral e no ecrã do canal.
2. **Given** o mesmo canal, **When** tento renomear com nome vazio ou só espaços, **Then** a alteração é rejeitada e o nome anterior mantém-se.

---

### User Story 2 - Dono do servidor renomeia qualquer canal (Priority: P1)

Como **criador/dono do servidor**, quero renomear **qualquer** canal do servidor, mesmo que outro membro o tenha criado, para manter a organização da mesa.

**Why this priority**: Hierarquia explícita no pedido.

**Independent Test**: Membro cria canal; dono faz duplo-clique no nome e renomeia; criador vê o novo nome.

**Acceptance Scenarios**:

1. **Given** sou dono do servidor e existe um canal criado por outro membro, **When** faço duplo-clique no nome e o renomeio, **Then** o novo nome fica persistido e visível para todos os membros que vêem o canal.
2. **Given** sou dono, **When** renomeio um canal que eu próprio criei, **Then** o fluxo funciona igual (sem regra especial extra).

---

### User Story 3 - Quem tem permissão de gerir canais pode renomear (Priority: P1)

Como membro com a **permissão correcta** para gerir canais no servidor, quero renomear canais (não só os meus), alinhado à hierarquia — abaixo do dono, acima de quem só é membro sem essa capacidade.

**Why this priority**: Terceiro eixo do pedido («permissão correcta»).

**Independent Test**: Dono atribui papel com «Gerenciar canal» a B; B renomeia um canal criado por C; membro sem a permissão não vê / não consegue concluir o rename.

**Acceptance Scenarios**:

1. **Given** tenho capacidade efectiva de **gerir canais** no servidor (e não sou dono), **When** renomeio um canal visível para mim, **Then** o nome actualiza com sucesso.
2. **Given** **não** sou dono, **não** sou o criador do canal e **não** tenho gerir canais, **When** olho as acções do canal, **Then** **não** tenho a opção de renomear (ou a tentativa é recusada).

---

### User Story 4 - Nome inválido e feedback (Priority: P2)

Como utilizador a renomear, quero feedback claro se o nome for inválido ou em conflito, para corrigir sem perder contexto.

**Why this priority**: Qualidade do fluxo; secundário ao poder renomear.

**Independent Test**: Tentar nomes vazios / demasiado longos e ver mensagem útil; nomes duplicados de outro canal são aceites.

**Acceptance Scenarios**:

1. **Given** abri o fluxo de renomear, **When** submeto um nome inválido, **Then** vejo uma mensagem de erro compreensível e o canal não muda de nome.
2. **Given** o rename falhou por permissão (ex. permissão removida a meio), **When** a operação é recusada, **Then** o nome antigo permanece e sou informado.

---

### Edge Cases

- Nome igual ao actual → pode ser no-op bem-sucedido ou fechar sem alteração (sem erro alarmista).
- Nome igual a outro canal do servidor → **permitido** (não é erro).
- Nome só com espaços → rejeitado.
- Canal privado / com ACL: quem pode renomear ainda precisa de **ver** o canal na lista; rename não concede visão a quem não a tem.
- Último canal do servidor / tipo: renomear **não** apaga o canal; regras de «último canal» de delete não se aplicam.
- Viewport estreita / drawer / tactil: **duplo-toque** no nome inicia a edição inline (mesmo fluxo que o duplo-clique).
- Duplo-clique / duplo-toque sem autorização: **não** entra em modo de edição (ou a edição é recusada sem alterar o nome).
- Escape / blur com nome inválido: cancela ou rejeita e restaura o nome anterior (sem corromper).
- Dois utilizadores autorizados renomeiam em sequência: o último nome aceite prevalece.
- Texto e voz/vídeo: a mesma hierarquia aplica-se a ambos os tipos de canal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Utilizadores autorizados MUST poder **alterar o nome** de um canal de texto ou voz/vídeo do servidor.
- **FR-002**: O **dono (criador) do servidor** MUST poder renomear **qualquer** canal desse servidor.
- **FR-003**: O **criador do canal** MUST poder renomear **esse** canal.
- **FR-004**: Membros com capacidade efectiva de **gerir canais** no servidor MUST poder renomear canais desse servidor (além dos que criaram).
- **FR-005**: Membros que não satisfazem FR-002–FR-004 MUST NOT poder renomear o canal (controlo ausente e/ou recusa pelo servidor).
- **FR-006**: O produto MUST permitir iniciar o rename por **duplo-clique** (ponteiro) ou **duplo-toque** (tactil) no nome do canal na barra lateral, apenas quando o utilizador está autorizado (FR-002–FR-004); sem autorização, o gesto MUST NOT alterar o nome.
- **FR-010**: Enquanto o nome está em edição inline, o utilizador MUST poder confirmar (ex. Enter) ou cancelar (ex. Escape / blur sem alteração válida), com feedback se a validação falhar.- **FR-007**: Nomes MUST ser validados (não vazios após trim; limites de comprimento coerentes com a criação de canais). Nomes **duplicados** no mesmo servidor MUST ser permitidos (igual à criação).
- **FR-008**: Após um rename bem-sucedido, o novo nome MUST aparecer de imediato na lista de canais e nas vistas que mostram o nome do canal activo (sem exigir truques obscuros além do refresh normal da lista).
- **FR-009**: A autorização de rename MUST ser aplicada também no servidor (não só esconder o botão).

### Key Entities

- **Channel**: Canal de texto ou voz/vídeo com nome, criador e servidor.
- **Server owner**: Conta dona do servidor; autoridade máxima sobre canais.
- **Channel creator**: Conta que criou o canal.
- **Manage-channels capability**: Capacidade de papel que autoriza gestão de canais (inclui rename nesta feature).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Criador de um canal completa um rename válido em **menos de 30 segundos** via duplo-clique no nome na barra lateral.
- **SC-002**: Em matriz de teste (dono / criador / com gerir canais / sem permissão), **100%** dos casos autorizados conseguem renomear e **100%** dos não autorizados não alteram o nome.
- **SC-003**: Após rename, **5/5** verificações manuais mostram o novo nome na barra lateral e no cabeçalho/contexto do canal aberto.
- **SC-004**: Tentativas com nome inválido falham em **100%** dos casos de teste sem corromper o nome anterior.

## Assumptions

- «Permissão correcta no canal» = capacidade efectiva de **gerir canais** no servidor (produto «Gerenciar canal»); confirmado na clarificação — não ACL nova nem flag só de rename.
- Hierarquia efectiva: **dono do servidor** ∪ **gerir canais** ∪ **criador do canal** (qualquer um basta).
- Interacção principal de rename: **duplo-clique** (desktop) ou **duplo-toque** (tactil) no nome na lista de canais; menu de contexto «Renomear» não é obrigatório nesta feature.
- O âmbito é **renomear** (campo nome). Outras edições (visibilidade, ACL, apagar) ficam como estão.
- Unicidade de nome por servidor: **não** exigida — rename e criação permitem nomes repetidos no mesmo servidor.
- Regras de validação de nome alinham-se às da **criação** de canal (trim, comprimento máximo, caracteres permitidos se já existirem) — sem regra nova de unicidade.
- Texto e voz/vídeo partilham a mesma autorização e UI de rename.
