# Feature Specification: Shell de configurações do servidor

**Feature Branch**: `056-server-settings-shell`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Mover todas as telas de configuração para o mesmo modelo das páginas de permissões de perfil e de membros: em vez do dropdown no nome do servidor, uma engrenagem; ao clicar, o painel central fica vazio/modo config e a sidebar passa a listar submenus de configurações (Perfis, permissões, etc.) por grupos; na topbar, ícone X (não texto «Sair») para voltar à vista normal de canais."

## Clarifications

### Session 2026-09-08

- Q: Além de Membros e Perfis, o que entra na sidebar de settings na v1? → A: Migrar também **Imagem do servidor** e **Apagar servidor** para a navegação de settings (grupo owner-only); não deixar só no context menu do rail.
- Q: Ao clicar na engrenagem, o que aparece no main antes de escolher um item? → A: Estado vazio / placeholder curto até o utilizador seleccionar um item.
- Q: Com o dropdown removido, o que faz o clique no nome do servidor? → A: Clique no nome **também** abre o modo configurações (atalho equivalente à engrenagem).
- Q: Após migrar Imagem/Apagar, o que fazer ao context menu do rail? → A: **Remover** Imagem e Apagar do context menu do rail; só via settings.
- Q: Em modo settings, como abre **Perfis**? → A: **Página** no painel central (como Membros); deixar de usar o diálogo sobreposto como entrada principal.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Entrar nas configurações pela engrenagem (Priority: P1)

Como membro com acesso a definições do servidor, quero clicar numa **engrenagem** junto ao servidor (em vez do menu dropdown no nome) para entrar num **modo de configurações**, com a área central livre do chat e a sidebar a mostrar a navegação de definições, para gerir o servidor no mesmo padrão das páginas de membros e de permissões de perfil.

**Why this priority**: É o novo caminho de entrada e o modelo de layout pedido; sem isto o resto das configs não migra.

**Independent Test**: Clicar na engrenagem → sidebar troca para lista de settings agrupada; main deixa de mostrar o canal/chat habitual (vazio ou ecrã de settings); nome do servidor deixa de abrir o dropdown antigo de Membros/Perfis.

**Acceptance Scenarios**:

1. **Given** um servidor seleccionado na vista normal de canais, **When** o utilizador clica na engrenagem de configurações, **Then** entra no modo de configurações: a sidebar deixa de ser a lista TEXTO/VOZ e passa a mostrar submenus de configuração.
2. **Given** o utilizador acabou de abrir configurações, **When** olha para o painel central, **Then** vê um **estado vazio / placeholder** (ex. «Escolha uma definição»), **não** o chat do canal e **não** uma página de settings aberta automaticamente.
3. **Given** a vista normal e o utilizador tem acesso a pelo menos um item de settings, **When** clica no **nome do servidor**, **Then** entra no modo configurações da mesma forma que pela engrenagem (sem reabrir o dropdown «Membros / Perfis»).

---

### User Story 2 - Navegar submenus agrupados na sidebar (Priority: P1)

Como utilizador em modo configurações, quero ver na sidebar uma **lista de submenus** (ex.: Membros, Perfis / permissões) **separados por grupos**, e ao escolher um item ver a tela correspondente no painel central — no mesmo modelo já usado para gerir membros e permissões de perfil.

**Why this priority**: É o conteúdo do modo settings; agrupa e substitui diálogos/menus dispersos.

**Independent Test**: Em modo settings, clicar «Membros» e «Perfis» (e itens equivalentes migrados) → main mostra a página correspondente; grupos na sidebar são distinguíveis.

**Acceptance Scenarios**:

1. **Given** modo configurações activo, **When** o utilizador vê a sidebar, **Then** os itens estão organizados em **grupos** com rótulos claros (não uma lista plana sem hierarquia).
2. **Given** modo configurações, **When** escolhe «Membros», **Then** o painel central mostra a gestão de membros no modelo de página dedicado (como hoje), sem precisar do dropdown antigo.
3. **Given** modo configurações, **When** escolhe a entrada **Perfis**, **Then** o painel central mostra uma **página** de gestão de perfis/papéis (mesmo modelo de página que Membros), **não** o diálogo/painel sobreposto antigo como entrada principal; a partir daí, permissões de um perfil continuam em página no main.
4. **Given** um item de settings para o qual o utilizador **não** tem permissão, **When** está em modo configurações, **Then** esse item não aparece ou aparece desactivado de forma clara (sem abrir uma tela que falha sem explicação).
5. **Given** o utilizador é **dono** do servidor, **When** está em modo configurações, **Then** vê entradas para **Imagem do servidor** e **Apagar servidor** (grupo adequado, tipicamente só para o dono), e pode concluir essas acções a partir do main — não depende do menu de contexto do rail como único caminho.
6. **Given** o utilizador **não** é dono, **When** está em modo configurações, **Then** **não** vê (ou não pode usar) Imagem do servidor / Apagar servidor.

