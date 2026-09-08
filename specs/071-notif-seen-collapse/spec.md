# Feature Specification: Notificações — vista limpa, 5+ por canal, limpar e sino maior

**Feature Branch**: `071-notif-seen-collapse`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Vamos mudar o comportamento de visualização de notificação criado anteriormente, agora se o usuário ver a mensagem ao qual está pendente leitura, a notificação já some. Vamos limitar também o número de notificações para um único canal, caso passe de 5 notificações, nós vamos mostrar que tem 5+ notificações pendentes naquele canal." + amendment: "vamos adicionar também a opção do usuário limpar as notificações. E faça o ícone de notificações um pouco maior no sino." + clarify: separar menção de mensagem não lida do canal; menções sempre em detalhe; clique 5+ vai à não lida mais antiga.

**Depends on**: [062-message-mentions-replies](../062-message-mentions-replies/) (notificações duráveis Menção/Resposta); [068-notif-channel-datetime](../068-notif-channel-datetime/) (rótulos canal + data/hora); [066-topbar-notif-panel](../066-topbar-notif-panel/) (painel visível).

**Problem**: Hoje a notificação durável tende a permanecer na lista até o utilizador a abrir/clicar explicitamente no painel. Se a pessoa **já leu a mensagem** no canal, a entrada continua a parecer «pendente». Actividade de **mensagens não lidas por canal** enche a lista se for listada item a item. Falta ainda uma forma explícita de **limpar** o que está pendente de uma vez. O ícone do sino no TopBar fica pequeno demais face aos restantes controlos. É preciso: (1) **remover da lista pendente** quando a mensagem associada é vista; (2) **agregar 5+** só para **não lidas de canal**; (3) **menções e respostas sempre em detalhe completo**; (4) acção **Limpar**; (5) sino **um pouco maior**.

## Clarifications

### Session 2026-09-08

- Q: Quando um canal tem mais de 5 itens agregáveis pendentes, como deve aparecer o excesso? → A: Só o resumo **5+** para esse canal (sem listar as entradas individuais *desse tipo agregável*)
- Q: Quando a notificação some por «ver a mensagem»? → A: A mensagem alvo **aparece na área visível** do histórico (viewport / deep-link cumprido)
- Q: Número no badge do sino com lista agregada 5+? → A: Badge só **binário** (ponto / vazio) — sem número
- Q: Clique no resumo «5+» — destino? → A: Abrir o canal e ir até a **mensagem não lida mais antiga**
- Q: Separar menção vs não lida de canal? → A: Sim — **menções** continuam a ser mostradas **em detalhe completo** («em todo»); o limite **5+** aplica-se às **mensagens não lidas do canal**, não às menções
- Q: Notificações de Resposta vs menções / 5+? → A: **Resposta** = como menção: sempre detalhe completo, fora do 5+

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Notificação some ao ver a mensagem (Priority: P1)

Como membro com uma notificação pendente ligada a uma mensagem, quero que essa notificação **desapareça da lista pendente** assim que **vir essa mensagem** no canal (sem precisar de abrir o painel de Notificações só para a limpar), para a lista reflectir o que ainda não li.

**Why this priority**: Mudança central do pedido; alinha «pendente» com «ainda não vi a mensagem».

**Independent Test**: Ter ≥1 notificação para uma mensagem; trazer essa mensagem à **área visível** do histórico; a entrada correspondente deixa de aparecer como pendente no painel / indicador. Abrir o canal sem a mensagem à vista **não** limpa.

**Acceptance Scenarios**:

1. **Given** tenho uma notificação pendente associada a uma mensagem específica, **When** essa mensagem **entra na área visível** do histórico do canal (viewport) ou o deep-link a posiciona à vista, **Then** essa notificação **deixa de constar** como pendente na lista de Notificações.
2. **Given** a mesma notificação, **When** abro o canal mas a mensagem alvo **ainda não** está na área visível, **Then** a notificação **continua** pendente (abrir o painel ou só o canal **não** a limpa por si).
3. **Given** várias notificações para mensagens diferentes, **When** só uma delas entra na área visível, **Then** só a(s) correspondente(s) a essa mensagem desaparecem; as outras permanecem.
4. **Given** o indicador de Notificações no sino, **When** há pelo menos uma notificação durável pendente, **Then** o sino mostra um **ponto/indicador binário** (sem número); **When** não há pendentes duráveis relevantes, **Then** o indicador some (outras fontes de actividade de sessão, se existirem, seguem as suas próprias regras).

---

### User Story 2 - Menções em detalhe; 5+ só para não lidas de canal (Priority: P1)

