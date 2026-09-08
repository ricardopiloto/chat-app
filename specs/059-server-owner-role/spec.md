# Feature Specification: Perfil automático Dono do servidor

**Feature Branch**: `059-server-owner-role`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Vamos criar um perfil automaticamente para o criador do servidor. Ele aparece como \"Owner/Dono\"."

**Depends on**: papéis de servidor e atribuição única ([047-server-channel-permissions](../047-server-channel-permissions/), [052-members-role-assignment](../052-members-role-assignment/)); criação de servidor existente.

**Problem**: Hoje o criador do servidor é dono por propriedade do servidor, mas no roster e na gestão de membros costuma aparecer sob **Sem papel**. Falta um **perfil visível** «Dono» criado automaticamente e atribuído ao criador, para hierarquia social clara.

## Clarifications

### Session 2026-09-08

- Q: As permissões do perfil Dono são editáveis? → A: Read-only — a página de permissões pode abrir para consulta, mas toggles/Save estão desactivados; capacidades permanecem completas.
- Q: Em servidores antigos, se o dono já tinha outro papel? → A: Sempre atribuir o dono a **Dono**; o papel anterior fica no catálogo (sem membros nessa conta).
- Q: Como aparece **Dono** no selector de papéis em Gerir membros? → A: Ocultar **Dono** nos pickers dos outros membros; o controlo de atribuição do dono fica bloqueado em **Dono**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Novo servidor já tem perfil Dono (Priority: P1)

Como criador de um servidor, quero que ao criar o servidor exista automaticamente um perfil chamado **Dono** e que eu esteja atribuído a esse perfil, para aparecer correctamente no roster e na gestão de membros sem configurar papéis à mão.

**Why this priority**: Pedido central da feature; valor imediato em cada servidor novo.

**Independent Test**: Criar servidor → listar papéis → existe «Dono» → criador tem esse papel; no painel Membros o criador aparece sob o grupo **Dono**, não sob «Sem papel».

**Acceptance Scenarios**:

1. **Given** crio um servidor novo, **When** a criação conclui com sucesso, **Then** existe um perfil de servidor com o nome **Dono**.
2. **Given** o servidor acabou de ser criado, **When** vejo a minha atribuição de papel, **Then** estou atribuído ao perfil **Dono** (único papel).
3. **Given** abro o painel de presença **Membros**, **When** me vejo na lista, **Then** apareço agrupado sob **Dono** (não sob «Sem papel»).

---

### User Story 2 - Perfil Dono reflecte autoridade completa (Priority: P1)

Como criador, quero que o perfil **Dono** represente o conjunto completo de capacidades de gestão do servidor (como o dono já tem na prática), para o catálogo de perfis e a UI de permissões mostrarem um papel coerente com o papel social «Dono».

**Why this priority**: Sem capacidades correctas, o perfil seria só um rótulo enganador.

**Independent Test**: Abrir permissões do perfil Dono → todas as capacidades relevantes estão activas e **não editáveis**; o criador continua a poder gerir o servidor como hoje.

**Acceptance Scenarios**:

1. **Given** um servidor recém-criado, **When** abro as permissões do perfil **Dono**, **Then** as capacidades de gestão/comunicação relevantes para um dono estão **todas activas** (alinhadas com o poder efectivo do dono) e a UI deixa claro que **não** posso alterá-las (toggles/Save desactivados ou equivalentes).
2. **Given** sou o criador atribuído a **Dono**, **When** uso o servidor, **Then** continuo a ter o mesmo poder efectivo de dono que já existia (criar canais, papéis, convites, etc.) — o perfil não reduz privilégios.
3. **Given** a página de permissões do **Dono**, **When** tento gravar alterações (se o controlo existir), **Then** a alteração é rejeitada e as capacidades permanecem intactas.

---

### User Story 3 - Servidores já existentes ganham Dono (Priority: P2)

Como dono de um servidor criado antes desta feature, quero que o perfil **Dono** passe a existir e me seja **sempre** atribuído (mesmo que eu tivesse outro papel), para o roster ficar consistente em todos os servidores.

**Why this priority**: Paridade com servidores novos; evita frota mista «com/sem Dono».

**Independent Test**: Abrir servidor antigo após a actualização → existe perfil Dono; o dono do servidor aparece sob **Dono**.

**Acceptance Scenarios**:

1. **Given** um servidor existente **sem** perfil Dono, **When** a actualização desta feature é aplicada, **Then** o perfil **Dono** é criado nesse servidor.
2. **Given** o dono do servidor **não** tinha papel atribuído («Sem papel»), **When** a migração corre, **Then** o dono fica atribuído a **Dono**.
3. **Given** o dono já tinha **outro** papel único atribuído, **When** a migração corre, **Then** o dono passa a estar atribuído a **Dono** e o papel anterior permanece no catálogo (já sem essa conta).

---

### Edge Cases

