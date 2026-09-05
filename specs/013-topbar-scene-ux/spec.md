# Feature Specification: Topbar, tema e editor de cena

**Feature Branch**: `013-topbar-scene-ux`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Vamos melhorar o campo de pesquisa e o botão de alteração de tema. Botão de tema: ele tem que ser um toggle e o icone tem que mudar junto: clicou ele altera para escuro/claro. Logout deve aparecer como um menu flutuante quando o usuário clicar no nome dele (Canto superior direito). Pesquisa: o usuário deve começar a preencher a pesquisa no campo de pesquisa, sem precisar abrir outra caixa para ele pesquisar. No modo editar cena, ajuste o tamanho dos campos para que eles ocupem toda a tela, tal qual o modelo dentro d docs/design-ref/Mesa - Protótipo v2.dc.html"

**Depends on**: [012-shell-iconography-typography](../012-shell-iconography-typography/) (ícones e topbar com pesquisa/definições já existentes).

## Clarifications

### Session 2026-09-04

- Q: O que acontece ao ícone/painel «Definições» da 012? → A: Remover ícone e painel de Definições (tema + logout passam a ser as únicas entradas canónicas nesta entrega).
- Q: Como se apresenta o campo de pesquisa na topbar? → A: Ícone que expande para campo inline na topbar (sem modal); digitar e resultados no fluxo expandido.
- Q: «Terminar sessão» exige confirmação extra? → A: Diálogo de confirmação antes de encerrar a sessão.
- Q: O ícone do tema mostra o estado actual ou o destino do clique? → A: Ícone = tema actual (sol no claro, lua no escuro).
- Q: Além de «Terminar sessão», o menu de conta mostra mais alguma coisa? → A: Handle/nome (só leitura) + Terminar sessão.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Alternar tema com um clique e ícone claro (Priority: P1)

Como utilizador na barra superior, quero um **único botão de tema** que, ao clicar, alterne entre claro e escuro e **mude o ícone** para reflectir o **tema actual** (ex. sol no claro, lua no escuro) — sem escolher entre dois botões «Escuro»/«Claro» num painel.

**Why this priority**: Pedido explícito; uso frequente; melhora a descoberta do estado do tema.

**Independent Test**: Clicar no toggle de tema → a UI muda de tema e o ícone do botão muda; segundo clique inverte de novo.

**Acceptance Scenarios**:

1. **Given** o tema actual é escuro, **When** observo o botão de tema, **Then** o ícone representa o tema escuro actual (ex. lua); **When** clico, **Then** a interface passa a claro e o ícone passa a representar o tema claro (ex. sol).
2. **Given** o tema actual é claro, **When** clico no mesmo botão, **Then** a interface volta a escuro e o ícone actualiza para o estado escuro.
3. **Given** alterei o tema, **When** recarrego a aplicação, **Then** a preferência de tema permanece (comportamento já esperado da preferência local).

---

### User Story 2 - Terminar sessão a partir do nome do utilizador (Priority: P1)

Como utilizador autenticado, quero clicar no **meu nome / chip** no canto superior direito e ver um **menu flutuante** com o **meu handle/nome (só leitura)** e a acção de terminar sessão, em vez de logout num único clique directo ou só dentro de um painel de definições separado.

**Why this priority**: Pedido explícito; reduz logout acidental e alinha o padrão «menu de conta».

**Independent Test**: Clicar no chip do utilizador → menu abre com handle/nome e «Terminar sessão» → confirmar no diálogo → sessão termina; cancelar no diálogo ou clicar fora fecha sem sair.

**Acceptance Scenarios**:

1. **Given** estou autenticado, **When** clico no nome/avatar no canto superior direito, **Then** aparece um menu flutuante ancorado a esse controlo que mostra o meu handle/nome em só leitura e a acção Terminar sessão.
2. **Given** o menu está aberto, **When** escolho terminar sessão, **Then** aparece um **diálogo de confirmação**; só após confirmar a sessão é encerrada e deixo de ver o shell autenticado.
3. **Given** o diálogo de confirmação está aberto, **When** cancelo, **Then** a sessão continua activa e volto ao shell sem logout.
4. **Given** o menu está aberto (sem ter confirmado logout), **When** clico fora do menu ou pressiono Escape, **Then** o menu fecha e a sessão continua activa.

---

### User Story 3 - Pesquisar no próprio campo da topbar (Priority: P1)

Como membro, quero activar a pesquisa a partir de um **ícone na topbar** que **expande para um campo inline** na barra, digitar aí e ver resultados, **sem** abrir um diálogo/modal separado só para digitar.

