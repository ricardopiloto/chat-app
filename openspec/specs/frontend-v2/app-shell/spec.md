# app-shell Specification

## Purpose

Fornece a estrutura de navegação persistente (rail de servidores, sidebar de canais, topbar, painel do utilizador) dentro da qual todas as telas de produto das fases seguintes são renderizadas, incluindo o seu comportamento responsivo e de tema.

## Requirements

### Requirement: Rail de servidores navegável
O sistema SHALL apresentar uma coluna fixa com um botão por servidor do utilizador (imagem do servidor ou iniciais como recurso), indicar visualmente qual servidor está activo, indicar a existência de conteúdo não-lido e de voz activa por servidor, e SHALL expor uma afordance para iniciar a criação de um novo servidor (o fluxo de criação em si é responsabilidade da capability `frontend-v2/server-admin`).

#### Scenario: Navegar entre servidores
- **WHEN** o utilizador clica num botão de servidor diferente do activo
- **THEN** esse servidor passa a ser o activo, a sidebar actualiza para mostrar os seus canais, e o indicador visual de activo move-se para o novo botão

#### Scenario: Indicadores reflectem estado real
- **WHEN** um servidor tem mensagens não lidas ou uma chamada de voz em curso nalgum dos seus canais
- **THEN** o botão desse servidor no rail mostra o indicador correspondente, actualizado a partir dos eventos WS `message.new`/`voice.occupancy` sem necessidade de recarregar a página

### Requirement: Sidebar com estrutura de canais navegável
Para o servidor activo, o sistema SHALL apresentar um cabeçalho (nome do servidor, afordance de definições, afordance de convite), e duas secções de canais — Texto e Voz/vídeo — carregadas via `GET /api/servers/{id}/channels`, cada uma navegável por clique. A criação, edição, ACL e apagar de canais são responsabilidade da capability `frontend-v2/server-admin`; esta capability só SHALL garantir que a lista é lida, apresentada e navegável.

#### Scenario: Selecionar um canal
- **WHEN** o utilizador clica num canal de texto ou de voz/vídeo na sidebar
- **THEN** a rota da aplicação muda para esse canal e esse canal passa a aparecer como seleccionado na sidebar

#### Scenario: Canal privado sinalizado
- **WHEN** um canal tem visibilidade `private`
- **THEN** a sua linha na sidebar mostra um indicador de cadeado, independentemente de o utilizador poder ou não aceder a esse canal

#### Scenario: Servidor sem canais
- **WHEN** o servidor activo não tem nenhum canal
- **THEN** a área de conteúdo principal mostra um estado vazio em vez de uma sidebar de canais em branco sem explicação

### Requirement: Topbar com pontos de entrada globais
O sistema SHALL apresentar uma topbar fixa com o logo oficial, rótulo da instância com versão, um chip de estado E2EE, um ponto de entrada de pesquisa com o atalho visível, um ponto de entrada de notificações (com indicador visual quando há novidades não vistas), um alternador de tema em três ícones e o avatar do utilizador. O conteúdo aberto pelos pontos de entrada de pesquisa e notificações é responsabilidade da capability `frontend-v2/text-chat`; esta capability só SHALL garantir que os pontos de entrada existem, são clicáveis, e (para notificações) reflectem correctamente a existência de novidades não vistas.

#### Scenario: Indicador de notificação não-vista
- **WHEN** existe pelo menos uma notificação (menção, resposta ou canal com novidade) ainda não vista pelo utilizador
- **THEN** o ícone de notificações na topbar mostra um indicador visual de novidade

### Requirement: Alternador de tema de três estados
O sistema SHALL permitir alternar entre tema Sistema, Claro e Escuro a partir de um controlo na topbar, persistir a escolha entre sessões, e aplicar a escolha imediatamente a toda a aplicação sem recarregar a página. Quando o tema é "Sistema", o sistema SHALL seguir a preferência de esquema de cor do sistema operativo e actualizar automaticamente se essa preferência mudar enquanto a aplicação está aberta.

