# Feature Specification: Atribuição de papéis na gestão de membros

**Feature Branch**: `052-members-role-assignment`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Em um cenário aonde teremos centenas de usuários em um único servidor, atribuir usuários para o perfil no modelo que fizemos em «Papéis do Servidor» se torna imprático. Alterar o fluxo: em «Papéis do Servidor» apenas criação do perfil; dropdown a partir do nome do servidor com botão «Membros» para lista de membros e atribuição de perfil; o botão «Membros» actual passa a mostrar membros por status (online/offline) agrupados por perfil."

**Depends on**: papéis e capacidades de servidor ([047-server-channel-permissions](../047-server-channel-permissions/)); chrome de servidor / membros ([019-members-invite-icons](../019-members-invite-icons/) e shell actual).

**Problem**: Com muitos membros, atribuir pessoas a papéis dentro do diálogo «Papéis do servidor» (papel → lista de membros) não escala. É preciso separar **definição de papéis** da **atribuição a pessoas**, e transformar o painel lateral «Membros» num roster de presença agrupado por papel.

## Clarifications

### Session 2026-09-06

- Q: O que significa «online» no roster de presença? → A: Conta ligada à instância (sessão activa / WebSocket) = online; resto offline (não só presença em voz).
- Q: Como organizar o painel de presença? → A: Secções Online / Offline; dentro de cada uma, subgrupos por papel.
- Q: Um membro pode ter vários papéis? → A: Papel único — cada membro tem no máximo um papel (mudança face ao modelo multi-papel anterior).
- Q: Membros que já têm vários papéis (migração)? → A: Manter o papel com mais capacidades activas; em empate, o primeiro na ordem de listagem do servidor; remover os restantes.
- Q: O que entra no menu do nome do servidor? → A: **Membros** + **Perfis** (gestão de papéis); convite permanece no atalho actual do header.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Papéis do servidor só definem perfis (Priority: P1)

Como administrador do servidor, quero que «Papéis do servidor» sirva para **criar, abrir permissões e remover papéis**, sem a lista longa de checkboxes de membros por papel, para gerir o catálogo de perfis sem scroll interminável.

**Why this priority**: Desbloqueia o novo modelo mental e remove o fluxo imprático actual.

**Independent Test**: Abrir «Papéis do servidor» → criar um papel → abrir permissões → apagar um papel; **não** há UI de atribuir membros nesse diálogo.

**Acceptance Scenarios**:

1. **Given** sou dono (ou tenho permissão para gerir papéis), **When** abro «Papéis do servidor», **Then** posso criar um novo papel e ver a lista de papéis existentes com acesso a permissões / remoção.
2. **Given** o mesmo diálogo, **When** inspecciono cada papel, **Then** **não** vejo controlos para marcar/desmarcar membros nesse ecrã.
3. **Given** um papel existente, **When** escolho permissões, **Then** continuo a aceder à página dedicada de permissões do papel (comportamento já existente).

---

### User Story 2 - Página «Membros» para atribuir papéis (Priority: P1)

Como pessoa com permissão para gerir membros/papéis, quero um botão **Membros** num menu a partir do **nome do servidor** que abre uma página (semelhante à de permissões do perfil) com **todos os membros** do servidor, onde posso escolher **qual o papel** de cada membro, para escalar a centenas de utilizadores.

**Why this priority**: É o substituto da atribuição que sai de «Papéis do servidor».

**Independent Test**: Abrir o menu do nome do servidor → Membros → ver lista de membros → alterar o papel de um membro → confirmar que o efeito se reflecte nas capacidades desse membro.

**Acceptance Scenarios**:

1. **Given** tenho permissão para gerir papéis/membros nesse servidor, **When** abro o menu a partir do nome do servidor, **Then** vejo a acção **Membros**.
2. **Given** activei **Membros**, **When** a página carrega, **Then** vejo a lista (ou vista equivalente) de **todos** os membros do servidor e, para cada um, um controlo para definir **o seu papel** (um só, ou nenhum).
3. **Given** alterei o papel de um membro e a alteração foi aceite, **When** o membro usa o servidor, **Then** as capacidades reflectem **apenas** esse papel (mais regras de dono, se aplicável) — sem união de vários papéis.
4. **Given** **não** tenho permissão para essa gestão, **When** abro o menu do nome do servidor, **Then** a acção **Membros** de gestão **não** aparece (ou está inacessível).

---

### User Story 3 - Painel «Membros» = presença por papel (Priority: P1)

Como membro do servidor, quero que o botão **Membros** do chrome do canal (painel lateral actual) mostre quem está **online** e **offline**, **agrupados por papel**, para ver a sala social sem misturar com a gestão administrativa.

**Why this priority**: Segundo eixo do pedido; redefine o significado do controlo actual.

