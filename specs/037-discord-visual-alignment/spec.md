# Feature Specification: Alinhamento Visual com Discord

**Feature Branch**: `037-discord-visual-alignment`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Análise comparativa de design/UI entre Discord e a aplicação Mesa. Identificar diferenças visuais (fontes, iconografia, sombras, efeitos, combinação de cores, estilos) e propor melhorias, sem alterar a identidade de marca já estabelecida (nome Mesa, accent roxo, layout geral do shell) nem a arquitetura/fluxos existentes."

## Clarifications

### Session 2026-09-06

- Q: O indicador de atividade na barra de servidores (FR-004) inclui tracking real de mensagens não lidas nesta feature, ou só cromado visual / outro sinal? → A: Inclui tracking de mensagens não lidas + indicador na barra (Option B).
- Q: O que conta como mensagem “não lida” para acender o indicador do servidor? → A: Qualquer mensagem de texto nova em qualquer canal do servidor até a usuária ver esse canal / avançar a leitura (Option A); menções não têm distintivo separado nesta feature.
- Q: Com unread de texto e chamada de voz activa no mesmo servidor, qual a prioridade visual na barra? → A: Ambos visíveis ao mesmo tempo, em posições/formas distintas (unread ≠ voz) (Option B).
- Q: Forma do indicador de unread na barra de servidores? → A: Só presença — pill/ponto “há novidade”, sem número (Option A).
- Q: Tratamento visual dos controlos primários de chamada (mic, câmera, sair)? → A: Glifos preenchidos/sólidos nos 3 controlos; chrome dos botões mantém-se (Option B).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Identidade tipográfica consistente em qualquer dispositivo (Priority: P1)

Como usuária que acessa a Mesa em diferentes computadores (macOS, Windows, Linux), quero que o texto da aplicação tenha a mesma aparência em todos eles, para que a marca pareça acabada e profissional em vez de "genérica do sistema operacional".

**Why this priority**: É o gap visual de maior impacto e mais visível — toda tela da aplicação é afetada. Hoje a tipografia herda a fonte padrão do sistema operacional, então a mesma tela muda de aparência dependendo de onde é aberta, e no Linux frequentemente renderiza com qualidade inferior.

**Independent Test**: Abrir a aplicação em três sistemas operacionais diferentes (ou emular três pilhas de fontes do sistema) e confirmar visualmente que títulos e corpo de texto usam a mesma família tipográfica e a mesma hierarquia de peso em todos.

**Acceptance Scenarios**:

1. **Given** a usuária abre a Mesa em um computador com macOS, Windows ou Linux, **When** qualquer tela é carregada, **Then** o texto (títulos, corpo, rótulos) usa a mesma família tipográfica em todos os casos, não a fonte padrão de cada sistema.
2. **Given** a tela de um título de seção (ex.: nome do canal, nome do servidor) ao lado de texto de corpo (ex.: mensagem, descrição), **When** comparados lado a lado, **Then** existe uma diferença de peso/hierarquia clara e intencional entre título e corpo, igual em qualquer tela da aplicação.
3. **Given** a aplicação carregando em uma conexão lenta, **When** a fonte ainda não terminou de carregar, **Then** o texto permanece legível com uma fonte de reserva equivalente, sem "flash" de texto invisível.

---

### User Story 2 - Controles de chamada e navegação com afordância mais forte (Priority: P2)

Como usuária em uma chamada de voz/vídeo, quero reconhecer instantaneamente os controles de microfone, câmera e encerrar chamada, e perceber rapidamente qual servidor tem atividade nova, para agir sem precisar ler texto ou procurar com atenção.

**Why this priority**: Afeta diretamente a usabilidade em momentos de uso ativo (durante uma chamada, navegando entre servidores), mas depende da base tipográfica/tokens não ser essencial primeiro — por isso vem em segundo lugar.

**Independent Test**: Entrar em uma chamada de voz e, sem ler nenhum rótulo, apontar corretamente qual botão liga/desliga o microfone, qual liga/desliga a câmera e qual encerra a chamada; separadamente, com um servidor tendo atividade nova, identificar visualmente qual ícone da barra de servidores mudou de estado.

**Acceptance Scenarios**:

1. **Given** a usuária está em uma chamada, **When** ela olha para os controles principais (microfone, câmera, encerrar chamada), **Then** cada um mostra um glifo preenchido/sólido (não só contorno) com aparência de alto contraste que comunica função e estado (ativo/inativo/desabilitado) sem precisar de texto, sobre o chrome de botão já existente.
2. **Given** um servidor na barra lateral recebe atividade nova (mensagem não lida), **When** a usuária olha para a barra de servidores, **Then** existe um indicador de presença (pill/ponto, sem número), diferente de apenas cor de fundo, nesse servidor.
3. **Given** o mesmo servidor tem mensagens não lidas e alguém em voz nesse servidor, **When** a usuária olha para o ícone, **Then** vê indicadores distintos de unread e de voz ao mesmo tempo, sem um substituir o outro.
4. **Given** a usuária passa o cursor ou seleciona um ícone de servidor, **When** o estado muda (hover/ativo), **Then** a transição visual do ícone é perceptível e suave, não uma troca abrupta.

---

### User Story 3 - Painéis e menus com elevação visual consistente (Priority: P3)

Como usuária que abre menus de contexto, o menu da conta, o painel de notificações ou o seletor de desfoque de câmera, quero que todos esses elementos flutuantes pareçam parte do mesmo sistema visual (mesma "altura", mesma sombra), tanto no tema claro quanto no escuro.

**Why this priority**: É uma inconsistência real mas menos visível que P1/P2 — o problema aparece só quando dois desses menus são vistos em sequência ou comparados, e é agravado ao trocar de tema.

**Independent Test**: Abrir cada um dos menus flutuantes da aplicação (menu de contexto, menu de conta, notificações, seletor de desfoque de câmera) no tema claro e no tema escuro, e confirmar que todos usam a mesma "profundidade" visual (mesmo estilo de sombra/contorno), sem nenhum parecendo mais "pesado" ou mais "chapado" que os outros.

**Acceptance Scenarios**:

1. **Given** o tema claro está ativo, **When** qualquer menu flutuante é aberto, **Then** a sombra ao redor do menu é sutil e legível sobre fundo claro (não a mesma sombra escura usada no tema escuro).
2. **Given** o tema escuro está ativo, **When** qualquer menu flutuante é aberto, **Then** a sombra usada é visivelmente a mesma "receita" de profundidade em todos os menus (contexto, conta, notificações, desfoque de câmera), sem variações perceptíveis entre eles.

---

### User Story 4 - Abertura de menus com transição suave (Priority: P4)

Como usuária que abre menus e popovers com frequência, quero que eles apareçam com uma transição suave em vez de surgir instantaneamente, para que a interface pareça mais polida, preservando o que já funciona bem (como os pulsos de "falando" e do indicador de criptografia).

**Why this priority**: É refinamento de percepção de qualidade, de menor impacto funcional que os itens anteriores — melhora a sensação de acabamento sem alterar comportamento.

**Independent Test**: Abrir cada menu/popover da aplicação e observar que ele aparece com uma transição breve (não instantânea) e que, com "reduzir movimento" ativado no sistema operacional, a transição é suprimida ou reduzida sem quebrar a usabilidade.

**Acceptance Scenarios**:

1. **Given** a usuária clica em um botão que abre um menu/popover, **When** o menu aparece, **Then** ele surge com uma transição breve e sutil, em vez de aparecer instantaneamente.
2. **Given** a usuária tem a preferência de sistema "reduzir movimento" ativada, **When** qualquer menu, animação de hover de ícone ou transição de abertura ocorreria, **Then** a transição é removida ou reduzida ao mínimo, sem impedir o uso do recurso.
3. **Given** as animações já existentes de "falando" no roster de voz e do indicador de criptografia ponta a ponta, **When** esta feature é implementada, **Then** essas animações continuam funcionando exatamente como antes.

---

### Edge Cases