#### Scenario: Persistência entre sessões
- **WHEN** o utilizador escolhe um tema e fecha/reabre a aplicação
- **THEN** o tema escolhido continua activo na nova sessão, sem necessitar de nova selecção

#### Scenario: Reacção a mudança do sistema operativo
- **WHEN** o tema activo é "Sistema" e o sistema operativo muda de claro para escuro (ou vice-versa) com a aplicação aberta
- **THEN** a aparência da aplicação muda automaticamente para acompanhar, sem intervenção do utilizador

### Requirement: Painel do utilizador e menu de conta
O sistema SHALL apresentar um painel fixo no fundo da sidebar com a identidade do utilizador (avatar, indicador online, handle) e um botão de definições que abre um menu de conta (popover) permitindo: editar o nome a mostrar, alterar a foto de perfil, escolher o idioma da interface (Português (BR) / Inglês), e terminar sessão com uma confirmação explícita antes de sair.

#### Scenario: Editar nome a mostrar
- **WHEN** o utilizador altera o campo de nome a mostrar no menu de conta e guarda
- **THEN** o novo nome é persistido no backend e reflectido em qualquer lugar da UI que mostre a identidade do utilizador, sem alterar o handle (que permanece autoritativo para menções e login)

#### Scenario: Confirmação obrigatória ao sair
- **WHEN** o utilizador clica em "Sair" no menu de conta
- **THEN** o sistema pede confirmação explícita antes de encerrar a sessão; a sessão só é encerrada após essa confirmação

### Requirement: Shell colapsa em viewport estreito
Abaixo de 768px de largura, o sistema SHALL colapsar o rail de servidores e a sidebar de canais numa gaveta (drawer) acessível por um botão de hambúrguer na topbar, com um fundo/backdrop que fecha a gaveta ao ser tocado, em vez de manter rail+sidebar permanentemente visíveis e a competir por espaço com o conteúdo principal.

#### Scenario: Abrir a gaveta em ecrã estreito
- **WHEN** a largura da janela é inferior a 768px e o utilizador toca no botão de hambúrguer
- **THEN** a gaveta com rail+sidebar desliza para a vista, sobrepondo o conteúdo principal, com um backdrop que a fecha ao ser tocado

#### Scenario: Volta a desktop
- **WHEN** a largura da janela cresce para 768px ou mais enquanto a gaveta está aberta
- **THEN** o layout volta ao modo desktop (rail+sidebar permanentemente visíveis lado a lado com o conteúdo), sem exigir que o utilizador feche a gaveta manualmente

### Requirement: Painel de Membros do servidor
O sistema SHALL apresentar, num painel lateral direito alternável, os membros do servidor activo agrupados por cargo e por presença (online/offline) com contagem de online, avatar, nome e indicador de presença, actualizado pelos eventos `presence.update`. O painel SHALL começar colapsado por omissão, incluindo em viewport largo, e SHALL permanecer oculto por omissão em viewport estreito.

#### Scenario: Presença em tempo real
- **WHEN** um membro fica online ou offline com o painel aberto
- **THEN** o painel move o membro de grupo e actualiza a contagem sem recarregar

#### Scenario: Painel alternável
- **WHEN** o utilizador alterna o painel de Membros no cabeçalho do canal
- **THEN** o painel abre ou fecha e a preferência é lembrada na sessão

#### Scenario: Estado inicial numa sessão nova
- **WHEN** o utilizador entra num servidor pela primeira vez numa sessão, sem ter alternado o painel antes
- **THEN** o painel de Membros começa colapsado, mesmo em viewport largo