**Independent Test**: Abrir o painel Membros num servidor com vários papéis e estados → ver secções **Online** e **Offline**, cada uma com subgrupos por papel.

**Acceptance Scenarios**:

1. **Given** seleccionei um servidor e abri o painel **Membros**, **Then** vejo secções de **Online** e **Offline**; em cada secção, os membros aparecem **agrupados pelo seu único papel** (e membros sem papel numa subsecção clara, ex. «Sem papel»).
2. **Given** o mesmo painel, **When** há membros com sessão activa na instância e membros sem, **Then** os com sessão activa estão sob **Online** e os restantes sob **Offline**.
3. **Given** o painel aberto, **When** não tenho permissão de gestão, **Then** vejo o roster de presença **sem** controlos de atribuição de papéis nesse painel.

---

### User Story 4 - Menu do nome do servidor (Priority: P2)

Como utilizador do servidor, quero um **dropdown/menu** a partir do **nome do servidor** (cabeçalho da lista de canais) com **Membros** (gestão) e **Perfis** (papéis do servidor), mantendo o **convite** no atalho actual do header.

**Why this priority**: Chrome necessário para US2 e ponto estável para abrir a definição de perfis sem depender só do ícone de engrenagem.

**Independent Test**: Clicar no nome do servidor → menu com Membros e Perfis (conforme permissão) → cada entrada navega/abre o fluxo correcto; convite continua no header.

**Acceptance Scenarios**:

1. **Given** um servidor seleccionado e permissão de gerir papéis (ou sou dono), **When** activo o controlo do nome do servidor, **Then** o menu inclui **Membros** e **Perfis**.
2. **Given** o menu aberto, **When** escolho **Membros**, **Then** navego para a página de gestão de membros do servidor actual.
3. **Given** o menu aberto, **When** escolho **Perfis**, **Then** abro o fluxo «Papéis do servidor» (definição de perfis, sem atribuição de membros).
4. **Given** o mesmo servidor, **When** olho o header, **Then** o controlo de **convite** permanece no sítio actual (não é obrigatório no menu nesta feature).
5. **Given** **não** tenho permissão de gestão, **When** abro o menu (se existir), **Then** **Membros** e **Perfis** de gestão **não** aparecem (ou o menu de gestão não se oferece).

---

### Edge Cases

- Atribuição: escolher um papel **substitui** qualquer papel anterior; escolher «Sem papel» (ou equivalente) remove a atribuição.
- Dados legados multi-papel: na migração, cada membro fica com **um** papel — o que tiver **mais capacidades activas**; em empate, o **primeiro** na ordem de listagem de papéis do servidor; os outros papéis são removidos da atribuição desse membro.- Centenas de membros: a página de gestão MUST permanecer utilizável (pesquisa/filtro por nome ou scroll estável); o painel de presença pode resumir contagens por grupo.
- Dono do servidor: sempre pode gerir papéis e aceder a **Membros** de gestão, independentemente de estar num papel; capacidades de dono não dependem do papel único do membro.
- Remoção (kick) de membros: permanece disponível ao dono (ou regra actual); preferência: na página de gestão e/ou no painel, sem regressão.
- Papel apagado: membros desse papel ficam **sem papel**; o roster reagrupa-se sob «Sem papel».
- Sem papéis definidos: painel mostra todos sob subsecção «Sem papel» (dentro de Online/Offline); página de gestão permite atribuição quando existirem papéis.
- Permissão perdida a meio: entradas de gestão desaparecem no próximo refresh; tentativas de alteração são recusadas com mensagem clara.
- Viewport estreita: menu do nome do servidor e página de gestão utilizáveis no layout estreito / drawer.
- Presença: membro com sessão/WebSocket activa aparece online no roster mesmo fora de canais de voz; ao desligar a sessão, passa a offline sem exigir «último visto».

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O diálogo/fluxo «Papéis do servidor» MUST permitir criar, listar, abrir permissões e eliminar papéis, e MUST NOT incluir a atribuição de membros a papéis.
- **FR-002**: O produto MUST expor um menu a partir do **nome do servidor** com as acções **Membros** (página de gestão de membros) e **Perfis** (fluxo «Papéis do servidor»), quando o utilizador tem permissão; o **convite** MUST permanecer no atalho actual do header (não é obrigatório no menu).
- **FR-012**: A entrada de menu **Perfis** MUST abrir a definição de papéis (criar / permissões / eliminar) sem atribuição de membros, alinhada com FR-001.- **FR-003**: A página de gestão de membros MUST listar os membros do servidor e permitir definir **no máximo um papel** por membro (ou nenhum).
- **FR-004**: A acção de menu **Membros** (gestão) e a página correspondente MUST ser acessíveis apenas ao **dono** ou a quem tenha capacidade efectiva de **gerir papéis** no servidor.
- **FR-005**: O botão/painel **Membros** do chrome do canal (roster lateral) MUST mostrar primeiro secções **Online** e **Offline** e, dentro de cada uma, membros **agrupados pelo seu papel único**, sem ser o ecrã principal de atribuição de papéis.
- **FR-006**: Alterações de atribuição na página de gestão MUST persistir e afectar as capacidades efectivas do membro com base **apenas** no seu papel único (mais privilégios de dono, se aplicável) — sem união de múltiplos papéis.
- **FR-007**: Utilizadores sem permissão de gestão MUST poder abrir o painel de presença **Membros** se já o podiam (roster), mas MUST NOT aceder à página de gestão via o menu.
- **FR-008**: A página de gestão MUST oferecer uma forma de localizar membros quando a lista é grande (no mínimo pesquisa ou filtro por identificador/nome visível).
- **FR-009**: No roster, um membro MUST ser **online** quando a sua conta tem **sessão activa na instância**, e **offline** caso contrário; presença só em canal de voz **não** é o critério exclusivo.
- **FR-010**: O sistema MUST impedir que um membro fique com mais de um papel no mesmo servidor após esta feature (UI e regras de escrita).
- **FR-011**: Na migração de dados multi-papel existentes, cada membro MUST ficar com um único papel: o de **maior número de capacidades activas**; empate → primeiro na ordem de listagem de papéis do servidor; restantes atribuições removidas.
### Key Entities