**Why this priority**: Pedido explícito; remove o atrito do modal; o ícone compacto poupa espaço na topbar até a pesquisa ser usada.

**Independent Test**: Clicar no ícone de pesquisa → campo inline expande na topbar → digitar ≥2 caracteres → resultados (pop-over/lista anexada); clicar num resultado navega; Escape/fora/limpar recolhe ou limpa de forma previsível.

**Acceptance Scenarios**:

1. **Given** a topbar visível no estado repouso, **When** vejo a área de pesquisa, **Then** vejo um ícone de pesquisa (não um modal); **When** activo o ícone, **Then** um campo de texto **inline na topbar** fica editável.
2. **Given** o campo expandido, **When** digito pelo menos dois caracteres, **Then** a pesquisa corre no âmbito já definido (só servidores/canais a que tenho acesso) e vejo resultados **sem** diálogo modal de pesquisa.
3. **Given** resultados visíveis, **When** escolho um resultado, **Then** navego para o canal correspondente e a pesquisa pode fechar/recolher/limpar-se de forma previsível.
4. **Given** menos de dois caracteres no campo expandido, **When** digito, **Then** não dispara pesquisa completa (evita ruído); o campo continua editável.

---

### User Story 4 - Editor de cena a ocupar o ecrã como no protótipo (Priority: P2)

Como administrador a **editar a cena** de um canal de voz/vídeo, quero que a área de edição (pré-visualização dos slots + painel de layout/banco) **ocupe o espaço útil do painel** de forma semelhante ao ecrã «Editor de cena» do Protótipo v2 — sem campos/controlos comprimidos numa faixa estreita que desaproveite o ecrã.

**Why this priority**: Pedido explícito com referência visual; impacto no trabalho de composição ao vivo; vem depois dos ajustes de topbar por ser ecrã distinto.

**Independent Test**: Entrar em «Editar cena» → layout a duas zonas (pré-visualização dominante + coluna lateral de controlos) preenche a altura/largura disponíveis do painel de voz, alinhado ao modelo do protótipo (grelha flexível à esquerda, coluna ~lateral à direita).

**Acceptance Scenarios**:

1. **Given** estou no modo editar cena, **When** observo o ecrã, **Then** a pré-visualização da grelha e a coluna de controlos (layout / banco) usam a área principal do painel (preenchimento vertical/horizontal), não um bloco pequeno isolado no centro.
2. **Given** uma janela desktop típica, **When** comparo com o protótipo v2, **Then** a composição é reconhecível: área de cena ampla + painel lateral de opções, com cabeçalho de editar (descartar/guardar) no topo.
3. **Given** viewport mais estreito, **When** edito a cena, **Then** o conteúdo permanece utilizável (scroll onde necessário) sem regressar a um formulário «em cartão» minúsculo no meio do ecrã.

---

### Edge Cases

- Tema: cliques rápidos consecutivos não deixam o ícone e o tema dessincronizados.
- Menu de conta: não deve cobrir indevidamente controlos críticos sem poder fechar; não dispara logout só por abrir; cancelar o diálogo de confirmação não encerra a sessão.
- Pesquisa: erros num canal (falha de rede/decifra) não bloqueiam outros resultados; pesquisa vazia / sem matches mostra estado vazio claro.
- Pesquisa em mobile/narrow: o padrão ícone → campo inline permanece usável (sem modal só para digitar); Escape ou clique fora pode recolher o campo expandido sem perder a sessão.
- Editor de cena: sair sem guardar mantém o fluxo de confirmação já existente, se houver; o redimensionamento não esconde Guardar/Descartar.
- Definições (012): o ícone e o painel de Definições são **removidos** nesta entrega; o toggle de tema e o menu de conta são as únicas entradas canónicas para essas acções.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A barra superior MUST expor um **toggle de tema** de um clique que alterna entre claro e escuro.
- **FR-002**: O ícone do toggle de tema MUST representar o **tema actual** (estado visual distinto: ex. sol quando claro, lua quando escuro), não o destino do próximo clique.
- **FR-003**: A preferência de tema MUST continuar a persistir entre visitas da mesma forma que hoje (preferência local do utilizador).
- **FR-004**: Clicar no chip/nome do utilizador (canto superior direito) MUST abrir um **menu flutuante** (não navegar nem terminar sessão só por esse clique).
- **FR-005**: O menu flutuante MUST mostrar o **handle/nome do utilizador em só leitura** e a acção **Terminar sessão**; MUST poder ser dispensado sem terminar sessão (clique fora / Escape).
- **FR-013**: Escolher «Terminar sessão» MUST abrir um **diálogo de confirmação**; a sessão só encerra após confirmação explícita; cancelar MUST manter a sessão activa.
- **FR-006**: A pesquisa MUST começar num **ícone na topbar** que, ao activar, **expande para um campo de texto inline** na própria barra; MUST NOT exigir um diálogo/modal só para introduzir texto.
- **FR-007**: A pesquisa MUST manter o âmbito de segurança/privacidade já estabelecido: apenas conteúdo dos servidores/canais a que o utilizador tem acesso.
- **FR-008**: Resultados da pesquisa MUST aparecer associados ao campo expandido (lista/pop-over anexado), não como um segundo formulário modal obrigatório para digitar.
- **FR-009**: No modo **Editar cena**, o layout MUST ocupar o espaço útil do painel de voz/vídeo de forma análoga ao Protótipo v2: pré-visualização ampla + coluna lateral de controlos (layout/banco), com cabeçalho de edição.
- **FR-010**: O editor de cena MUST preservar as acções existentes de guardar/descartar (ou equivalente) acessíveis no cabeçalho da edição.
- **FR-011**: Esta feature MUST NOT exigir novos endpoints de backend; reutiliza preferência de tema, logout e pesquisa/cliente já existentes.
- **FR-012**: O ícone e o painel de **Definições** introduzidos na 012 MUST ser removidos; não permanece um atalho de Definições vazio na topbar.