Como membro, quero **distinguir** no painel as **menções** e **respostas** (sempre listadas **em detalhe completo**) da actividade de **mensagens não lidas do canal**. Para não lidas de canal, quero até **cinco** entradas detalhadas por canal e, se houver **mais de cinco**, **apenas** um resumo **5+** nesse canal.

**Why this priority**: Pedido explícito de clarificação; evita esconder menções atrás de agregação.

**Independent Test**: (a) 6+ menções ou respostas no mesmo canal → todas continuam listadas em detalhe; (b) 6+ indicadores de não lidas de canal no mesmo canal → só o agregado **5+** desse canal para esse tipo.

**Acceptance Scenarios**:

1. **Given** tenho várias **menções** ou **respostas** pendentes (mesmo no mesmo canal e mesmo que sejam mais de 5), **When** abro Notificações, **Then** cada uma aparece **em detalhe** (não colapsada em 5+).
2. **Given** tenho **1 a 5** itens de **não lidas de canal** no mesmo canal, **When** abro Notificações, **Then** vejo até cinco itens detalhados desse tipo **sem** rótulo «5+» para esse canal.
3. **Given** tenho **mais de 5** itens de **não lidas de canal** no mesmo canal, **When** abro Notificações, **Then** vejo **só** o resumo **5+** desse canal para não lidas (nenhuma linha individual *desse tipo* para esse canal), enquanto **menções** e **respostas** desse canal (se existirem) continuam em detalhe.
4. **Given** dois canais com excesso de não lidas, **When** abro o painel, **Then** cada um mostra o seu próprio **5+** de não lidas (limite **por canal**, só para esse tipo).
5. **Given** um canal em estado 5+ de não lidas, **When** o número de não lidas pendentes desse canal desce para ≤5 (por vista ou limpeza), **Then** a apresentação deixa o modo 5+ e volta ao detalhe apropriado (ou some se zero).

---

### User Story 3 - Limpar notificações (Priority: P1)

Como membro com notificações pendentes, quero uma opção explícita de **Limpar** no painel de Notificações, para dispensar de uma vez o que ainda está pendente sem ter de abrir cada mensagem.

**Why this priority**: Pedido explícito de amendment; controlo manual complementar à limpeza por vista.

**Independent Test**: Com ≥1 notificação durável pendente, usar Limpar → lista de pendentes duráveis fica vazia e o indicador binário do sino reflecte ausência.

**Acceptance Scenarios**:

1. **Given** tenho uma ou mais notificações duráveis pendentes, **When** abro o painel de Notificações, **Then** vejo uma acção clara **Limpar** (rótulo ou equivalente inequívoco).
2. **Given** o painel aberto com pendentes, **When** activo **Limpar**, **Then** todas as notificações duráveis pendentes deixam de aparecer como pendentes e o **indicador binário** do sino deixa de as reflectir.
3. **Given** a lista já sem pendentes duráveis, **When** abro o painel, **Then** a acção Limpar está ausente ou inactiva (não sugere limpeza sem efeito).
4. **Given** limpei as notificações, **When** recarrego a sessão / volto mais tarde, **Then** as mesmas entradas **não** reaparecem como pendentes (limpeza persistente, não só visual).

---

### User Story 4 - Clique / navegação a partir da lista (Priority: P2)

Como membro, quero poder **abrir** uma menção (ou outro item detalhado) e o resumo **5+** de não lidas de canal, para ir ao sítio certo da conversa.

**Why this priority**: Evita regressão no fluxo 062/068; define o destino do agregado 5+.

**Independent Test**: Clique em menção → mensagem da menção; clique em 5+ → canal na **não lida mais antiga**.

**Acceptance Scenarios**:

1. **Given** um item detalhado (menção ou não lida ≤5), **When** clico, **Then** vou ao destino dessa entrada (canal / mensagem associada).
2. **Given** um resumo **5+** de não lidas num canal, **When** clico, **Then** abro esse canal e sou levado à **mensagem não lida mais antiga** desse canal.
3. **Given** limpei pendentes ao ver mensagens ou via Limpar, **When** volto ao painel, **Then** não reaparecem as já dispensadas.

---

### User Story 5 - Sino de notificações um pouco maior (Priority: P2)

Como membro, quero o ícone do **sino** de Notificações no TopBar **um pouco maior** do que hoje, para o encontrar e tocar com mais facilidade, sem dominar a barra.

**Why this priority**: Pedido explícito de amendment; polish de chrome.

**Independent Test**: Comparar visualmente o sino antes/depois — perceptivelmente maior, alinhado ao TopBar, sem cortar indicador nem painel.

**Acceptance Scenarios**:

