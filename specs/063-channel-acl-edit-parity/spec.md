# Feature Specification: Paridade de edição nas permissões do canal

**Feature Branch**: `063-channel-acl-edit-parity`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Ajuste as permissões de canal (Permissões - Geral) para respeitar o mesmo modelo de edição que temos para as configurações do canal."

**Depends on**: edição de canal (renomear / visibilidade) com modelo dono ∪ criador ∪ «Gerenciar canal»; painel «Permissões do canal» (visibilidade + sobrescritas); papéis com capacidade «Gerenciar canal».

**Problem**: Quem tem permissão para editar as **configurações** de um canal (ex. renomear, alterar visibilidade no fluxo de gestão do canal) **não** consegue, de forma consistente, abrir ou guardar as **permissões do canal** (painel de permissões / secção geral de visibilidade e sobrescritas), nem **apagar** o canal com as mesmas regras. O modelo de quem pode gerir o canal fica inconsistente e a capacidade «Gerenciar canal» não cobre a gestão completa esperada.

## Clarifications

### Session 2026-09-08

- Q: Should apagar canal use the same edit model in this feature? → A: In scope — also allow delete for owner ∪ creator ∪ «Gerenciar canal»
- Q: Should access inspect in the permissions panel use the same who-can-manage gate? → A: Same gate as edit permissions (FR-001)
- Q: For ACL edit / delete, should role hierarchy further restrict «Gerenciar canal»? → A: Hierarchy applies — cannot manage/delete when below the relevant higher-ranked party (see FR-010)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Gerir permissões com o mesmo direito que configurações (Priority: P1)

Como membro com direito a **editar configurações** de um canal (dono do servidor, criador do canal, ou papel com «Gerenciar canal»), quero abrir e guardar as **permissões do canal** (visibilidade pública/privada, visível a novos membros, e sobrescritas Permitir/Negar) com as **mesmas regras** de autorização que uso para configurar o canal, para não ficar bloqueado a meio da gestão.

**Why this priority**: Corrige a inconsistência pedida; desbloqueia quem já gere canais mas não as permissões.

**Independent Test**: Conta com «Gerenciar canal» (não dono, não criador) consegue abrir «Permissões do canal», alterar visibilidade/sobrescritas e guardar com sucesso; a mesma conta continua a poder renomear/editar configurações e apagar o canal; conta sem esses direitos não abre nem guarda nem apaga.

**Acceptance Scenarios**:

1. **Given** sou dono do servidor **ou** criador do canal, **When** abro e guardo permissões do canal, **Then** continuo a conseguir (comportamento actual preservado).
2. **Given** tenho «Gerenciar canal» efectivo, **não** sou dono nem criador, e passo a hierarquia face ao criador (FR-010), **When** uso o menu/entrada de permissões do canal, **Then** o painel abre e posso guardar alterações de visibilidade e sobrescritas com sucesso.
3. **Given** não sou dono, não sou criador e **não** tenho «Gerenciar canal», **When** tento abrir ou guardar permissões do canal, **Then** a entrada de UI está ausente/desactivada e/ou a operação é recusada de forma clara (sem guardar parcialmente).

---

### User Story 2 - UI e servidor alinhados (Priority: P1)

Como administrador, quero que a **interface** só ofereça editar permissões do canal a quem o **servidor** também autoriza a guardar, para não haver botão que falha ao guardar (ou o contrário).

**Why this priority**: Evita frustração e buracos de segurança (UI escondida mas API aberta, ou UI aberta e API a negar).

**Independent Test**: Para cada perfil (dono / criador / gerenciar canal / membro comum), a visibilidade das acções «Permissões do canal» e apagar coincide com o sucesso ou falha ao guardar/apagar.

**Acceptance Scenarios**:

1. **Given** tenho direito de edição alinhado às configurações do canal, **When** vejo o menu de contexto (ou equivalente) do canal, **Then** vejo a acção de permissões (e apagar, se aplicável) e o guardar/apagar funciona; no painel, a inspecção de acesso está disponível.
2. **Given** não tenho esse direito, **When** vejo o menu do canal, **Then** **não** vejo (ou não posso activar) permissões nem apagar; tentativas directas de guardar/apagar/inspeccionar são recusadas.

---

### User Story 3 - Restantes regras de permissão intactas (Priority: P2)

Como membro, quero que alinhar **quem edita** as permissões do canal **não** altere o significado das sobrescritas (Permitir/Negar, «todos os membros», ordem de resolução) nem quem pode **ler** o canal no dia-a-dia.

**Why this priority**: Garante que o ajuste é só de autorização de gestão, não um redesign do modelo de acesso.

**Independent Test**: Após a mudança, um canal privado com sobrescritas continua a ocultar/mostrar membros como antes; apenas o conjunto de gestores autorizados cresce conforme o modelo de configurações.

