# Feature Specification: Avatares de utilizador e de servidor

**Feature Branch**: `029-user-server-avatars`

**Created**: 2026-09-05

**Status**: Draft

**Input**: User description: "Agora vamos adicionar configurações de usuário. Cada usuário pode adicionar um avatar no seu usuário. O criador do servidor pode adicionar um avatar a imagem do servidor."

**Depends on**: shell autenticada (menu da conta [013](../013-topbar-scene-ux/), rail de servidores, lista de membros); modelo Account / Server existente.

## Clarifications

### Session 2026-09-05

- Q: Remover avatar/imagem no MVP? → A: MVP: remover avatar de utilizador e imagem de servidor (voltar ao fallback)
- Q: Limite máximo por ficheiro de avatar/imagem? → A: 1 MiB por ficheiro (avatar e imagem de servidor)
- Q: Como outros clientes vêem o avatar novo? → A: MVP: reflectir após refetch/navegação (e imediatamente no próprio cliente após gravar); sem push dedicado
- Q: Recorte / proporção da imagem no upload? → A: Sem editor: enviar ficheiro tal qual; UI mostra em círculo/quadrado com object-fit
- Q: Onde o dono define a imagem do servidor? → A: Controlo do dono junto à gestão actual do servidor (convite / apagar / menu do servidor no shell)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Definir o meu avatar (Priority: P1)

Como utilizador autenticado, quero **adicionar ou substituir um avatar** na minha conta a partir das configurações de utilizador, para os outros me reconhecerem visualmente em vez de só pelas iniciais do handle.

**Why this priority**: Pedido principal «cada utilizador pode adicionar um avatar».

**Independent Test**: Abrir configurações de utilizador → escolher uma imagem válida → gravar → o meu avatar aparece no chip da conta (e noutros sítios de identidade pessoais listados abaixo) sem reiniciar a app.

**Acceptance Scenarios**:

1. **Given** estou autenticado sem avatar, **When** abro as configurações de utilizador e envio uma imagem válida, **Then** o avatar fica associado à minha conta e substitui as iniciais no chip do canto superior direito.
2. **Given** já tenho avatar, **When** envio outra imagem válida, **Then** o novo avatar passa a ser o mostrado (substituição).
3. **Given** tenho avatar, **When** escolho remover o avatar, **Then** volto a ver o fallback de iniciais.

---

### User Story 2 - Avatar do servidor (só criador) (Priority: P1)

Como **criador/dono** do servidor, quero definir uma **imagem do servidor**, para o rail e a identidade do servidor deixarem de ser genéricos.

**Why this priority**: Segundo pedido explícito; permissão restrita ao criador.

**Independent Test**: Como dono, definir imagem do servidor → o rail (e cabeçalhos de servidor relevantes) mostram a imagem; como não-dono, não consigo alterar.

**Acceptance Scenarios**:

1. **Given** sou o dono do servidor, **When** abro a configuração de imagem do servidor e envio uma imagem válida, **Then** essa imagem passa a representar o servidor no rail de servidores.
2. **Given** não sou o dono, **When** tento alterar a imagem do servidor, **Then** a acção não está disponível ou é rejeitada (sem mudança).
3. **Given** o servidor já tem imagem, **When** o dono a substitui ou remove, **Then** o rail reflecte o novo estado (imagem nova ou fallback).

---

### User Story 3 - Ver avatares onde já há identidade (Priority: P2)

Como membro, quero ver avatares de **pessoas** e **servidores** nos sítios onde a UI já mostra identidade (iniciais / marca do servidor), para a mudança ser útil no dia-a-dia e não só no ecrã de definições.

**Why this priority**: Sem exibição, o upload não entrega valor.

**Independent Test**: Com avatares definidos, percorrer topbar, rail, membros e mensagens de texto — onde hoje há iniciais/placeholder, aparece a imagem quando existir.

**Acceptance Scenarios**:

1. **Given** um membro tem avatar, **When** vejo a lista de membros ou o grupo de mensagens desse autor, **Then** vejo o avatar em vez das iniciais (quando esse sítio já mostrava iniciais).
2. **Given** um servidor tem imagem, **When** vejo o rail de servidores, **Then** vejo a imagem desse servidor (fallback se não houver).
3. **Given** alguém ainda não tem avatar, **When** o observo, **Then** continua o fallback actual (iniciais / marca genérica), sem espaço vazio partido.

---

### Edge Cases