1. **Given** o TopBar com o controlo de Notificações, **When** olho para o sino, **Then** o ícone está **visivelmente um pouco maior** do que na versão anterior desta feature.
2. **Given** o sino com indicador de pendentes, **When** o ícone cresce, **Then** o ponto/indicador binário continua legível e o clique/área do painel continua a funcionar.
3. **Given** o resto dos controlos do TopBar, **When** comparo hierarquia visual, **Then** o sino não parece um botão gigante nem desalinha a fila de ícones de forma grosseira.

---

### Edge Cases

- Notificação sem mensagem associada: não pode «ver a mensagem»; permanece até Limpar, clique/leitura, ou outro meio definido nas Assumptions.
- Mensagem apagada / indisponível: ao confrontar a vista, preferir limpar da pendente se a mensagem já não for legível (Assumption).
- Contagem 5 vs 5+: **mais de 5** não lidas de canal no mesmo canal activa 5+; exactamente 5 mostra detalhe até cinco **desse tipo**.
- Menções e **respostas**: **nunca** entram no contador nem no resumo 5+; sempre linhas individuais.
- Canais diferentes: limites 5+ de não lidas independentes.
- Mistura no mesmo canal: menções/respostas em detalhe **e** (se aplicável) linhas de não lidas ou um único 5+ de não lidas — em paralelo, sem fundir tipos.
- Limpar: limpa notificações duráveis pendentes (menções, respostas e demais tipos cobertos); efeito sobre indicadores de não lidas de canal — preferência em Assumptions (limpar também se no mesmo painel).
- Indicador binário: coerente após auto-limpeza, Limpar e agregação visual.
- Sino maior em ecrãs estreitos: continua utilizável sem sobrepor o logo ou outros controlos de forma bloqueante.
- Clique 5+ sem mensagens não lidas restantes: abrir o canal sem erro (posição por omissão).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Quando a mensagem associada a uma notificação durável pendente **entra na área visível** do histórico do canal (viewport) — incluindo via deep-link que a posiciona à vista — o sistema MUST remover essa notificação do conjunto **pendente** (lista / indicador) sem exigir um clique prévio no painel só para a dispensar.
- **FR-002**: Abrir o canal **sem** a mensagem alvo na área visível MUST **não** limpar essa notificação por si só. O critério de «ver» MUST alinhar-se ao mecanismo de destaque/vista de mensagem notificada já usado na app (entrada em viewport / deep-link cumprido).
- **FR-003**: Entrada em viewport de uma mensagem MUST limpar **apenas** as notificações pendentes ligadas a essa mensagem (ou ao mesmo alvo inequívoco), não todas as do canal por omissão.
- **FR-014**: O painel MUST **separar** visual/semanticamente **menções** e **respostas** de **mensagens não lidas do canal** (tipos distintos; não misturar no mesmo agregado).
- **FR-015**: Notificações de **menção** e de **resposta** pendentes MUST ser listadas **sempre em detalhe completo** — **sem** colapsar em 5+, independentemente da quantidade ou do canal.
- **FR-004**: Por canal, se o número de itens pendentes de **mensagens não lidas do canal** for **maior que 5**, a UI MUST apresentar **apenas** um resumo **5+** para esse canal *desse tipo* — **sem** listar linhas individuais de não lidas desse canal.
- **FR-005**: Por canal, se houver **≤ 5** itens de não lidas de canal pendentes, a UI MUST listar o detalhe desses itens (rótulos canal + momento quando aplicável, conforme 068), sem rótulo 5+.
- **FR-006**: O limite 5 / 5+ MUST aplicar-se **por canal** e **apenas** a não lidas de canal, independentemente de outros canais e independentemente de menções e respostas.
- **FR-007**: Quando o número de não lidas de canal de um canal em 5+ descer para ≤5, a UI MUST actualizar (deixar 5+ ou detalhe/vazio) sem recarregar a app manualmente de forma obrigatória.
- **FR-008**: Clicar num item detalhado MUST navegar para o destino dessa entrada; clicar no resumo **5+** MUST abrir o canal e posicionar na **mensagem não lida mais antiga** desse canal.
- **FR-009**: O indicador do sino de Notificações MUST ser **binário** (ponto/presença vs ausente) para notificações duráveis pendentes — **sem** número no badge. MUST ligar-se quando existir ≥1 pendente durável e desligar-se quando não restarem (após vista, Limpar, etc.), sem «fantasma» de itens já dispensados.
- **FR-010**: O painel de Notificações MUST oferecer uma acção **Limpar** quando existir pelo menos uma notificação durável pendente.
- **FR-011**: Activar **Limpar** MUST marcar como não pendentes **todas** as notificações duráveis pendentes do utilizador (efeito persistente).
- **FR-012**: Com zero pendentes duráveis, a acção Limpar MUST estar oculta ou claramente inactiva.
- **FR-013**: O ícone do sino de Notificações no TopBar MUST ficar **um pouco maior** do que o tamanho actual, mantendo indicador e abertura do painel utilizáveis e a hierarquia visual do TopBar equilibrada.