**Acceptance Scenarios**:

1. **Given** um canal com sobrescritas existentes, **When** um gestor autorizado (incluindo «Gerenciar canal») guarda sem alterar entradas, **Then** o acesso efectivo dos membros permanece o mesmo.
2. **Given** um membro comum sem direitos de gestão, **When** navega canais, **Then** a lista e o acesso ao conteúdo continuam a seguir as regras de visibilidade/ACL já definidas (sem ganharem poderes de gestão).

---

### User Story 4 - Apagar canal com o mesmo modelo (Priority: P1)

Como membro autorizado a gerir o canal (dono, criador ou «Gerenciar canal»), quero **apagar** o canal com as **mesmas regras** de edição das configurações/permissões, para a gestão do ciclo de vida do canal ser coerente.

**Why this priority**: Confirmado na clarificação; completa a paridade do modelo de gestão do canal.

**Independent Test**: Conta com «Gerenciar canal» **acima** do criador (não dono/criador) consegue apagar; conta abaixo do criador não; membro comum não; dono e criador continuam a poder apagar.

**Acceptance Scenarios**:

1. **Given** sou dono ou criador, **When** apago o canal, **Then** o canal é removido (sem regressão).
2. **Given** tenho «Gerenciar canal», não sou dono nem criador, e a minha posição é **estritamente superior** à do criador, **When** escolho apagar o canal (com confirmação habitual), **Then** o canal é apagado com sucesso.
3. **Given** não satisfaço o modelo unificado, **When** tento apagar, **Then** a acção não está disponível e/ou é recusada.
4. **Given** tenho «Gerenciar canal» mas a minha posição de papel **não** é estritamente superior à do criador do canal (e não sou dono nem criador), **When** tento apagar ou editar permissões, **Then** sou recusado / a acção não está disponível.

---

### User Story 5 - Hierarquia limita «Gerenciar canal» (Priority: P1)

Como dono, quero que quem só tem «Gerenciar canal» **não** possa editar permissões, inspeccionar acesso ou apagar canais «acima» na hierarquia (criador com papel igual ou superior; sobrescritas sobre sujeitos iguais/superiores), para a hierarquia de papéis continuar a proteger gestão sensível.

**Why this priority**: Clarificação explícita; evita que um gestor júnior altere canais ou ACL de quem está acima.

**Independent Test**: Dois papéis com «Gerenciar canal», A acima de B; canal criado por membro com papel A → B não edita ACL / não apaga / não inspecciona; A consegue; dono e criador do canal continuam a conseguir no seu canal.

**Acceptance Scenarios**:

1. **Given** sou só «Gerenciar canal» com posição **estritamente superior** à do criador do canal, **When** edito permissões, inspecciono ou apago, **Then** sou autorizado (além do restante FR-001).
2. **Given** sou só «Gerenciar canal» com posição **igual ou inferior** à do criador, **When** tento as mesmas acções, **Then** sou recusado.
3. **Given** sou o **criador** do canal (mesmo com papel mais baixo que outro gestor), **When** edito permissões ou apago **o meu** canal, **Then** continuo autorizado (criador não é bloqueado pela hierarquia no próprio canal).
4. **Given** tento adicionar/alterar uma sobrescrita cujo sujeito (membro ou papel) tem posição **igual ou superior** à minha, e só me autorizo via «Gerenciar canal», **When** guardo, **Then** a operação é recusada; dono não tem esta restrição.

---

### Edge Cases