### Requirement: Shell fiel ao mockup
O shell (topbar, rail, sidebar, painel do utilizador, painel de Membros) SHALL cumprir a checklist de `design.md` D7 para `mesa_shell_da_aplica_o_chat_de_texto` e SHALL ser classificado **Fiel** na comparação lado a lado, em tema escuro. Elementos fora de escopo (bandeja de dados, ferramentas VTT, fixar) SHALL NOT ser implementados.

#### Scenario: Comparação de fidelidade do shell
- **WHEN** o shell com um servidor de teste é comparado com o mockup no mesmo estado
- **THEN** todos os elementos obrigatórios estão presentes e nenhum elemento fora de escopo foi acrescentado

### Requirement: Menu de conta e modal de saída fiéis ao mockup
O menu de conta SHALL ser um menu de acções (Minha conta, idioma, tema, Sair) e o modal de saída SHALL explicar o que acontece ao sair, oferecer Cancelar (com atalho Esc) e confirmar com ícone, conforme `mesa_menu_de_conta_popover_modal_de_sair`.

#### Scenario: Sair com explicação
- **WHEN** o utilizador escolhe Sair
- **THEN** o modal descreve o efeito de sair neste dispositivo e só encerra a sessão após confirmação

### Requirement: Linha de canal na sidebar
O sistema SHALL apresentar cada canal da sidebar como uma linha que ocupa a largura inteira da lista, com a mesma largura qualquer que seja o comprimento do nome, de modo que a área realçada e a área clicável para abrir o canal coincidam. A linha SHALL ser realçada em hover e em foco por teclado, e a linha do canal selecionado SHALL manter o seu estado de selecionado e continuar a reagir ao hover sem perder o contraste. Os controlos contextuais de gestão (renomear e opções) SHALL ficar sobre a linha apenas quando estão visíveis; enquanto escondidos, NÃO SHALL receber cliques nem toques.

#### Scenario: Largura igual com nomes curtos e longos
- **WHEN** a lista mostra um canal de nome curto e outro de nome longo
- **THEN** as duas linhas têm a mesma largura, igual à da lista, e o hover realça a linha toda nos dois casos

#### Scenario: Clicar ao lado de um nome curto
- **WHEN** o utilizador clica na linha de um canal de nome curto, à direita do texto e fora dos controlos
- **THEN** o canal é aberto

#### Scenario: Controlos escondidos não interceptam
- **WHEN** o ponteiro ainda não está sobre a linha, ou o dispositivo é de toque e não tem hover, e o utilizador clica ou toca sobre o nome do canal
- **THEN** o canal é aberto e nem a renomeação nem as definições do canal são ativadas

#### Scenario: Toque na zona dos controlos
- **WHEN** o dispositivo não tem hover e o utilizador toca na zona da linha onde os controlos aparecem com um ponteiro
- **THEN** o canal é aberto e a renomeação e as definições só ficam acessíveis pelo toque longo (menu de contexto) ou por teclado

#### Scenario: Foco por teclado
- **WHEN** o foco do teclado chega à linha de um canal gerível
- **THEN** a linha fica realçada, os controlos tornam-se visíveis e acessíveis por teclado, e o botão do canal continua a poder ser ativado

#### Scenario: Canal selecionado com hover
- **WHEN** o ponteiro passa sobre a linha do canal que está selecionado
- **THEN** a linha continua a mostrar que está selecionada, com realce de hover distinguível, sem piscar para o estado de não selecionado

#### Scenario: Gaveta em ecrã pequeno
- **WHEN** a largura da janela é inferior a 768 px e a sidebar está na gaveta
- **THEN** as linhas ocupam a largura da gaveta e tocar no nome abre o canal sem ativar os controlos

### Requirement: Paridade funcional do shell
O sistema SHALL manter todas as funcionalidades de navegação existentes: rail com indicadores em tempo real, lista de canais, cadeado em canais privados, estados vazios, tema persistente com modo Sistema, idioma, edição de nome, avatar, logout com confirmação e gaveta mobile.