- O que acontece se a fonte escolhida não carregar (falha de rede, bloqueio de conteúdo externo)? A aplicação deve cair para uma fonte de reserva do sistema sem quebrar layout ou legibilidade.
- Como o indicador de atividade na barra de servidores se comporta quando há múltiplos tipos de novidade ao mesmo tempo (ex.: mensagem de texto não lida e chamada de voz ativa no mesmo servidor)? **Unread de texto e presença de voz coexistem** em posições/formas distintas no ícone do servidor — nenhum esconde o outro.
- Mensagens em canais que a usuária já tem “em dia” (leitura avançada até à última mensagem) não acendem o indicador; só mensagens posteriores (ou canais ainda nunca abertos com mensagens) contam.
- Como os ícones preenchidos de controle de chamada se comportam em estado desabilitado (ex.: câmera indisponível por permissão do navegador)? Deve haver uma variante visual clara de "desabilitado" distinta de "ativo" e "inativo".
- O que acontece com a transição de abertura de menu se o usuário abrir e fechar o menu rapidamente (clique duplo)? A transição não deve travar o menu em estado intermediário nem impedir o fechamento imediato.
- Como o novo tratamento de sombra se comporta em componentes que hoje já usam sombra customizada ad hoc (context menu, menu de conta, notificações, seletor de desfoque)? Todos devem migrar para a mesma referência visual de elevação, sem exceções.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A aplicação DEVE usar uma família tipográfica própria e consistente (carregada pela aplicação, não dependente da fonte padrão do sistema operacional) para todo texto de interface, com fallback de sistema legível em caso de falha de carregamento.
- **FR-002**: A aplicação DEVE aplicar uma hierarquia de peso tipográfico clara e consistente entre títulos/cabeçalhos e texto de corpo, aplicada uniformemente em todas as telas (servidores, canais, mensagens, configurações, autenticação).
- **FR-003**: Os controles primários de chamada de voz/vídeo (microfone, câmera, encerrar chamada) DEVEM usar **glifos preenchidos/sólidos** (não apenas contorno) que comuniquem claramente estado ativo, inativo e desabilitado; o chrome/layout dos botões da barra de chamada existente DEVE ser preservado (sem redesenho Discord-completo da call bar nesta feature).
- **FR-004**: A aplicação DEVE rastrear, por servidor e por canal de texto, o avanço de leitura da usuária; qualquer mensagem de texto nova num canal ainda não visto (ou com leitura atrasada face à última mensagem) DEVE marcar o servidor como com novidade, e a barra de servidores DEVE exibir um indicador visual de **presença** (pill ou ponto — sem contagem numérica), distinto de apenas mudança de cor de fundo. Menções não exigem distintivo visual separado nesta feature.
- **FR-012**: Ao abrir um canal de texto e ver as mensagens desse canal, a aplicação DEVE actualizar o estado de leitura desse canal de forma a apagar a novidade correspondente; o indicador de unread do servidor DESAPARECE quando nenhum canal desse servidor tiver mensagens não vistas.
- **FR-013**: Quando existir presença de voz activa associada a um servidor (ocupação em canal de voz desse servidor), a barra de servidores DEVE mostrar um indicador de voz distinto do indicador de unread; se unread e voz coincidirem no mesmo servidor, **ambos** DEVEM permanecer visíveis em posições/formas diferentes (não há hierarquia que oculte um sinal).
- **FR-005**: Os ícones de servidor na barra lateral DEVEM apresentar uma transição visual de forma perceptível entre os estados padrão, hover e ativo/selecionado.
- **FR-006**: Todo elemento flutuante da interface (menu de contexto, menu de conta, painel de notificações, seletor de desfoque de câmera, e equivalentes futuros) DEVE usar uma única referência compartilhada de sombra/elevação, sem valores de sombra definidos individualmente por componente.
- **FR-007**: A referência de sombra/elevação DEVE se adaptar ao tema ativo (claro ou escuro), produzindo uma sombra visualmente apropriada para o contraste de cada tema, em vez de uma única receita fixa usada nos dois temas.
- **FR-008**: Todo elemento flutuante da interface DEVE aparecer com uma transição de entrada breve e sutil ao ser aberto.
- **FR-009**: Todas as transições e animações novas introduzidas por esta feature DEVEM respeitar a preferência de sistema de "reduzir movimento", suprimindo ou reduzindo a animação quando essa preferência estiver ativa.
- **FR-010**: As animações existentes (pulso de "falando" no roster de voz, pulso do indicador de criptografia ponta a ponta) DEVEM permanecer funcionando sem alteração de comportamento após esta feature.
- **FR-011**: Nenhuma mudança desta feature DEVE alterar a identidade de marca já estabelecida (nome da aplicação, cor de destaque roxa, estrutura geral do layout de navegação). O escopo é visual/estilístico **excepto** o tracking de leitura/unread e o indicador de presença de voz na barra de servidores (FR-004, FR-012, FR-013), necessários para os sinais de actividade; fluxos de chat/voz existentes (enviar mensagem, entrar/sair de chamada, etc.) não mudam de comportamento para além destes sinais.