- Papel com «Gerenciar canal» removido enquanto o painel está aberto: guardar deve falhar de forma clara; sem estado «a meio» aplicado só no cliente.
- Dono / criador / «Gerenciar canal» sobrepostos: dono passa sempre; criador passa no **seu** canal; «Gerenciar canal» exige ainda hierarquia (FR-010).
- Canal de voz vs texto: o **mesmo** modelo de quem pode editar/apagar aplica-se; o conteúdo das sobrescritas (ouvir/falar vs ler/escrever) mantém-se.
- Apagar canal: mesmo modelo FR-001 + hierarquia FR-010; confirmação de UI existente mantém-se; não apaga o servidor.
- Inspecção de acesso no painel: mesmo gate que editar (FR-001 + FR-010 quando aplicável).
- Criador já não é membro / sem papel: tratar como hierarquia «não bloqueante» para gestores com «Gerenciar canal» (ou só dono — preferir: permitir «Gerenciar canal» se o criador não tem posição comparável).
- Sujeito «todos os membros» nas sobrescritas: não usa posição de papel; permitido a quem já passou FR-001/FR-010 no canal.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST autorizar **abrir e guardar** as permissões do canal (visibilidade geral + sobrescritas) e **apagar** o canal segundo o modelo base: dono do servidor **ou** criador do canal **ou** capacidade efectiva «Gerenciar canal», **sujeito a FR-010** quando a via for só «Gerenciar canal».
- **FR-002**: A interface MUST mostrar as acções «Permissões do canal» e **apagar canal** (ou equivalentes) **apenas** a utilizadores que satisfaçam FR-001 e FR-010.
- **FR-003**: Tentativas de guardar permissões ou apagar o canal por quem **não** satisfaz FR-001/FR-010 MUST ser recusadas; o utilizador MUST receber feedback claro de falta de permissão.
- **FR-004**: Utilizadores que já podiam editar/apagar (dono e criador no próprio canal) MUST continuar a poder fazê-lo sem regressão.
- **FR-005**: O alinhamento MUST NOT alterar a semântica das sobrescritas existentes (Permitir/Negar, sujeitos membro/papel/todos os membros, restrições de negar visualização em canais públicos) — apenas **quem** pode gerir.
- **FR-006**: UI e autorização do servidor MUST permanecer consistentes (sem «UI permite, servidor nega» como caminho normal para gestores válidos, nem «UI esconde, servidor aceita» para não autorizados).
- **FR-007**: Leitura efectiva do canal, envio de mensagens e restantes capacidades de membro MUST NOT ser alargadas só por esta mudança (excepto os novos direitos de **gestão/apagar** para quem já tem «Gerenciar canal» e passa FR-010).
- **FR-008**: Apagar um canal MUST NOT apagar o servidor; MUST exigir a confirmação de UI já usada no produto (ou equivalente explícita).
- **FR-009**: A inspecção de acesso no painel de permissões do canal MUST usar o mesmo gate que editar (FR-001 + FR-010); MUST NOT exigir um conjunto mais restrito arbitrário (ex. só dono) quando o utilizador já pode editar as permissões do canal.
- **FR-010**: Quando a autorização depende de «Gerenciar canal» e o actor **não** é dono nem criador do canal: (a) a posição efectiva do papel do actor MUST ser **estritamente superior** à do **criador** do canal (se o criador tiver posição comparável); (b) ao criar/alterar sobrescritas, MUST NOT visar membros ou papéis com posição **igual ou superior** à do actor. O **dono** ignora estas restrições. O **criador** ignora (a) e (b) no **seu** canal.

### Key Entities

- **Canal**: Unidade com configurações (ex. nome, visibilidade) e permissões/sobrescritas.
- **Gestor de canal (edição)**: Pessoa autorizada pelo modelo unificado — dono, criador, ou detentor de «Gerenciar canal» que passa a hierarquia (FR-010).
- **Permissões do canal (Geral)**: Conjunto editável no painel de permissões: visibilidade e sobrescritas de acesso ao canal.
- **Posição de papel**: Ordem hierárquica já usada no servidor; maior autoridade = posição superior.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em testes manuais com quatro perfis (dono, criador, «Gerenciar canal» acima do criador, membro comum), 100% dos casos de abrir/guardar permissões **e** de apagar canal coincidem com o direito esperado (incl. hierarquia).
- **SC-002**: Conta só com «Gerenciar canal» **acima** do criador completa abrir → alterar → guardar permissões em ≤1 minuto e consegue apagar um canal de teste com a confirmação habitual.
- **SC-003**: Zero regressões nos cenários de aceitação de dono e criador (continuam a editar e a apagar nos canais respectivos).
- **SC-004**: Após guardar sem mudar sobrescritas, o conjunto de membros que vê/acede ao canal de teste permanece o mesmo (verificado numa amostra de ≥3 membros com acessos distintos).
- **SC-005**: Conta com «Gerenciar canal» **igual ou abaixo** do criador falha a editar ACL / apagar / inspeccionar esse canal em 100% das tentativas de teste.

## Assumptions

- O «modelo de edição das configurações do canal» de referência para a **via base** é: **dono ∪ criador ∪ «Gerenciar canal»**, alinhado ao rename; esta feature **adiciona** restrições de hierarquia (FR-010) na via «Gerenciar canal» para ACL, inspect e delete (e UI coerente). Se o rename ainda não aplicar hierarquia, o planeamento deve **alinhar rename** à mesma regra ou documentar divergência temporária — preferência: **mesma regra** para rename, ACL, inspect e delete.
- «Permissões - Geral» refere-se ao painel **Permissões do canal** (visibilidade + sobrescritas), não à página de permissões de **papéis** do servidor (Geral/Texto/Voz).
- **Apagar canal** está **dentro** desta feature; criar canal e gestão de papéis ficam fora.
- Hierarquia usa a **posição** de papel já existente no produto (maior = mais autoridade); detalhes de empates/ausência de papel no plan.
- Idioma da UI permanece português do produto.