#### Scenario: Navegação existente
- **WHEN** cada item de navegação de `docs/v2/parity-checklist.md` é exercido na v2
- **THEN** funciona como na aplicação anterior

### Requirement: O botão de membros usa o glifo de grupo de três pessoas

O controlo que mostra ou esconde o painel de membros SHALL usar o glifo Lucide de uma pessoa à frente e duas ao lado, o mais próximo do Material Symbols `group` desenhado no cabeçalho do canal em `docs/v2/mesa_shell_da_aplica_o_chat_de_texto`. O sistema SHALL NOT usar, nesse controlo, o glifo de duas pessoas lado a lado. O mesmo glifo SHALL aparecer em qualquer controlo que já peça o nome de ícone `group`, incluindo o botão da barra de topo e o do cabeçalho do canal.

#### Scenario: O botão de membros mostra três pessoas

- **WHEN** o painel de membros pode ser mostrado ou escondido
- **THEN** o botão desenha uma pessoa à frente e duas ao lado, e não duas pessoas lado a lado

### Requirement: Faixa de identidade do painel do utilizador fiel ao shell
With the account menu closed, the identity row at the bottom of the shared navigation card SHALL show a 32px avatar with a 10px presence dot, a truncating 12px display name in the existing display font and `on-surface` color, a truncating 11px handle in the existing mono font and `on-surface-variant` color, and a trailing settings button with an 18px icon and 8px corners. The text SHALL leave room for that button. In the idle state the settings button SHALL be the only trailing control; it SHALL continue to open the account menu. The handle SHALL contain only `@handle`, without a presence suffix. The identity row SHALL retain the compact spacing of `mesa_shell_da_aplica_o_chat_de_texto` (about 6px horizontally and 4px vertically, with an 8px gap between avatar and text) and SHALL NOT become a 64px bar with 12px padding. The identity row SHALL retain 8px internal padding and no top border of its own; its presence-dot ring SHALL match the card's `surface-container-high`. Avatars outside this panel SHALL retain their existing sizes and rings.

The user panel SHALL be one card hosted by the shared navigation wrapper in `AppShell.tsx`, visually spanning the server rail and the active sidebar across their combined width without changing either column's width. It SHALL sit at the base of that wrapper with 8px side and bottom margins, at least 8px clearance from content above, 12px corners, a `surface-container-high` background, and `shadow-floating`. Both the server rail's scrollable list and the sidebar's scrollable list SHALL reserve bottom space based on the card's real rendered height, including its bottom offset and clearance, so no server icon or channel is obscured in idle or active-call states. A `ResizeObserver` measurement SHALL update the shared reserved height as the card changes size. During an active call, `CallControls` (mic, deafen, camera, screen share, hang up) and connection-quality state SHALL expand the same card upward, with identity at its bottom and no second panel. The upward-opening `surface-container-high` account menu SHALL remain fully visible without clipping by the card or any ancestor. Controls SHALL have soft `surface-container-highest` hover highlights and visible keyboard focus without moving, scaling, or changing size. The card SHALL move with the existing mobile navigation drawer, remain within its bounds, and maintain the same measured list clearance there. The navigation backdrop SHALL use `surface-container-lowest`, and the header and channel list SHALL retain `surface-container-low`; text and icons SHALL use `on-surface` or `on-surface-variant` as appropriate, with no new color tokens.

#### Scenario: Faixa em repouso
- **WHEN** no call is active and the account menu is closed
- **THEN** the name and handle truncate to leave space for the settings button, the name is 12px and on-surface, the handle is 11px and on-surface-variant without "Online", the avatar is 32px with a 10px presence dot, the settings button is the only trailing control with an 18px icon and 8px corners, and the row is not a 64px bar with 12px padding

#### Scenario: A barra destacada do menu de conta não se aplica em repouso
- **WHEN** the account menu is closed
- **THEN** the handle does not use the secondary color or display "• Online", which belong to the emphasized menu treatment rather than the shell identity row