---

### User Story 3 - Sair das configurações com X na topbar (Priority: P1)

Como utilizador em modo configurações, quero um controlo na **barra superior** com ícone **X** (sem o texto «Sair») para voltar à **vista normal de canais** (sidebar de canais + main de conversa/palco).

**Why this priority**: Sem saída óbvia o utilizador fica preso no modo settings.

**Independent Test**: Em settings → clicar X na topbar → volta a canais; sidebar de TEXTO/VOZ restaura; main deixa de ser só settings.

**Acceptance Scenarios**:

1. **Given** modo configurações, **When** o utilizador clica no ícone X na topbar, **Then** regressa à vista normal de canais do servidor actual (ou ao último canal coerente com o comportamento actual da app).
2. **Given** modo configurações, **When** o X está visível, **Then** o affordance é o ícone X (acessível por nome/aria), **não** o rótulo textual «Sair» como controlo principal.
3. **Given** o utilizador saiu com X, **When** volta a abrir a engrenagem, **Then** reentra no modo configurações de forma previsível.

---

### Edge Cases

- Utilizador sem permissão para nenhum item de settings: a engrenagem não aparece, ou abre um estado vazio com mensagem clara — default: **não mostrar** a engrenagem se não houver nenhum submenu permitido.
- Viewport estreita: o modo settings MUST permanecer utilizável (sidebar de settings + main); não partir o drawer mobile existente de canais.
- Deep link / refresh numa URL de settings (membros, permissões de perfil): MUST continuar a mostrar o contexto de configurações (sidebar de settings + página), não só a página órfã sem navegação de grupos.
- Preferência de movimento reduzido: transições de modo podem ser reduzidas; X e engrenagem continuam operacionais.
- Troca de servidor enquanto em settings: MUST sair do settings do servidor anterior ou recontextualizar para o novo servidor sem misturar itens.
- Context menu do rail do servidor: após esta feature, MUST NÃO listar Imagem do servidor nem Apagar servidor (essas acções só no modo settings).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O produto MUST oferecer uma **engrenagem** de configurações do servidor no chrome da sidebar (área do servidor), em substituição do **dropdown** no nome do servidor como porta de entrada para Membros/Perfis e restantes ecrãs de configuração do servidor migrados nesta feature.
- **FR-001a**: Na vista normal de canais, um **clique no nome do servidor** MUST abrir o **mesmo** modo configurações que a engrenagem (atalho equivalente), desde que o utilizador tenha acesso a pelo menos um item de settings; MUST NÃO reabrir o dropdown antigo «Membros / Perfis».
- **FR-002**: Ao activar a engrenagem (ou o atalho no nome), o produto MUST entrar em **modo configurações**: a sidebar mostra a **navegação de settings** (não a lista de canais TEXTO/VOZ).
- **FR-003**: Em modo configurações, imediatamente após abrir pela engrenagem (sem item seleccionado), o painel central MUST mostrar um **estado vazio / placeholder** de settings — MUST NÃO permanecer no chat do canal e MUST NÃO auto-abrir Membros, Perfis, Imagem ou Apagar. Após o utilizador escolher um item na sidebar, o main MUST mostrar o ecrã correspondente.
- **FR-004**: A navegação de settings na sidebar MUST listar submenus **agrupados** (grupos com rótulos; itens dentro dos grupos), incluindo pelo menos: **Membros**, **Perfis** (e permissões de perfil a partir daí), **Imagem do servidor**, e **Apagar servidor**, alinhadas ao modelo das páginas de membros / permissões de perfil (imagem e apagar podem ser ecrãs ou fluxos no main dedicados ao modo settings).
- **FR-004a**: **Imagem do servidor** e **Apagar servidor** MUST ser visíveis/utilizáveis apenas para o **dono** do servidor (ou equivalente actual de autorização dessas acções); membros sem essa autoridade MUST NÃO ver essas entradas como acções utilizáveis.
- **FR-005**: Itens de settings MUST respeitar as permissões do utilizador (ocultar ou desactivar o que não pode gerir).
- **FR-006**: A topbar, em modo configurações, MUST mostrar um controlo de saída com **ícone X** (não o texto «Sair» como label visível principal) que regressa à vista normal de canais.
- **FR-007**: Sair do modo configurações MUST restaurar a sidebar de canais e o uso normal do main (canal/palco).
- **FR-008**: URLs / páginas já existentes de membros e de permissões de perfil MUST integrar-se neste modo (sidebar de settings visível), em vez de depender do dropdown do nome do servidor.
- **FR-008a**: A entrada **Perfis** MUST abrir uma **página** no painel central (paridade com Membros). O diálogo/painel sobreposto antigo MUST NÃO ser a entrada principal deste fluxo em modo settings (MAY ser removido ou reutilizado só como implementação interna da página, sem UX de modal sobre o chat).
- **FR-009**: Definições **ao nível do canal** (ex.: ACL de um canal aberto no chat) MAY permanecer no contexto do canal nesta entrega se ainda não forem páginas de settings de servidor; a feature MUST NÃO obrigar a migrar ACL por-canal para a sidebar de servidor na primeira versão, salvo se já existirem como ecrãs de configuração de servidor.
- **FR-010**: O Account / definições de **conta do utilizador** (engrenagem do painel de utilizador) MUST permanecer distinto deste modo de configurações **do servidor**.
- **FR-011**: Após migrar Imagem / Apagar para a navegação de settings, o produto MUST **remover** essas entradas do **context menu do rail** do servidor; settings é o **único** caminho para Imagem do servidor e Apagar servidor nesta feature (sem atalho residual nesse menu).

