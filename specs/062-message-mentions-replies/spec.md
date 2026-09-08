# Feature Specification: Menções @ e resposta a mensagens

**Feature Branch**: `062-message-mentions-replies`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Vamos aplicar marcação de usuário e resposta a mensagens específicas. Marcação de usuário: o usuário pode digitar @username para mandar uma mensagem para um usuário específico naquele canal (somente texto), isso deve gerar uma notificação para o usuário em [botão Notificações do topbar]. Resposta a mensagens específicas: ao passar o mouse acima de uma mensagem, o usuário pode selecionar um ícone que será utilizado para enviar uma resposta aquela mensagem específica, isso gera uma notificação ao usuário que enviou a mensagem original."

**Addendum (2026-09-08)**: Mensagens onde o utilizador é mencionado ou recebe resposta MUST ser **destacadas visualmente** para o encontrar facilmente. O scroll MUST acompanhar as mensagens mais recentes salvo quando o utilizador scrolla para cima; nesse caso, uma **notificação flutuante** acima do composer («saltar para o presente») MUST aparecer sem encostar ao layout; ao clicar, o chat salta para a mensagem mais recente.

**Depends on**: canais de texto com envio/leitura de mensagens; chrome **Notificações** no topbar (botão com aria-label «Notificações»).

**Problem**: Em conversas de texto, falta chamar a atenção de alguém concreto (@) e responder a uma mensagem específica com contexto. Quem é mencionado ou respondido precisa de um aviso no centro de **Notificações** do topbar **e** de destaque visual na própria mensagem. Além disso, o histórico deve acompanhar o «presente» sem atrapalhar quem está a ler mensagens antigas.

## Clarifications

### Session 2026-09-08

- Q: Como se resolvem menções `@` com texto cifrado? → A: Cliente detecta `@handle` e envia lista de mencionados; servidor notifica só a partir desses metadados (sem ler plaintext)
- Q: Ao abrir notificação de menção/resposta? → A: Abrir o canal na mensagem; se a mensagem sumiu, mostrar aviso «mensagem indisponível»
- Q: Quando aparece «Saltar para o presente»? → A: Só se chegaram **mensagens novas** enquanto o utilizador estava fora do fundo
- Q: Profundidade das respostas? → A: Resposta a **qualquer** mensagem com **um** pai; sem UI de threads aninhadas
- Q: Duração do destaque pessoal? → A: Até o utilizador **ver** a mensagem (entrar no ecrã / scroll até ela); depois fica normal

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Mencionar com @handle (Priority: P1)

Como membro num canal de texto, quero escrever `@handle` numa mensagem para marcar outro membro desse servidor/canal, para essa pessoa ser notificada no botão **Notificações** do topbar.

**Why this priority**: Pedido central de marcação; valor social imediato.

**Independent Test**: A envia mensagem com `@bob` no canal C; B (bob), com sessão noutro sítio ou após refresh da UI de notificações, vê aviso em Notificações ligado a essa menção; A não recebe notificação por se marcar a si próprio.

**Acceptance Scenarios**:

1. **Given** sou membro do canal de texto e B é membro visível no servidor (handle conhecido), **When** envio uma mensagem cujo texto inclui `@` + handle de B, **Then** a mensagem é enviada normalmente e B recebe uma **notificação de menção**.
2. **Given** B recebeu a menção, **When** B abre o botão **Notificações** do topbar, **Then** vê um item que indica menção (quem / canal / contexto suficiente) e, ao escolher, segue FR-008/FR-008a (mensagem ou aviso de indisponível).
3. **Given** a mensagem menciona um handle que **não** corresponde a nenhum membro relevante, **When** envio, **Then** a mensagem envia-se sem falhar; **não** se cria notificação de menção fantasma.
4. **Given** me mencionei a mim (`@meu_handle`), **When** a mensagem é enviada, **Then** **não** recebo notificação de menção por causa dessa auto-menção.

---