### Out of Scope

- Novos temas além de claro/escuro.
- Conta completa (perfil editável, avatar upload, alteração de handle) no menu flutuante — nesta entrega o menu mostra **handle/nome só leitura** + Terminar sessão (com confirmação); sem edição de perfil.
- Alterar o algoritmo de pesquisa para incluir servidores fora do acesso do membro.
- Redesenhar toda a tipografia/iconografia fora do necessário para toggle, menu e campo de pesquisa.
- Mudanças de backend/API.

### Key Entities

- **Preferência de tema**: claro | escuro; o ícone do toggle reflecte o tema **actual** (não o destino).
- **Menu de conta**: superfície flutuante ancorada ao chip; handle/nome só leitura + Terminar sessão (+ diálogo de confirmação).
- **Campo de pesquisa da topbar**: ícone que expande para entrada de texto inline + resultados no fluxo da barra (sem modal).
- **Modo editar cena**: composição de ecrã (pré-visualização + painel lateral) alinhada ao protótipo de referência.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em **100%** das tentativas de amostra, um clique no toggle de tema altera o tema e o ícone reflecte o novo estado em ≤1 s.
- **SC-002**: Em **100%** das tentativas, abrir o chip do utilizador mostra o menu flutuante **sem** terminar sessão; terminar sessão só ocorre após a acção no menu **e** confirmação no diálogo.
- **SC-003**: Em teste com 5 utilizadores, **≥4** conseguem iniciar uma pesquisa activando o ícone e digitando no **campo inline** da topbar sem procurar um «segundo ecrã» modal só para escrever.
- **SC-004**: Em desktop (≥1200px de largura), no modo editar cena, a área de pré-visualização + painel lateral preenche visualmente o painel de voz (sem «cartão» centrado com grande espaço vazio à volta), reconhecível face ao Protótipo v2.
- **SC-005**: **0** regressões de âmbito: pesquisa nunca devolve conteúdo de servidores aos quais o utilizador não pertence.

## Assumptions

- A feature 012 já entregou ícones, pesquisa (via diálogo) e painel de definições; esta feature **refina a UX** da topbar e o layout do editor.
- Ícones de sol/lua (ou equivalentes) encaixam no sistema de ícones SVG existente; sol = tema claro activo, lua = tema escuro activo.
- O menu flutuante de conta substitui o logout directo do chip; inclui handle/nome só leitura + Terminar sessão; «Terminar sessão» exige diálogo de confirmação antes de encerrar; o toggle substitui o segmento Escuro/Claro; o painel/ícone de Definições é removido (sem espelho residual de tema/logout).
- Referência visual obrigatória para o editor: `docs/design-ref/Mesa - Protótipo v2.dc.html` (ecrã «Editor de cena (admin)» — grelha flex + coluna ~296px).
- Comportamento de pesquisa (debounce, mínimo de caracteres, decifra client-side) mantém-se em espírito; o padrão UI é **ícone → campo inline** (sem modal), com resultados anexados ao campo expandido.
