# Feature Specification: Painel principal alinhado ao servidor seleccionado

**Feature Branch**: `041-server-scoped-pane`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description (inicial + follow-up): o painel principal deve reflectir o servidor seleccionado; servidor sem canais → ecrã em branco com piada. Follow-up: «quando há troca de canal/servidor, a troca é feita e aparece a mensagem de que não há canais activos, porém no server rail [navegação] ainda mostra o [servidor/canal] anterior como seleccionado.»

**Depends on**: navegação de servidores/canais na shell; área principal do canal (texto/voz); rail de servidores + lista de canais.

## Clarifications

### Session 2026-09-06

- Q: Qual canal abrir ao mudar para um servidor que tem canais? → A: Preferir o último canal visitado nesse servidor (se ainda existir); senão o primeiro canal de texto; senão o primeiro canal de qualquer tipo.
- Q: Memória do último canal sobrevive a reload? → A: Sim — persistir por servidor no browser/dispositivo (preferência local).
- Q (follow-up): Painel vazio ok mas selecção na rail/lista fica no anterior? → A: MUST sincronizar o destaque visual — rail de servidores e lista de canais reflectem o servidor (e ausência de canal activo) da vista actual.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Trocar de servidor limpa o canal do servidor anterior (Priority: P1)

Como membro de vários servidores, quando selecciono outro servidor na barra lateral, quero que a área principal deixe de mostrar o canal (texto ou voz) do servidor de onde vim, para não misturar conversas e contextos.

**Why this priority**: Bug/comportamento confuso de produto — o painel pode continuar a mostrar `# geral` (ou outro canal) do servidor anterior depois da troca.

**Independent Test**: Abrir um canal de texto no servidor A → seleccionar servidor B na rail → a área principal **não** continua a mostrar o canal de A (mensagens/cabeçalho de A).

**Acceptance Scenarios**:

1. **Given** estou a ver um canal de texto do servidor A, **When** selecciono o servidor B na barra de servidores, **Then** a área principal deixa de apresentar o conteúdo desse canal de A (título, mensagens e subtítulo do canal de A).
2. **Given** estou a ver a mesa/voz do servidor A, **When** selecciono o servidor B, **Then** a área principal deixa de apresentar a mesa desse canal de voz de A como se ainda fosse o canal activo de B.
3. **Given** troquei de A para B, **When** volto a seleccionar A, **Then** a área principal só mostra conteúdo de A (não resíduos de B).

---

### User Story 2 - Servidor com canais: entrar num canal desse servidor (Priority: P1)

Como membro, ao mudar para um servidor que **tem** canais, quero que a área principal passe a reflectir **esse** servidor — tipicamente abrindo um canal válido desse servidor (ou um estado neutro desse servidor), nunca um canal de outro.

**Why this priority**: Completa a correção da US1 com o caminho feliz quando há canais.

**Independent Test**: Servidor B com pelo menos um canal → seleccionar B a partir de um canal de A → o painel mostra um canal (ou estado) claramente de B.

**Acceptance Scenarios**:

1. **Given** o servidor B tem pelo menos um canal e eu estava noutro servidor, **When** selecciono B, **Then** a área principal abre um canal de B pela regra: último visitado em B (se ainda existir) → senão primeiro texto → senão primeiro de qualquer tipo — nunca o canal de A.
2. **Given** seleccionei B e abri um canal de B, **When** olho o cabeçalho/área de mensagens (ou mesa), **Then** o canal apresentado pertence a B.
3. **Given** em B visitei o canal X, mudei para A e volto a B, **When** a área principal actualiza, **Then** tenta reabrir X se X ainda existir em B.
4. **Given** visitei o canal X em B, **When** recarrego a página e selecciono B de novo, **Then** a app tenta reabrir X se ainda existir (memória local por servidor).

---

### User Story 3 - Servidor sem canais: ecrã em branco com piada (Priority: P1)

Como membro de um servidor que ainda não tem canais, quero ver uma **área principal genérica em branco** com uma **mensagem aleatória leve** (piada simples), em vez de um canal fantasma de outro servidor ou um erro técnico.

**Why this priority**: Pedido explícito; cobre o vazio de produto após a troca de servidor.