### User Story 2 - Responder a uma mensagem (Priority: P1)

Como membro, quero ao passar o rato (ou foco equivalente) sobre uma mensagem ver um controlo para **responder**, e ao enviar a resposta quero que fique ligada à mensagem original e que o autor original seja notificado.

**Why this priority**: Segundo pedaço explícito do pedido; paridade com menções na notificação.

**Independent Test**: Hover numa mensagem de B → ícone Responder → escrever e enviar → a UI mostra a resposta associada à original; B vê notificação de resposta em Notificações.

**Acceptance Scenarios**:

1. **Given** estou no canal de texto e há uma mensagem de B, **When** passo o rato (ou foco) sobre essa mensagem, **Then** aparece um controlo claro de **Responder** (ícone).
2. **Given** activei Responder numa mensagem, **When** o composer está pronto, **Then** vejo indicação de que estou a responder a essa mensagem (autor/pré-visualização curta) e posso cancelar a resposta sem enviar.
3. **Given** envio a resposta, **When** a mensagem aparece no canal, **Then** fica visualmente associada à mensagem original (citação / referência legível).
4. **Given** B é o autor da mensagem original e não sou eu, **When** a minha resposta é enviada, **Then** B recebe uma **notificação de resposta** no topbar Notificações.
6. **Given** a mensagem a que respondo já é ela própria uma resposta, **When** envio, **Then** a minha mensagem referencia esse pai (citação) e notifica o autor **desse** pai (não uma árvore de thread).

---

### User Story 3 - Notificações no topbar (Priority: P1)

Como utilizador mencionado ou respondido, quero que o botão **Notificações** do topbar mostre esses eventos (com indicador quando há algo novo) e me leve ao sítio certo, para não perder menções/respostas no meio do ruído geral do canal.

**Why this priority**: O pedido amarra explicitamente o destino da notificação a esse controlo.

**Independent Test**: Com menção ou resposta pendente, o botão Notificações mostra estado «há novidade»; ao abrir, o item correspondente aparece; ao seguir o item, chego ao canal da conversa.

**Acceptance Scenarios**:

1. **Given** tenho pelo menos uma menção ou resposta não vista, **When** olho para o botão Notificações, **Then** há indicação visual de novidade (ex. ponto/badge já usado no chrome).
2. **Given** abro o painel Notificações, **When** há itens de menção e/ou resposta, **Then** cada item distingue o tipo (menção vs resposta) e identifica canal / remetente de forma compreensível.
3. **Given** escolho um item, **When** a navegação ocorre, **Then** abro o canal de texto e a vista vai à **mensagem** referida (com destaque breve se aplicável); o painel de notificações fecha.
4. **Given** a mensagem da notificação já foi apagada, **When** escolho o item, **Then** abro o canal e vejo um aviso claro de que a **mensagem está indisponível** (sem crash).
5. **Given** já vi / abri o canal da notificação (ou marquei como vista, se existir acção), **When** volto ao painel, **Then** esse item deixa de contar como «novo» (ou desaparece da lista de não vistas), conforme regra de Assumptions.

---

### User Story 4 - Destacar menções e respostas a mim (Priority: P1)

Como membro a ler o canal, quero que as mensagens em que **fui mencionado** ou que são **respostas à minha mensagem** se destaquem visualmente das restantes, para as encontrar de relance no histórico.

**Why this priority**: Addendum explícito; completa o valor das menções/respostas além do topbar.

**Independent Test**: Mensagem com `@meu_handle` e resposta à minha aparecem destacadas **até eu as ver**; depois o destaque some; mensagens sem relação comigo não usam esse destaque.

**Acceptance Scenarios**:

1. **Given** estou autenticado e uma mensagem no canal me menciona (`@meu_handle`) e ainda **não** a vi, **When** vejo o histórico, **Then** essa mensagem tem **destaque visual** distinto relativamente às mensagens «normais».
2. **Given** alguém respondeu a uma mensagem **minha** e ainda não vi a resposta, **When** a resposta está no canal, **Then** está **destacada para mim**.
3. **Given** uma mensagem menciona outro utilizador ou responde a outra pessoa, **When** a vejo, **Then** **não** aplica o destaque «para mim».
4. **Given** uma mensagem tinha destaque pessoal para mim, **When** a mensagem entra na minha vista (scroll / abertura do canal de modo a eu a ver), **Then** o destaque pessoal **deixa de aplicar** daí em diante (fica com aspecto normal).
5. **Given** fui eu o autor da mensagem que me menciona a mim, **When** a vejo, **Then** o destaque pessoal de menção **não** é obrigatório; respostas minhas às minhas mensagens também não exigem destaque especial.

---

### User Story 5 - Scroll no presente e «saltar para o presente» (Priority: P1)

Como leitor do canal de texto, quero que a vista **acompanhe automaticamente** as mensagens novas enquanto estiver no fundo da conversa; se eu scrollar para cima a ler o passado, quero uma **notificação flutuante** acima do composer para voltar ao presente com um clique, sem essa notificação colar-se ao layout.

**Why this priority**: Addendum explícito de UX do chat; evita perder mensagens novas ao explorar histórico.

**Independent Test**: No fundo, mensagens novas mantêm-me no fim; ao subir **com** novas entretanto, aparece o controlo flutuante; sem novas, não aparece; clicar leva à mensagem mais recente; o controlo não encosta ao composer nem às bordas do painel.

**Acceptance Scenarios**:

1. **Given** a minha vista está na mensagem mais recente (fundo), **When** chega uma mensagem nova no canal, **Then** o scroll **acompanha** e continuo a ver o fim da conversa.
2. **Given** fiz scroll para cima (já não estou no fundo), **When** chegam mensagens novas, **Then** a minha posição de leitura **não** é forçada para o fim **e** aparece a notificação flutuante.
3. **Given** fiz scroll para cima e **não** chegaram mensagens novas, **When** continuo a ler o passado, **Then** a notificação flutuante **não** aparece.
4. **Given** a notificação flutuante está visível (há novas desde que saí do fundo), **When** olho a zona acima do composer, **Then** vejo o controlo flutuante (ex. «Saltar para o presente» / novas mensagens) que **não encosta** ao composer nem ao resto do layout.
5. **Given** a notificação flutuante está visível, **When** clico nela, **Then** sou levado à **mensagem mais recente** do chat e a notificação desaparece (volto ao modo «acompanhar»).
6. **Given** volto ao fundo por scroll manual, **When** chego à mensagem mais recente, **Then** a notificação flutuante **desaparece** sem eu ter de clicar.

---

### Edge Cases