### Key Entities

- **Token de tipografia**: representa a família e os pesos de fonte usados em título e corpo; usado por toda a interface.
- **Token de elevação**: representa a "receita" visual de sombra/profundidade para um nível de elevação (ex.: menu flutuante), variando por tema.
- **Indicador de atividade de servidor**: representa o estado de "tem novidade não vista" associado a um servidor na barra de navegação, derivado do tracking de mensagens de texto não lidas por canal; coexistente com um indicador distinto de presença de voz no mesmo ícone quando aplicável.
- **Estado de leitura por servidor**: representa, por canal de texto, o ponto até ao qual a usuária já viu mensagens; actualiza-se ao visualizar canais/mensagens e alimenta o indicador de unread da barra.
- **Estado visual de controle de chamada**: representa a aparência (ativo, inativo, desabilitado) de um controle de mídia durante uma chamada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A aparência de texto (família e hierarquia tipográfica) é idêntica ao comparar capturas de tela da mesma janela em pelo menos três sistemas operacionais diferentes.
- **SC-002**: Em um teste informal de reconhecimento com usuárias que nunca usaram a aplicação, pelo menos 90% identificam corretamente a função de microfone, câmera e encerrar chamada olhando apenas para os ícones, sem ler rótulos.
- **SC-003**: 100% dos elementos flutuantes da interface (menu de contexto, menu de conta, notificações, seletor de desfoque de câmera) usam a mesma referência visual de sombra, verificável tema a tema.
- **SC-006**: Com duas contas no mesmo servidor, quando a conta A envia uma mensagem de texto e a conta B ainda não abriu o canal relevante, a barra de servidores da conta B mostra o indicador de novidade nesse servidor; ao abrir e ver as mensagens, o indicador desaparece.
- **SC-004**: Zero regressões nas animações existentes de "falando" e do indicador de criptografia, confirmadas por teste manual antes/depois.
- **SC-005**: Usuárias avaliando a interface lado a lado com a versão anterior percebem a mudança como "mais polida"/"mais parecida com produtos de chamada profissionais" em pelo menos 80% dos casos, em uma pesquisa informal de preferência A/B.

## Assumptions

- **Fonte tipográfica**: assume-se a adoção de uma família sans-serif humanista de licença livre e ampla disponibilidade (equivalente em espírito à gg sans do Discord), carregada como parte do pacote da aplicação — a escolha exata da família fica a critério da fase de planejamento técnico, desde que atenda aos critérios de hierarquia e fallback definidos aqui.
- **Cores por usuário/role em mensagens**: essa ideia foi levantada na análise comparativa mas está fora do escopo desta feature — depende de um sistema de papéis/permissões que a aplicação ainda não possui de forma visível na interface. Fica registrada como melhoria futura, não como requisito desta spec.
- **Neutralização do fundo escuro com matiz roxo**: por padrão, esta feature NÃO neutraliza o fundo escuro atual (`#161826`) — a mudança de sombra/elevação e tipografia já reduz boa parte da distância de polish percebida sem mexer na identidade cromática de fundo. Uma revisão da paleta de fundo pode ser proposta como feature separada caso, após esta entrega, ainda se perceba distância visual relevante.
- **Escopo de ícones preenchidos**: o requisito de ícones preenchidos (FR-003) se aplica apenas aos **glifos** dos três controles primários de chamada (microfone, câmera, encerrar chamada); o chrome dos botões permanece. Os demais ícones do catálogo permanecem no estilo de contorno atual.
- **Unread na barra de servidores**: o indicador de FR-004 NÃO é apenas cromado visual — esta feature inclui o tracking de mensagens não lidas necessário para acender/apagar o indicador por servidor. O critério é **qualquer** mensagem de texto nova por canal (não só menções); não há badge separado de menções nesta entrega. O unread é **só presença** (pill/ponto), sem número. Unread e presença de voz no mesmo servidor **coexistem** visualmente (FR-013).
- **Compatibilidade**: assume-se que a aplicação continua sendo usada em navegadores modernos com suporte a `prefers-reduced-motion` e a variáveis de tema já existentes na aplicação.