### Key Entities

- **Notificação de menção / resposta**: Evento durável pessoal; listado sempre em detalhe completo enquanto pendente; fora do agregado 5+.
- **Não lidas de canal**: Actividade de mensagens não lidas num canal (distinta de menção/resposta); sujeita ao limite 5 / 5+ por canal.
- **Notificação durável pendente**: Evento ainda não lido/dispensado (inclui menções e outros tipos duráveis cobertos pelo painel).
- **Vista de mensagem**: Mensagem alvo na área visível do histórico, o que dispara saída da notificação pendente associada.
- **Agregado por canal (5+)**: Uma linha condensada quando há mais de cinco **não lidas de canal** pendentes no mesmo canal.
- **Limpar**: Acção que dispensa de uma vez todas as notificações duráveis pendentes.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com 1 notificação e a mensagem alvo fora do ecrã, abrir o canal **não** limpa; quando a mensagem entra na área visível, a notificação deixa de aparecer como pendente em ≤ poucos segundos / no próximo refresh natural do painel.
- **SC-002**: Em teste com 6+ **não lidas de canal** no mesmo canal, o painel mostra **exactamente uma** linha **5+** desse tipo para esse canal e **zero** linhas individuais de não lidas desse canal.
- **SC-003**: Em teste com 6+ **menções** (ou **respostas**) no mesmo canal, **todas** aparecem em detalhe; **não** há colapso 5+ desses tipos.
- **SC-004**: Em teste com exactamente 5 não lidas de canal no mesmo canal, **não** aparece o rótulo 5+; as entradas detalhadas desse tipo estão disponíveis.
- **SC-005**: Em teste com dois canais acima do limite de não lidas, cada um mostra o seu 5+ de forma independente.
- **SC-009**: Após reduzir não lidas até ≤5 (ou zero) num canal em 5+, a UI deixa o estado 5+ coerente sem F5 obrigatório.
- **SC-010**: Clique no 5+ abre o canal na **mensagem não lida mais antiga** (verificável no teste de navegação).
- **SC-006**: Em teste com ≥1 pendente durável, Limpar esvazia a lista pendente e o indicador binário do sino deixa de as reflectir; após novo carregamento da app, essas entradas não voltam como pendentes.
- **SC-008**: Com pendentes duráveis, o sino mostra indicador **sem número**; com zero pendentes duráveis (e sem outras fontes activas), o indicador está ausente.
- **SC-007**: Em revisão visual lado a lado, o sino de Notificações é reconhecido como **maior** do que antes por observadores, sem impedir o uso do TopBar nem do indicador binário.

## Assumptions

- **Menções** e **respostas** e **não lidas de canal** são tipos distintos no painel; o 5+ **não** se aplica a menções nem a respostas.
- «Ver a mensagem» = a mensagem alvo **na área visível** do histórico (viewport), alinhado ao destaque pessoal / deep-link cumprido (062); **não** basta abrir o canal se a mensagem estiver fora do ecrã.
- Clique no item do painel pode continuar a marcar leitura/navegação como hoje; esta feature **acrescenta** limpeza automática ao ver a mensagem e a acção Limpar.
- **Limpar** = limpar **todas** as notificações duráveis pendentes de uma vez (não «limpar só este canal» nesta versão); sem diálogo de confirmação obrigatório. Âmbito exacto de Limpar sobre «não lidas de canal» de sessão alinha-se ao que o produto já trata como limpeza do painel (preferência: limpar também esses indicadores de sessão se forem mostrados no mesmo painel).
- Resumo **5+**: **uma única** linha por canal em excesso de **não lidas**; clique → canal + **não lida mais antiga**.
- Exactamente 5 não lidas de canal → até cinco linhas de detalhe; 6 ou mais → **só** o resumo 5+ desse tipo (sem híbrido).
- Persistência: limpar pendente ao ver ou via Limpar implica o mesmo efeito de «lida/dispensada» que o produto já usa para não voltar a listar, não só esconder no cliente até F5.
- Rótulos 068 (nome + data/hora) mantêm-se nos itens detalhados; o agregado 5+ prioriza clareza do volume de não lidas.
- Badge do sino para pendentes duráveis: **binário** (ponto / vazio), **sem** contagem numérica.
- Aumento do sino: incremento **modesto** (claramente perceptível), não um redesign do TopBar.