- Canal de voz/vídeo: menções e respostas **fora de âmbito** desta feature (só texto).
- Utilizador mencionado **sem** permissão para ver o canal: **não** notificar (ou não resolver a menção) — só membros que podem ver o canal.
- Várias menções na mesma mensagem: notificar **cada** handle válido distinto (excepto o autor); o destaque «para mim» aplica-se se o meu handle estiver entre eles.
- Mensagem apagada depois: notificação pode ficar «órfã»; ao abrir o item → canal + aviso «mensagem indisponível»; destaque deixa de aplicar se a mensagem sumir.
- Dispositivos sem hover: o controlo Responder MUST permanecer acessível (foco / toque longo ou botão sempre disponível em viewports tácteis — ver Assumptions).
- Utilizador silenciado no canal: regras de envio actuais aplicam-se; se não pode enviar, não cria menção/resposta novas.
- «Estar no fundo»: pequena margem de tolerância é aceitável (quase no fim conta como fundo) — ver Assumptions.
- Responder a uma resposta: permitido; a UI mostra citação do pai escolhido (não abre painel de thread).
- Threads / conversas paralelas tipo fórum: **fora** de âmbito.
- Notificação de resposta: dirigida ao autor do **pai imediato** escolhido (não a toda a cadeia).
- Composer em foco / teclado virtual em mobile: a notificação flutuante MUST continuar utilizável e sem colidir com o composer.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Em canais de texto, o utilizador MUST poder incluir `@` + handle na mensagem para marcar membros.
- **FR-002**: Handles mencionados que correspondam a membros elegíveis MUST gerar notificação de menção para esses membros (excepto o autor da mensagem).
- **FR-002a**: A resolução de menções MUST ocorrer no **cliente** no momento do envio (detecção de `@handle`); o envio MUST incluir metadados com os destinatários mencionados. O servidor MUST criar notificações a partir desses metadados e MUST NOT depender de ler o texto cifrado da mensagem.
- **FR-003**: Handles inválidos / desconhecidos MUST NOT bloquear o envio nem gerar notificações.
- **FR-004**: Em cada mensagem de texto, MUST existir um controlo **Responder** revelado no hover/foco (e acessível sem hover em touch), que prepara o envio como resposta a essa mensagem.
- **FR-005**: Mensagens enviadas como resposta MUST ficar associadas à mensagem original na UI do canal.
- **FR-005a**: Pode-se responder a **qualquer** mensagem do canal (incluindo outra resposta). Cada resposta MUST ter **exactamente um** pai. Esta feature MUST NOT exigir UI de threads / conversa paralela aninhada.
- **FR-006**: O autor da mensagem-pai (autor do pai imediato) MUST receber notificação de resposta (excepto se for o próprio autor da resposta).
- **FR-007**: Menções e respostas MUST aparecer no painel do botão **Notificações** do topbar, com indicação de novidade no botão quando houver itens não vistos.
- **FR-008**: Itens do painel MUST abrir o canal correspondente e MUST tentar posicionar a vista na **mensagem** referida.
- **FR-008a**: Se a mensagem já não existir, o produto MUST abrir o canal e MUST mostrar um aviso compreensível de que a mensagem está **indisponível** (sem falha da aplicação).
- **FR-009**: O âmbito desta feature é **apenas canais de texto**.
- **FR-010**: Auto-menção e auto-resposta MUST NOT criar notificação para o próprio utilizador.
- **FR-011**: Mensagens que mencionam o utilizador actual e que ele **ainda não viu** MUST apresentar **destaque visual pessoal** no histórico do canal.
- **FR-012**: Mensagens que são respostas a uma mensagem do utilizador actual e que ele **ainda não viu** MUST apresentar **destaque visual pessoal**.
- **FR-012a**: Quando o utilizador **vê** a mensagem (entra na viewport / é apresentada de forma legível no ecrã), o destaque pessoal MUST terminar para essa mensagem (não volta a aplicar-se só por reabrir o histórico, salvo Assumptions em contrário).
- **FR-013**: Enquanto a vista estiver no fundo da conversa, mensagens novas MUST manter o scroll no presente (acompanhar).
- **FR-014**: Quando o utilizador não está no fundo **e** chegaram mensagens novas desde que saiu do fundo, o produto MUST mostrar uma **notificação flutuante** acima do composer para saltar para a mensagem mais recente; essa notificação MUST NOT encostar ao composer nem «colar» ao layout (deve flutuar com folga). Se não há mensagens novas desde que saiu do fundo, a notificação MUST NOT aparecer só por estar a ler o passado.
- **FR-015**: Activar a notificação flutuante MUST deslocar a vista para a mensagem mais recente e restaurar o modo acompanhar.
- **FR-016**: A notificação flutuante MUST ocultar-se quando o utilizador regressa ao fundo (scroll ou salto).

### Key Entities