**Independent Test**: Servidor sem canais → seleccioná-lo → painel branco + uma frase de humor simples (não vazia de sentido); ao reentrar/seleccionar de novo, a frase pode mudar (aleatória).

**Acceptance Scenarios**:

1. **Given** o servidor seleccionado não tem nenhum canal, **When** a área principal actualiza, **Then** vejo um ecrã genérico em branco (sem lista de mensagens, sem mesa de voz, sem cabeçalho de canal de outro servidor).
2. **Given** esse ecrã vazio, **When** leio a mensagem central, **Then** é uma piada ou frase humorística simples, em português do produto (PT-BR).
3. **Given** o servidor continua sem canais, **When** saio e volto a seleccioná-lo (ou refresco a vista vazia), **Then** a mensagem apresentada é escolhida de forma aleatória de um conjunto curto de piadas (pode repetir por acaso).
4. **Given** mais tarde alguém cria o primeiro canal nesse servidor e eu o abro (ou a app navega para ele), **When** o canal existe, **Then** o ecrã de piada **deixa de** ser mostrado e o canal normal aparece.

---

### User Story 4 - Selecção na rail/lista alinhada ao painel (Priority: P1)

Como membro, depois de mudar de servidor (incluindo para um servidor **sem** canais), quero que a **barra de servidores** e a **lista de canais** mostrem correctamente o que está seleccionado — o novo servidor activo, e **nenhum** canal do servidor anterior marcado como activo — para o chrome de navegação não mentir sobre onde estou.

**Why this priority**: Bug reportado após a troca: o painel já mostra o estado vazio/piada, mas a rail/lista continua a destacar o item anterior.

**Independent Test**: Em A com canal activo → seleccionar B sem canais → painel com piada **e** rail com B activo **e** nenhum canal de A com estilo «seleccionado/activo» na lista de B (lista vazia ou sem highlight stale).

**Acceptance Scenarios**:

1. **Given** estou no servidor A com um canal destacado como activo, **When** selecciono o servidor B (com ou sem canais), **Then** a rail de servidores destaca **B** (não A).
2. **Given** seleccionei B e B tem **zero** canais (painel de piada visível), **When** olho a lista de canais / chrome de navegação, **Then** **nenhum** canal do servidor A permanece visualmente seleccionado/activo.
3. **Given** seleccionei B e B tem canais e a app abriu um canal de B, **When** olho a lista, **Then** o highlight de canal activo corresponde a esse canal de B (não ao canal anterior de A).
4. **Given** o painel principal já reflecte B, **When** comparo com a rail, **Then** o servidor destacado na rail é o mesmo B (chrome e painel coerentes).

---

### Edge Cases