- Ficheiro inválido (tipo não imagem, demasiado grande, corrupto): o utilizador recebe feedback claro; o avatar anterior (se existir) mantém-se.
- Utilizador sem permissão de dono: não altera imagem do servidor.
- Remoção vs substituição: substituição **e** remoção explícita são obrigatórias no MVP; remoção restaura o fallback.
- Tema claro/escuro: avatares e controlos de upload permanecem legíveis.
- Fora de âmbito nesta feature: editar handle, alterar senha, tema (já existente), papéis, banners de servidor para além do ícone/avatar do servidor, avatares E2EE opacos a membros (ver Assumptions), editor de recorte de imagem, push WS dedicado para actualizar avatares noutros clientes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada conta autenticada MUST poder **definir** um avatar de utilizador (imagem) através de uma superfície de **configurações de utilizador** acessível a partir do shell (ex. a partir do menu da conta).
- **FR-002**: O dono/criador do servidor MUST poder **definir** uma imagem/avatar do **servidor** numa superfície de configuração acessível a partir da **gestão actual do servidor no shell** (junto a convite / apagar / controlos de dono existentes — sem rota `/settings` dedicada obrigatória).
- **FR-003**: Membros que **não** são dono MUST NOT conseguir alterar a imagem do servidor.
- **FR-004**: Avatares de utilizador MUST ser visíveis nos sítios da UI que hoje mostram **iniciais** do utilizador (no mínimo: chip da conta na topbar; lista de membros; avatar junto às mensagens de texto quando aplicável).
- **FR-005**: Imagens de servidor MUST ser visíveis no **rail de servidores** (substituindo o fallback actual quando existir imagem).
- **FR-006**: O sistema MUST aceitar apenas imagens em formatos de uso comum na web (ex. JPEG, PNG, WebP) e MUST rejeitar ficheiros fora das regras de tipo/tamanho com mensagem compreensível.
- **FR-007**: O sistema MUST impor um limite máximo de **1 MiB** por ficheiro (avatar de utilizador e imagem de servidor) e comunicar o limite ao falhar.
- **FR-008**: Na ausência de avatar/imagem, a UI MUST manter um **fallback** estável (iniciais / marca), sem layout quebrado.
- **FR-009**: Após gravar, o **próprio cliente** MUST actualizar avatar/imagem de imediato. Outros participantes MUST ver a mudança após **refetch** das vistas relevantes (membros, mensagens, lista de servidores) ou navegação equivalente — **sem** evento de push dedicado nesta feature.
- **FR-010**: Esta feature MUST NOT exigir alteração de handle, palavra-passe ou outras definições de conta além do avatar.
- **FR-011**: O utilizador MUST poder **remover** o seu avatar (voltar ao fallback de iniciais) a partir da mesma superfície de configurações de utilizador.
- **FR-012**: O dono MUST poder **remover** a imagem do servidor (voltar ao fallback do rail) a partir da superfície de configuração da imagem do servidor.
- **FR-013**: O upload MUST aceitar a imagem **sem editor de recorte**; a UI MUST apresentar avatares/imagens de servidor em círculo ou quadrado usando recorte visual (`object-fit: cover` ou equivalente), sem exigir proporção exacta no ficheiro.

### Key Entities

- **User avatar**: Imagem de perfil associada a uma Account; opcional; fallback = iniciais.
- **Server image**: Imagem associada a um Server; opcional; só o dono define; fallback = marca/letra actual do rail.
- **User settings surface**: UI onde o utilizador gere o seu avatar (e apenas isso nesta feature).
- **Server image settings**: UI onde o dono gere a imagem do servidor (junto aos controlos de dono do shell).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um utilizador define o seu avatar com uma imagem válida em ≤2 minutos no caminho feliz (abrir definições → escolher ficheiro → confirmar).
- **SC-002**: Após gravar, o avatar do utilizador é visível no chip da topbar sem reinício completo da aplicação.
- **SC-003**: O dono define a imagem do servidor em ≤2 minutos no caminho feliz; a imagem aparece no rail.
- **SC-004**: Em teste com dois papéis, só o dono consegue alterar a imagem do servidor; um membro comum não.
- **SC-005**: Em 3 sítios de identidade pessoal cobertos por FR-004, o avatar (quando definido) substitui o fallback em todos eles.
- **SC-006**: Ficheiro inválido ou acima de **1 MiB** produz feedback de erro em ≤5 s após a tentativa; o estado anterior não se perde sem aviso.

## Assumptions

- «Configurações de usuário» nesta fatia = superfície para **avatar de conta** (não um painel completo de preferências).
- «Criador do servidor» = dono actual do servidor (`owner`), o mesmo papel que já gere convites/apagar servidor.
- Avatares/imagens de servidor são **visíveis aos membros da instância** que já vêem a identidade correspondente; **não** são cifrados ponta-a-ponta como o corpo das mensagens (precisam de ser servidos para listagens sem a chave E2EE de cada conversa).
- Entrada de utilizador: menu da conta / fluxo próximo do chip (013); entrada de imagem de servidor: **junto aos controlos de dono já existentes** no shell (convite / apagar / menu do servidor) — sem ecrã `/settings` dedicado obrigatório.
- Formatos: JPEG, PNG, WebP; tamanho máximo **1 MiB** por ficheiro (abaixo do limite de 5 MiB dos anexos de chat).
- Remoção explícita (voltar ao fallback) é obrigatória no MVP para avatar de utilizador e imagem de servidor.
- Sem editor de recorte no MVP: ficheiro enviado tal qual; apresentação circular/quadrada via CSS (`object-fit: cover`).
- Propagação a outros clientes: **refetch/navegação** basta no MVP; push WS dedicado fica fora de âmbito.