### Key Entities

- **Server settings mode**: Estado da shell em que a sidebar é navegação de configuração e o main é uma página de settings (ou vazio).
- **Settings nav group**: Secção rotulada na sidebar (ex.: «Pessoas», «Funções») contendo itens.
- **Settings nav item**: Entrada clicável (ex.: Membros, Perfis) que abre uma página no main.
- **Exit control**: Ícone X na topbar que encerra o modo settings.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 10 aberturas pela engrenagem, 10/10 vezes a sidebar mostra navegação de settings agrupada e o main não permanece no chat do canal como vista principal.
- **SC-002**: Em 10 ciclos engrenagem → abrir Membros ou Perfis → X na topbar, 10/10 regressam à vista de canais com sidebar de canais restaurada.
- **SC-003**: Em 10 interacções com o nome do servidor na vista normal (utilizador com acesso a settings), 10/10 abrem o modo configurações **sem** o dropdown antigo «Membros / Perfis»; Membros/Perfis/Imagem/Apagar vivem na navegação de settings.
- **SC-004**: Em 5 verificações com utilizador sem permissão de gestão, a engrenagem está ausente ou os itens proibidos não são utilizáveis — 5/5 coerente com as regras de permissão.
- **SC-005**: Em 5 refreshes/deep-links para páginas de membros ou permissões de perfil, 5/5 mantêm contexto de navegação de settings (grupos na sidebar) quando o utilizador está autenticado nesse servidor.

## Assumptions

- «Todas as telas de configuração» nesta feature significa as **configurações de servidor** hoje ligadas ao menu do nome do servidor (**Membros**, **Perfis**), mais **Imagem do servidor** e **Apagar servidor** (hoje no context menu do rail, owner); ACL e settings **por canal** no fluxo de chat ficam fora da migração obrigatória da v1 (FR-009).
- **Perfis** passa a página no main (como Membros); o `RolesPanel` modal deixa de ser a porta de entrada.
- O painel «vazio» inicial após a engrenagem **é** o comportamento canónico: placeholder curto («Escolha uma definição» ou equivalente) até seleccionar um item — **sem** auto-selecção.
- Grupos iniciais razoáveis: por exemplo um grupo para pessoas/membros, outro para perfis/funções, e um grupo owner (ou «Perigo» / «Servidor») para imagem e apagar; nomes exactos no plano/UI.
- O X na topbar só precisa de estar em evidência **em modo configurações** (não é obrigatório na vista normal de canais).
- A engrenagem do **user panel** (conta) não é substituída por esta feature.
- Clique no **nome do servidor** na vista normal = mesmo atalho que a engrenagem (quando há pelo menos um item permitido).