#### Scenario: Outros avatares ficam iguais
- **WHEN** an avatar appears outside the shared navigation card (message, members, or menu)
- **THEN** its size and presence ring are unchanged by this panel

#### Scenario: Elevated card in both themes
- **WHEN** the navigation is shown in light or dark theme with either sidebar variant
- **THEN** the card spans the server rail and sidebar as one rounded, shadowed surface within its side and bottom margins, distinct from the header and channel list

#### Scenario: Both lists clear the measured card
- **WHEN** the server rail and channel list are scrolled to their ends, whether the card is idle or taller during a call
- **THEN** the last server icon and last channel remain fully visible above the card with at least 8px clearance, and reserved space tracks its rendered height

#### Scenario: Call controls and account menu
- **WHEN** a call is active and the account menu is opened from the expanded user panel
- **THEN** mic, deafen, camera, screen share, hang up, and connection-quality state remain in the same card above identity, and the menu opens upward fully visible without clipping by the card or its ancestors

#### Scenario: Stable control hover
- **WHEN** a user-card control is hovered or receives keyboard focus
- **THEN** it receives a soft color or background highlight or visible focus indicator without shifting, scaling, or changing size

#### Scenario: Mobile drawer clearance
- **WHEN** the combined navigation becomes the narrow-viewport drawer
- **THEN** the card moves with and remains inside the drawer, and both lists reserve its measured height so their final items remain visible in idle and active-call states

### Requirement: Aligned server rail, sidebar, chat, and Members panel tops
The server sidebar header, chat header, and Members panel header SHALL each have a fixed total height of 64px, including the bottom border, with vertically centered content and no shrink. The server rail SHALL remain one scrollable nav without a distinct header element or container. Its 4px top padding and 48px home button SHALL place the divider between the home button and server list at the same 64px alignment line as the three headers' bottom edges. The rail SHALL retain 12px bottom padding and the existing item spacing and button styling. The alignment SHALL hold at narrow viewport widths.

#### Scenario: Desktop alignment
- **WHEN** the server rail, server sidebar, chat view, and Members panel are displayed side by side
- **THEN** the three headers are each 64px tall and their bottom edges align with the rail's divider after its home button

#### Scenario: Narrow viewport alignment
- **WHEN** the chat header uses its narrow viewport spacing
- **THEN** its total height remains 64px, matching the sidebar and Members panel headers and the server rail's divider alignment line

### Requirement: Sidebar corner accent
The server header SHALL have an 8px radius only at its top-left corner, and the scrollable channel list SHALL have an 8px radius only at its bottom-left corner. Their other corners SHALL remain square. The cut corners SHALL reveal the sidebar's `surface-container-lowest` backdrop behind their `surface-container-low` surfaces.

#### Scenario: Visible cut corners
- **WHEN** the sidebar is shown in either light or dark theme
- **THEN** only the server header's top-left and channel list's bottom-left corners reveal a contrasting backdrop, while the other edges remain flush

### Requirement: Call controls in rail-only navigation
When the shell hides its sidebar and leaves only the server rail, the user panel SHALL remain available for identity and account-menu access but SHALL NOT render its embedded call-control row. During a live call away from its channel route, the existing floating player SHALL provide the visible call controls. On routes where the sidebar is shown, the user panel SHALL retain its existing live-call controls.

#### Scenario: Active call on account settings
- **WHEN** a user in a live call opens `/account` and the sidebar collapses to the server rail
- **THEN** the user panel retains its identity and account-menu access without an embedded call-control row, and the floating player remains available for call control

#### Scenario: Return to full-width navigation
- **WHEN** the user leaves `/account` for a route with a visible sidebar while the call remains live
- **THEN** the user panel again renders its embedded call controls at the full navigation width

#### Scenario: No active call
- **WHEN** no call is live on the account route
- **THEN** the user panel still presents its normal identity and account-menu access