- Apagar o perfil **Dono**: **não** permitido (perfil de sistema do servidor).
- Renomear **Dono**: **não** permitido na v1 (nome fixo para reconhecimento).
- Editar permissões do **Dono**: **não** permitido (consulta read-only).
- Atribuir **Dono** a outro membro que não é o dono do servidor: **não** permitido (API rejeita; UI **não** oferece **Dono** no picker desses membros).
- Remover o dono do perfil **Dono** (passar a «Sem papel» ou outro papel): **não** permitido enquanto for o dono do servidor (controlo de atribuição do dono bloqueado na UI).
- Criar um segundo perfil com o mesmo nome «Dono»: **não** permitido (unicidade de nome por servidor, já existente).
- Transferência de propriedade do servidor: fora de âmbito desta feature (não existe fluxo de transferir dono); quando existir no futuro, o perfil Dono deve acompanhar o novo dono.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Ao criar um servidor com sucesso, o sistema MUST criar automaticamente um perfil de servidor com o nome exacto **Dono**.
- **FR-002**: Ao criar um servidor, o sistema MUST atribuir o criador (dono) a esse perfil **Dono** como o seu único papel nesse servidor.
- **FR-003**: O perfil **Dono** MUST nascer com o conjunto completo de capacidades de papel (equivalente ao poder efectivo de dono na UI de permissões), para não parecer um papel «vazio».
- **FR-004**: Em listagens de membros/roster agrupadas por papel, o dono com perfil **Dono** MUST aparecer sob o grupo **Dono**, não sob «Sem papel».
- **FR-005**: O perfil **Dono** MUST ser protegido: não pode ser apagado por utilizadores.
- **FR-006**: O nome do perfil **Dono** MUST ser fixo na v1 (não renomeável).
- **FR-007**: Apenas a conta dono do servidor MAY estar atribuída ao perfil **Dono**; a atribuição a outros membros MUST ser rejeitada. Na UI de Gerir membros, **Dono** MUST **não** aparecer como opção no picker dos membros que não são o dono.
- **FR-008**: Enquanto uma conta for dono do servidor, o sistema MUST impedir remover ou substituir a sua atribuição ao perfil **Dono**; na UI, o controlo de papel dessa conta MUST estar bloqueado (fixado em **Dono**, sem mudança).
- **FR-009**: Para servidores já existentes na altura da actualização, o sistema MUST garantir a existência do perfil **Dono** e MUST atribuir o dono do servidor a esse perfil (forçando a troca se o dono tinha outro papel; o papel antigo permanece no catálogo).
- **FR-010**: A propriedade formal do servidor (quem é o dono) continua a ser a fonte de verdade para acções exclusivas de dono; o perfil **Dono** é o reflexo social/administrativo visível, não a substitui.
- **FR-011**: As permissões do perfil **Dono** MUST ser **somente leitura** na UI (e rejeitadas se alguém tentar alterá-las): a página pode abrir para consulta, mas toggles/Save estão desactivados; as capacidades permanecem sempre o conjunto completo.

### Key Entities

- **Perfil Dono**: Perfil de servidor de sistema, nome fixo «Dono», criado automaticamente, capacidades completas e **não editáveis**, não apagável/renomeável na v1.
- **Dono do servidor**: Conta proprietária do servidor; deve permanecer atribuída ao perfil Dono.
- **Atribuição de papel**: Relação membro ↔ um único perfil por servidor (modelo actual).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos servidores criados após a feature, o criador aparece sob **Dono** no roster na primeira abertura do painel Membros (sem configuração manual de papéis).
- **SC-002**: Em verificação amostral de servidores pré-existentes após a actualização, ≥95% têm o perfil **Dono** e o dono aparece sob **Dono** (não sob «Sem papel» nem sob outro papel).
- **SC-003**: Tentativas de apagar o perfil **Dono**, renomeá-lo, editar as suas permissões, ou atribuí-lo a um não-dono falham de forma clara para o utilizador (mensagem compreensível ou controlos desactivados) em 100% dos casos de teste manuais definidos no plano.
- **SC-004**: Criadores novos não precisam de passos extra para «ficar Dono» — zero cliques de configuração de papel após criar o servidor.

## Assumptions

- O nome visível do perfil é **Dono** (português do produto); «Owner» na descrição do pedido é sinónimo, não um segundo nome na UI.
- Capacidades do perfil Dono = conjunto completo já usado para o poder efectivo de dono na página de permissões (todas as flags relevantes activas); a página é consultável mas não editável.
- **Migração (servidores antigos)** — confirmada:
  - Sempre criar o perfil **Dono** se em falta (ou reutilizar papel existente com esse nome exacto).
  - **Sempre** atribuir o dono do servidor a **Dono**, mesmo que já tivesse outro papel.
  - O papel anterior deixa de estar na conta do dono e permanece no catálogo para outros membros.
- Perfis criados manualmente por utilizadores não são afectados excepto pela unicidade do nome «Dono».
- Na página Gerir membros: **Dono** oculto nos pickers dos não-donos; linha do dono com papel bloqueado em **Dono**.
- Transferência de propriedade e múltiplos «co-donos» estão fora de âmbito.
- Servidores cujo catálogo já tenha um papel chamado exactamente «Dono» criado à mão: a migração **reutiliza** esse papel (marca-o/trata-o como o perfil de sistema Dono) em vez de falhar por nome duplicado; se ambíguo, o papel existente chamado «Dono» torna-se o perfil protegido.