- Servidor com só canais de voz vs só texto: ainda «tem canais» — **não** mostrar o ecrã de piada; aplicar US1/US2.
- Utilizador em chamada de voz no servidor A e selecciona B: a área principal deve reflectir B (US1/US2/US3); a chamada em A pode continuar em segundo plano (PiP / sessão persistente) **sem** fazer o painel principal fingir que ainda está no canal de A.
- Servidor B com canais mas o canal na URL ainda é de A: a app MUST corrigir o estado para não renderizar o canal de A.
- Piadas: sem conteúdo ofensivo, político ou dirigido a menores; tom leve adequado a uma mesa de jogo/chat.
- Servidor acabado de criar que ainda provisiona canais por defeito: se na prática já existem canais «geral»/«mesa», US3 não se aplica; US3 é para **zero** canais listáveis.
- Destaque «activo» na lista de canais baseado só no id da URL enquanto a URL ainda aponta ao canal de A: MUST NOT deixar A destacado depois de o utilizador ter seleccionado B e o painel já ser de B (corrige o stale highlight).
- Rail de servidores: o servidor com estado `active` / seleccionado MUST ser o da vista actual, mesmo na rota `/servers/:id` (vazio), não o último servidor que tinha um `/channels/...` aberto.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A área principal (painel do canal) MUST reflectir apenas o **servidor actualmente seleccionado** na navegação.
- **FR-002**: Ao mudar o servidor seleccionado, a aplicação MUST NOT continuar a apresentar um canal (texto ou voz) que pertença ao servidor anterior.
- **FR-003**: Se o servidor seleccionado tiver um ou mais canais, a área principal MUST navegar para um canal válido desse servidor pela regra: (1) último canal visitado **nesse** servidor, se ainda existir; (2) senão o primeiro canal de texto; (3) senão o primeiro canal de qualquer tipo — e MUST NOT permanecer num canal de outro servidor.
- **FR-009**: A aplicação MUST recordar o último canal visitado **por servidor** no dispositivo/browser actual e restaurar essa preferência após reload da página (sem exigir conta nova no servidor).
- **FR-004**: Se o servidor seleccionado tiver **zero** canais, a área principal MUST mostrar um ecrã genérico em branco (sem UI de canal activo).
- **FR-005**: No ecrã sem canais, a aplicação MUST mostrar uma mensagem aleatória escolhida de um conjunto pequeno de piadas simples em PT-BR.
- **FR-006**: O ecrã de piada MUST desaparecer quando o utilizador passa a ter/ver um canal nesse servidor.
- **FR-007**: A escolha da piada MUST parecer aleatória entre visitas ao estado vazio (não é obrigatório garantir unicidade estrita a cada troca).
- **FR-008**: Esta feature MUST NOT impedir a sessão de voz persistente noutro servidor (se existir); apenas garante que o **painel principal** não mostra o canal do servidor não seleccionado.
- **FR-010**: Após o utilizador seleccionar um servidor, a **rail de servidores** MUST destacar visualmente esse servidor (e MUST NOT manter o destaque no servidor anterior).
- **FR-011**: Quando a área principal está no estado vazio (zero canais) ou num canal do servidor S, a lista de canais MUST NOT mostrar um canal de **outro** servidor como seleccionado/activo.
- **FR-012**: O chrome de navegação (rail + lista de canais) e a área principal MUST permanecer coerentes: o servidor (e canal, se houver) apresentados como seleccionados correspondem ao conteúdo do painel.

### Key Entities

- **Servidor seleccionado**: o servidor activo na barra de servidores / contexto de navegação.
- **Canal activo no painel**: canal cujo conteúdo preenche a área principal; MUST pertencer ao servidor seleccionado, ou não existir (estado vazio).
- **Último canal por servidor**: preferência local (por browser/dispositivo) do último canal aberto em cada servidor; usada na regra FR-003/FR-009.
- **Estado vazio do servidor**: vista sem canal, com fundo neutro e uma piada aleatória.
- **Piada**: texto curto humorístico da lista curada do produto.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 10 trocas manuais A→B com canais em ambos, 10/10 vezes o painel deixa de mostrar o canal de A após seleccionar B.
- **SC-002**: Em servidor sem canais, 100% das aberturas mostram ecrã em branco + exactamente uma mensagem de piada visível (não erro técnico genérico tipo «Canal não encontrado» como substituto da piada).
- **SC-003**: Em 5 visitas ao mesmo servidor vazio, pelo menos 2 mensagens distintas do conjunto aparecem (amostra informal de aleatoriedade; se o conjunto for pequeno, aceitar repetição ocasional desde que a seleção não seja fixa/hardcoded a uma única frase estática).
- **SC-004**: Utilizadores de teste não descrevem o bug «estou no servidor B mas vejo o chat do A» após a entrega.
- **SC-005**: Após visitar canal X no servidor B, reload, e voltar a B, em 5 de 5 testes a app reabre X se X ainda existir.
- **SC-006**: Em 5 de 5 trocas para um servidor sem canais, a rail destaca o novo servidor e nenhum canal do servidor anterior permanece com estilo activo na lista.
- **SC-007**: Em 5 de 5 trocas A→B com canais, o highlight de canal activo na lista corresponde ao canal de B aberto (não ao de A).

## Assumptions

- «Nenhum canal criado» significa zero canais listáveis para o membro nesse servidor (texto e voz).
- Há um conjunto curto (≥3) de piadas simples curadas no produto; a lista exacta fica para o plano/implementação.
- Memória do último canal por servidor: preferência **local** no browser (não sincronizada entre dispositivos nesta entrega).
- Chamada activa noutro servidor pode continuar (028/038); o painel principal não deve «ancorar» visualmente nesse canal quando outro servidor está seleccionado.
- O ecrã vazio não substitui a sidebar: a lista de canais vazia e acções «criar canal» (se o utilizador tiver permissão) podem continuar na coluna lateral.
