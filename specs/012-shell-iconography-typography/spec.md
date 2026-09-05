# Feature Specification: Iconografia e Tipografia do Shell

**Feature Branch**: `012-shell-iconography-typography`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Melhorias de identidade visual (iconografia e tipografia) no shell da Mesa, com base numa análise de design (perspetiva de designer com histórico Discord/TeamSpeak) sobre o estado atual da aplicação. Problema: a UI é quase inteiramente textual — não existe sistema de ícones; os únicos glifos são caracteres Unicode soltos (☰, ▸, +, #). Isso afeta o reconhecimento de canais de voz, os controlos de chamada ativa (com inconsistência de idioma PT/EN nos rótulos), o indicador de E2EE (o principal sinal de confiança do produto, sem cadeado), a barra superior (sem pesquisa/notificações/definições) e os botões de criar/menu. Tipografia: uma única família sem hierarquia real, e a chave E2EE mostrada para backup manual não usa fonte monoespaçada, criando ambiguidade de caracteres (0/O, 1/l/I). Pedido: sistema de iconografia consistente substituindo os glifos de texto identificados, hierarquia tipográfica reforçada, fonte monoespaçada para valores técnicos copiáveis, e correção da inconsistência de idioma nos controlos de chamada. Escopo: apenas front-end, sem mudanças de API/backend."

## Clarifications

### Session 2026-09-04

- Q: Os ícones de pesquisa/notificações/definições na barra superior devem ser apenas afordance visual, ou entry points funcionais reais, dado que o âmbito exclui mudanças de backend? → A: Entry points funcionais reais, implementados inteiramente no cliente sobre dados/endpoints já existentes (sem novos endpoints de backend). A pesquisa restringe-se ao conteúdo dentro da visibilidade atual do utilizador — apenas servidores/canais dos quais é membro, conforme convites aceites — podendo obter mensagens via endpoints de listagem já existentes, não apenas o que já esteja em memória na sessão.
- Q: Os controlos de chamada ativa (microfone/câmara/sair) devem manter rótulo de texto visível junto ao ícone, ou ser apenas ícone? → A: Ícone acompanhado de um rótulo de texto curto e fixo (mesmo padrão do protótipo de referência); o rótulo nunca muda entre os estados ligado/desligado — só o ícone muda de forma.

### User Story 1 - Reconhecer o estado da chamada e da encriptação sem ler texto (Priority: P1)

Durante uma chamada de voz/vídeo ativa, um membro precisa de confirmar rapidamente se o seu microfone e câmara estão ligados, e se a conversa continua encriptada ponta-a-ponta, sem ter de parar para ler rótulos de texto que mudam de conteúdo e de idioma consoante o estado.

**Why this priority**: É o momento de maior tensão de uso (ao vivo, muitas vezes enquanto se fala/joga) e o de maior valor de confiança do produto (a promessa central é "o servidor não lê o conteúdo"). É também onde o problema atual é mais grave: os rótulos de microfone/câmara alternam entre português e inglês consoante o estado, e o indicador de encriptação não tem nenhum símbolo de cadeado.

**Independent Test**: Pode ser testado isoladamente entrando num canal de voz, alternando microfone e câmara várias vezes e observando se (a) o botão mantém a largura e o idioma do rótulo, (b) o estado ligado/desligado é reconhecível pela forma do ícone sem ler o texto, e (c) o indicador de E2EE mostra um cadeado fechado quando ativo e um símbolo de aviso/cadeado aberto quando desligado para gravação.

**Acceptance Scenarios**:

1. **Given** um utilizador com o microfone ligado numa chamada, **When** este observa o botão de microfone, **Then** o ícone mostra visualmente o estado "ligado" e o rótulo de texto associado permanece no mesmo idioma que no estado "desligado".
2. **Given** um utilizador que desliga a câmara durante a chamada, **When** o estado muda, **Then** a largura do botão não varia e o ícone muda de forma para indicar "desligada", sem depender só da cor.
3. **Given** um canal de voz com E2EE ativa, **When** o utilizador olha para o indicador de E2EE (chip ou banner), **Then** vê um ícone de cadeado fechado associado ao estado ativo.
4. **Given** um canal de voz com E2EE temporariamente desligada para gravação, **When** o utilizador olha para o banner de aviso, **Then** vê um ícone de cadeado aberto/aviso distinto do estado ativo, além do texto explicativo existente.

---

### User Story 2 - Distinguir canais e navegar o shell por reconhecimento visual (Priority: P2)

Um membro a navegar na barra lateral de canais e na barra superior consegue distinguir canais de texto de canais de voz, e localizar ações comuns (criar canal, abrir/fechar o menu, pesquisar, ver notificações, abrir definições) por ícones reconhecíveis, em vez de depender de caracteres de texto genéricos ou da ausência total do controlo.

**Why this priority**: Afeta o uso diário contínuo (navegação), mas tem impacto por sessão menor do que os controlos de chamada ao vivo da User Story 1. É também onde a app mais se afasta visivelmente das referências do género (Discord/TeamSpeak), o que gera uma perceção de produto menos acabado.

**Independent Test**: Pode ser testado isoladamente navegando na barra lateral e na barra superior sem interagir com nenhuma chamada: verificar que canais de voz têm um ícone distinto de canais de texto, que os botões "criar canal" e "menu" usam ícones nítidos (não caracteres de texto crus), e que a barra superior expõe pesquisa (limitada ao conteúdo visível ao utilizador), notificações (baseadas em eventos já recebidos) e definições (consolidando controlos existentes) como funcionalidades reconhecíveis e operantes.

**Acceptance Scenarios**:

1. **Given** uma lista de canais com secções de texto e de voz, **When** o utilizador olha a lista sem ler os nomes, **Then** consegue identificar quais são canais de voz pelo ícone associado a cada item.
2. **Given** o utilizador é dono/criador de canais num servidor, **When** procura o botão para criar um novo canal, **Then** encontra um ícone de "adicionar" com tamanho e alinhamento consistentes, igual em ambos os temas claro/escuro.
3. **Given** o utilizador está numa janela estreita (mobile/tablet), **When** abre o menu de navegação, **Then** o afordance para abrir/fechar usa um ícone reconhecível de menu, não um carácter de texto solto.
4. **Given** o utilizador está na barra superior, **When** procura pesquisar mensagens, ver notificações ou abrir definições, **Then** encontra um ícone dedicado para cada uma dessas ações.
5. **Given** o utilizador é membro de vários servidores por ter aceitado convites diferentes, **When** usa a pesquisa na barra superior, **Then** os resultados abrangem apenas conteúdo dos servidores/canais aos quais tem acesso, nunca de servidores fora da sua visibilidade.
6. **Given** chega uma nova mensagem num canal que o utilizador não tem aberto no momento, **When** este olha para o ícone de notificações, **Then** vê um indicador de atividade nova, calculado a partir de eventos já recebidos pela ligação em tempo real da sessão atual.
7. **Given** o utilizador quer mudar o tema ou terminar sessão, **When** abre o ícone de definições, **Then** encontra esses controlos consolidados numa página de definições, em vez de espalhados soltos na barra superior.

---

### User Story 3 - Copiar valores técnicos sem ambiguidade de caracteres (Priority: P3)

Um utilizador que precisa de guardar manualmente a chave de mídia de um canal de voz (para religar E2EE depois de gravar), ou de ler/comparar um handle ou identificador, consegue distinguir sem esforço caracteres visualmente parecidos (zero vs. "O", "1" vs. "l" vs. "I").

**Why this priority**: É um problema real de usabilidade/segurança, mas ocorre num momento pontual (criação de servidor/canal de voz), não contínuo como as User Stories 1 e 2 — por isso fica em terceiro lugar, sem deixar de ser obrigatório.

**Independent Test**: Pode ser testado isoladamente abrindo o diálogo de criação de canal de voz (ou servidor) e verificando se a chave de mídia apresentada usa um tipo de letra monoespaçado que distingue claramente 0/O e 1/l/I, e se essa mesma regra tipográfica se aplica a outros valores técnicos copiáveis da aplicação (handles, identificadores).

**Acceptance Scenarios**:

1. **Given** o diálogo de criação de um canal de voz, **When** a chave de mídia é apresentada para cópia/backup, **Then** é apresentada com um tipo de letra monoespaçado que distingue visualmente caracteres ambíguos.
2. **Given** qualquer outro valor técnico copiável apresentado ao utilizador (por exemplo, um identificador), **When** este é mostrado na interface, **Then** segue a mesma convenção tipográfica monoespaçada usada para a chave de mídia.

---

### Edge Cases

- O que acontece se um ícone não carregar (falha de rede/asset bloqueado)? A ação continua a ser identificável (nome acessível para leitores de ecrã, e um estado visual de reserva não vazio).
- Como é que o estado "ligado/desligado" (microfone, câmara, E2EE) é transmitido a utilizadores que não distinguem cor (daltonismo) ou que usam leitor de ecrã? O estado não pode depender só de cor — precisa de diferença de forma/ícone e de texto/rótulo acessível equivalente.
- O que acontece em janelas muito estreitas onde nem todos os ícones da barra superior cabem (pesquisa, notificações, definições, utilizador)? Deve haver uma prioridade clara de que ícones permanecem visíveis e quais colapsam num menu secundário.
- Como se distingue visualmente um canal de voz "normal" de um canal de voz onde o próprio utilizador está atualmente em chamada? O ícone de canal de voz precisa de um estado adicional para "em chamada agora", sem se confundir com o ícone genérico de canal de voz.
- O que acontece quando o rótulo textual de um controlo de chamada seria muito longo num ecrã estreito? O ícone deve continuar a comunicar o estado mesmo que o texto seja abreviado ou ocultado.
- O que acontece com atividade ocorrida antes do início da sessão atual (por exemplo, mensagens enviadas enquanto o utilizador estava desligado)? Não é refletida no indicador de notificações, uma vez que este depende apenas de eventos recebidos em tempo real durante a sessão atual, sem histórico de "não lido" persistido no servidor.
- O que acontece quando a pesquisa é executada sobre um canal cujo histórico ainda não foi obtido do cliente? O cliente deve poder pedi-lo através do endpoint de mensagens já existente antes de devolver resultados, sempre dentro do âmbito de acesso do utilizador.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE apresentar cada canal de voz/vídeo na lista de canais com um ícone dedicado de voz, visualmente distinto do ícone/marcador usado para canais de texto.
- **FR-002**: O sistema DEVE representar os controlos de chamada ativa (microfone, câmara, sair da chamada) através de um ícone acompanhado de um rótulo de texto curto e fixo; o estado ligado/desligado é transmitido pela forma do próprio ícone, e o rótulo permanece igual em ambos os estados (não é substituído por outro texto).
- **FR-003**: Os rótulos de texto dos controlos de chamada DEVEM permanecer no mesmo idioma independentemente do estado ligado/desligado (sem alternância entre português e inglês).
- **FR-004**: A largura dos controlos de chamada (microfone, câmara) NÃO DEVE variar visivelmente entre os estados ligado e desligado.
- **FR-005**: O indicador de estado de E2EE (tanto o indicador persistente do canal como o aviso temporário durante gravação) DEVE incluir um ícone de cadeado, com uma forma distinta para "encriptação ativa" e outra para "encriptação desligada/aviso".
- **FR-006**: A barra superior DEVE disponibilizar pesquisa, notificações e definições como funcionalidades reais (não apenas afordances visuais), implementadas inteiramente no cliente sobre dados e endpoints já existentes, sem exigir novos endpoints de backend.
- **FR-007**: Todo o controlo cuja ação seja comunicada principal ou exclusivamente por ícone DEVE ter um nome acessível equivalente (perceptível por tecnologia de apoio) que descreva a mesma ação ou estado comunicado visualmente.
- **FR-008**: Os afordances de "criar canal" e de "abrir/fechar menu de navegação" DEVEM usar ícones nítidos e com alinhamento/tamanho consistentes, substituindo os carateres de texto/Unicode atualmente usados para esse fim.
- **FR-009**: O sistema DEVE apresentar qualquer valor técnico que o utilizador possa precisar de copiar ou transcrever manualmente (incluindo, no mínimo, a chave de mídia de canais de voz mostrada para backup) num tipo de letra monoespaçado que distinga claramente caracteres visualmente ambíguos.
- **FR-010**: O sistema DEVE aplicar essa mesma convenção tipográfica monoespaçada a outros valores técnicos copiáveis existentes na interface (por exemplo, identificadores e handles apresentados para cópia).
- **FR-011**: O sistema DEVE estabelecer uma diferenciação tipográfica entre títulos/cabeçalhos de secção e texto de corpo/interface que vá além do peso da fonte (por exemplo, escala e espaçamento entre letras), de forma a reforçar a hierarquia visual.
- **FR-012**: Todos os ícones introduzidos DEVEM manter legibilidade e contraste adequados tanto no tema claro como no tema escuro existentes.
- **FR-013**: Nenhuma mudança desta funcionalidade DEVE alterar contratos de API, modelos de dados ou comportamento do backend — o âmbito é exclusivamente de apresentação na interface.
- **FR-014**: A pesquisa DEVE abranger apenas conteúdo dentro da visibilidade atual do utilizador — ou seja, apenas os servidores e canais dos quais é membro, conforme convites aceites — sem devolver resultados de servidores/canais fora do seu acesso.
- **FR-015**: A pesquisa PODE obter mensagens de canais aos quais o utilizador tem acesso através dos endpoints já existentes de listagem de mensagens, não estando limitada apenas ao que já esteja carregado em memória na sessão atual.
- **FR-016**: O indicador de notificações DEVE basear-se exclusivamente em eventos já recebidos pelo cliente através da ligação em tempo real existente (por exemplo, novas mensagens em canais que não estejam abertos no momento), sem introduzir novo estado de "lido/não lido" persistido no servidor.
- **FR-017**: A página de definições DEVE consolidar os controlos já existentes na aplicação (tema claro/escuro, sessão/conta) numa única superfície acedida pelo ícone de definições, sem introduzir novos dados de configuração que exijam suporte de backend.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste de reconhecimento visual, participantes identificam corretamente quais itens de uma lista de canais mista são canais de voz, sem ler os nomes dos canais, em pelo menos 95% das tentativas.
- **SC-002**: Em teste de uso ao vivo, participantes identificam corretamente se o microfone/câmara estão ligados ou desligados, olhando apenas para o ícone (sem ler texto), em menos de 1 segundo, em pelo menos 9 de cada 10 tentativas.
- **SC-003**: 100% dos participantes expostos ao indicador de E2EE conseguem afirmar corretamente se a encriptação está ativa ou desligada sem ler o texto circundante, apenas pelo ícone.
- **SC-004**: Zero variações de largura observadas nos botões de microfone/câmara ao alternar entre os estados ligado e desligado, em verificação visual.
- **SC-005**: Em teste de transcrição manual de uma chave de mídia apresentada na interface, a taxa de erros de ambiguidade de caracteres (0/O, 1/l/I) cai para próximo de zero, face à taxa observada com a tipografia anterior.
- **SC-006**: 100% dos controlos que comunicam ação ou estado principalmente por ícone têm um nome acessível verificável (por exemplo, através de auditoria de acessibilidade).
- **SC-007**: Em teste com um utilizador membro de múltiplos servidores, 0% dos resultados de pesquisa provêm de servidores/canais aos quais não tem acesso.
- **SC-008**: 100% dos controlos hoje dispersos na barra superior (tema, sessão) são encontrados pelos participantes dentro da nova página de definições, num teste de localização de controlo.

## Assumptions

- O objetivo é introduzir um sistema de iconografia coerente (um único conjunto visual, com o mesmo peso/estilo de traço) e não ícones avulsos escolhidos caso a caso; a escolha da tecnologia concreta para os implementar (biblioteca vs. SVG próprio) é uma decisão de implementação fora do âmbito desta especificação.
- Os idiomas de interface existentes na aplicação (atualmente português) mantêm-se; a correção pedida é apenas a consistência de idioma entre estados de um mesmo controlo, não a introdução de internacionalização nova.
- A tipografia de corpo/interface existente (família única atual) pode ser mantida como base; o pedido é reforçar a hierarquia e introduzir uma família monoespaçada dedicada a valores técnicos copiáveis, não substituir a identidade tipográfica geral da marca.
- "Valores técnicos copiáveis" inclui, no mínimo, chaves de mídia E2EE mostradas para backup, handles/identificadores de utilizador e códigos de convite — qualquer outro valor semelhante encontrado durante a implementação deve seguir a mesma convenção.
- A pesquisa, as notificações e a página de definições são funcionalidades reais implementadas apenas no cliente, usando dados e eventos já disponíveis (endpoints de mensagens existentes, eventos WebSocket já emitidos, e controlos já existentes de tema/conta) — nenhuma delas requer novos endpoints, novo estado persistido no servidor, ou alterações ao modelo de dados do backend. O "lido/não lido" de notificações não sobrevive a um reinício de sessão, por não existir persistência desse estado no servidor.
- Testes de usabilidade citados nos critérios de sucesso (SC-001 a SC-008) podem ser conduzidos de forma informal (por exemplo, com a equipa e utilizadores beta), não exigem um laboratório de usabilidade formal.
