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
O sistema SHALL apresentar, num painel lateral direito alternável, os membros do servidor activo agrupados por cargo e por presença (online/offline) com contagem de online, avatar, nome e indicador de presença, actualizado pelos eventos `presence.update`, e SHALL ocultá-lo por omissão em viewport estreito.

#### Scenario: Presença em tempo real
- **WHEN** um membro fica online ou offline com o painel aberto
- **THEN** o painel move o membro de grupo e actualiza a contagem sem recarregar

#### Scenario: Painel alternável
- **WHEN** o utilizador alterna o painel de Membros no cabeçalho do canal
- **THEN** o painel abre ou fecha e a preferência é lembrada na sessão

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