- **Server role (papel)**: Perfil nomeado com capacidades; criado em «Papéis do servidor»; atribuído a no máximo um conjunto disjunto de membros (cada membro → 0 ou 1 papel).
- **Server member**: Conta no servidor; tem **zero ou um** papel; tem estado de presença (online = sessão activa na instância / WebSocket; offline = sem essa sessão) no roster.
- **Members management page**: Vista administrativa de todos os membros e do papel único de cada um.
- **Presence roster panel**: Painel lateral «Membros» com secções Online / Offline e, dentro de cada uma, agrupamento por papel.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um administrador atribui ou altera o papel de um membro na página de gestão em **menos de 1 minuto** (membro já visível / pesquisável), sem abrir «Papéis do servidor» para essa atribuição.
- **SC-002**: Com **≥ 100** membros no servidor de teste, a página de gestão permanece navegável (pesquisa encontra um membro conhecido; scroll não bloqueia a UI).
- **SC-003**: Em verificação manual, **100%** dos revisores distinguem o painel de presença do fluxo de gestão (entradas e propósitos diferentes).
- **SC-004**: Após reatribuir o papel, um membro de teste ganha ou perde uma capacidade observável (ex. criar canais / convites) de forma consistente com **esse** papel, sem recarregar a app de forma especial além do refresh normal de papéis.
- **SC-005**: «Papéis do servidor» deixa de ser o sítio onde se assinalam membros: checklist de regressão confirma ausência desses controlos.
- **SC-006**: Após a entrega, nenhum membro de teste permanece com dois ou mais papéis no mesmo servidor.
- **SC-007**: Num servidor de teste com membros multi-papel legados, após migração cada um tem exactamente um papel conforme FR-011 (maior nº de capacidades; empate → ordem de listagem).

## Assumptions

- Modelo **papel único** por membro (substitui o multi-papel de 047 para atribuições novas e efectivas nesta feature); capacidades do membro = capacidades desse papel (união entre papéis deixa de aplicar).
- Migração de multi-papel legado: papel com mais flags de capacidade activas; empate pela ordem de listagem do servidor.
- A permissão para a página **Membros** (gestão) alinha-se com **gerir papéis** (`can_manage_roles` / equivalente) **mais** o dono do servidor — não se cria uma capacidade nova nesta feature.
- **Online/offline** no roster = sessão activa na instância (WebSocket / sessão autenticada), não «só em voz» e sem «último visto» rico; esta feature inclui o sinal de presença necessário para o roster se ainda não existir de forma utilizável.
- Acções: o menu do nome do servidor inclui **Membros** e **Perfis**; o **convite** fica no header como hoje. O ícone/atalho antigo de «Gerir papéis» pode permanecer ou ser removido se **Perfis** o substituir — default: preferir o menu como entrada principal de Perfis e evitar duplicar sem necessidade.
- Labels: menu **Membros** = gestão de membros; menu **Perfis** = papéis do servidor; painel/botão de canal **Membros** = presença — contextos diferentes; o título da página de gestão pode ser «Gerir membros».
- Kick/remoção pelo dono não é removido; pode viver na página de gestão e/ou no roster como hoje.
- Favicon / logo topbar e outras features em curso estão fora de âmbito.