- **Menção**: Referência a um handle num texto de mensagem; o cliente resolve para membro(s) elegível(eis) e envia ids/metadados com a mensagem.
- **Resposta**: Mensagem de texto com exactamente um pai (mensagem referenciada); sem modelo de thread obrigatório.
- **Notificação (menção | resposta)**: Aviso dirigido a um utilizador, visível no topbar Notificações, com ligação ao canal (e à mensagem quando possível).
- **Destaque pessoal**: Estado visual temporário de uma mensagem relevante para o utilizador actual (menção a si ou resposta à sua) **até ser vista**.
- **Modo de scroll**: «acompanhar presente» vs «a ler histórico»; controla auto-scroll e visibilidade do salto para o presente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com dois utilizadores, 100% das menções `@handle` válidas geram item visível em Notificações do destinatário em ≤5 s após o envio (mesma sessão / ligação activa).
- **SC-002**: Em teste de resposta, 100% das respostas a mensagens de outro autor geram notificação ao autor original nas mesmas condições de tempo.
- **SC-003**: 0 notificações geradas por auto-menção ou auto-resposta nos cenários de aceitação.
- **SC-004**: Utilizadores encontram e usam Responder (hover ou equivalente touch) na primeira tentativa em teste guiado ≥90% das vezes.
- **SC-005**: Dias/canais sem menção nem resposta não mostram itens falsos de menção/resposta no painel.
- **SC-006**: Em 10 mensagens não vistas que me mencionam ou respondem a mim, 10/10 mostram destaque pessoal; após eu as ver (viewport), 10/10 perdem o destaque e não o recuperam só por voltar a scrollar.
- **SC-007**: Em 10 chegadas de mensagem nova com a vista no fundo, 10/10 mantêm o utilizador a ver o fim sem acção manual.
- **SC-008**: Em 10 sessões com scroll para cima **e** mensagens novas entretanto, 10/10 mostram a notificação flutuante; 10/10 cliques levam ao presente; em revisão visual, a notificação não encosta ao composer. Em 5 sessões só a ler o passado sem mensagens novas, 0/5 mostram o chip.
- **SC-009**: Em 5 notificações cuja mensagem foi apagada, 5/5 abrem o canal com aviso de mensagem indisponível e 0 crashes.

## Assumptions

- O `@handle` refere-se ao **handle** da conta na instância (o mesmo usado no perfil), não a um nome de papel.
- Menções: o servidor **confia** na lista de mencionados enviada pelo cliente apenas após validar membership/visibilidade do canal; ids inventados ou não elegíveis são ignorados (sem falhar o envio).
- Elegibilidade da menção: membro do servidor que **pode ver** aquele canal de texto.
- O painel Notificações actual (canais com atividade) **passa a incluir** (ou a priorizar) itens de menção e resposta; não é obrigatório remover o conceito de «canal com mensagens novas» nesta feature, mas menção/resposta MUST ser distinguíveis.
- Marcar como vista: ao abrir o canal a partir do item **ou** ao focar o canal da mensagem, o item deixa de ser «novo» (alinhado ao hábito actual de limpar unseen ao entrar no canal).
- Pré-visualização da resposta no composer: mostra handle do autor original + excerto curto do texto decifrado quando disponível.
- Touch: em viewports estreitos, o ícone Responder pode aparecer sempre no bloco da mensagem ou via menu de acções — desde que não dependa só de hover.
- Autocomplete de `@` ao escrever é desejável na v1 se couber; mínimo aceite é reconhecer `@handle` completo no texto enviado.
- Notificações desta feature são **in-app** (topbar); push do sistema operativo / e-mail estão fora de âmbito.
- Destaque pessoal: termina quando a mensagem é **vista** (visível na viewport de forma legível); «visto» pode alinhar-se ao mesmo momento em que se limpa unseen do canal, desde que a mensagem concreta tenha entrado no ecrã.
- Destaque pessoal usa o mesmo idioma visual da app (contraste suficiente); não depende só de cor se o tema for claro/escuro.
- «No fundo» = scroll dentro de uma margem pequena do fim (ex. últimos poucos ecrãs de altura), para não oscilar o modo por 1 px.
- Texto da notificação flutuante em português (ex. «Novas mensagens» / «Saltar para o presente»); só visível com backlog de novas desde que saiu do fundo.
