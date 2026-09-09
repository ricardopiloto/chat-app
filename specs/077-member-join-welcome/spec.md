# Feature Specification: Mensagem de entrada de membro no chat

**Feature Branch**: `077-member-join-welcome`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Sempre que um novo usuário entrar no servidor, nós vamos gerar uma notificação (mensagem no chat) no canal #geral, se não houver um canal, o usuário que gerar o convite deve informar aonde as notificações vão aparecer. Ela deve aparecer como uma mensagem em background, centralizada no chat: «Usuário <nome> acabou de entrar no canal» e essa mensagem pode ser customizada pelo dono do servidor nas configurações do servidor."

**Problem**: Quando alguém entra no servidor, os membros já presentes não têm um aviso visível no histórico do chat. Falta um anúncio automático, discreto, num canal conhecido (`#geral` quando existir) ou noutro canal escolhido, com texto configurável pelo dono.

## Clarifications

### Session 2026-09-08

- Q: Canal escolhido ao criar o convite — só para esse convite ou fica no servidor? → A: **Só para esse convite** — quem entra por ele usa esse canal; outros convites/joins sem destino continuam a exigir escolha se não houver `#geral`/config do dono
- Q: O dono pode desligar os anúncios de entrada? → A: **Sempre ligados** neste MVP; dono só customiza texto e canal (sem opt-out)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Anúncio automático ao entrar (Priority: P1)

Como membro do servidor, quero ver no chat uma **mensagem de sistema** (fundo / estilo discreto, **centralizada**) quando um novo utilizador **entra no servidor**, para notar a chegada sem confundir com uma mensagem normal de conversa.

**Why this priority**: Comportamento principal do pedido.

**Independent Test**: Conta B aceita convite / junta-se ao servidor → no canal de destino aparece mensagem de sistema centrada com o nome de B; não parece mensagem de utilizador comum.

**Acceptance Scenarios**:

1. **Given** o servidor tem um canal de texto chamado **geral** (destino por omissão) e um template de mensagem configurado (ou o texto por omissão), **When** um novo utilizador entra no servidor, **Then** é publicada nesse canal uma mensagem de sistema **centralizada**, com o texto do template substituindo o nome do novo membro.
2. **Given** a mensagem de entrada está no histórico, **When** um membro abre o canal, **Then** a mensagem é claramente distinta de mensagens de chat normais (estilo «background» / sistema, centrada).
3. **Given** o texto por omissão, **When** o membro «Alice» entra, **Then** o conteúdo reflecte o padrão do produto, equivalente a: *Usuário Alice acabou de entrar no canal* (com o nome real do membro no lugar do placeholder).

---

### User Story 2 - Destino quando não existe `#geral` (Priority: P1)

Como **criador do convite**, quero **escolher o canal** onde os anúncios de entrada aparecem **quando o servidor não tem** um canal `#geral` (e ainda não há destino definido pelo dono), para o anúncio não falhar em silêncio.

**Why this priority**: Pedido explícito para o caso sem `#geral`.

**Independent Test**: Servidor sem canal `geral` e sem destino de boas-vindas já configurado → ao criar convite, sou obrigado a indicar um canal de texto; quem entrar gera a mensagem nesse canal.

**Acceptance Scenarios**:

1. **Given** o servidor **não** tem canal de texto `geral` e **não** tem canal de anúncios de entrada já definido nas definições, **When** crio um convite, **Then** o fluxo pede (obrigatório) um **canal de texto** de destino para esses anúncios.
2. **Given** escolhi o canal `#chegadas` ao criar o convite, **When** um novo utilizador entra **com esse convite**, **Then** a mensagem de sistema aparece em `#chegadas` (a escolha **não** altera o destino global do servidor).
3. **Given** o servidor **já tem** `#geral` **ou** um canal de anúncios já configurado pelo dono, **When** crio um convite, **Then** **não** sou forçado a escolher destino (usa-se o destino resolvido: `#geral` ou o configurado).
4. **Given** não há `#geral` nem destino do dono, e criei dois convites com canais diferentes, **When** membros entram por cada convite, **Then** cada um anuncia no canal escolhido **nesse** convite.

---

### User Story 3 - Texto customizável pelo dono (Priority: P1)

Como **dono do servidor**, quero **customizar** o texto da mensagem de entrada nas **definições do servidor**, para o tom da comunidade ficar alinhado à casa.

**Why this priority**: Pedido explícito de customização.

**Independent Test**: Dono altera o texto nas definições → próximo membro que entrar vê o novo texto (com o nome substituído); membros sem permissão de dono não alteram o texto.

**Acceptance Scenarios**:

1. **Given** sou o dono, **When** abro as definições do servidor, **Then** existe um sítio para editar o **texto/template** da mensagem de entrada (com indicação de como incluir o nome do novo membro) — **sem** interruptor para desligar os anúncios neste MVP.
2. **Given** guardei um template customizado, **When** um novo utilizador entra, **Then** a mensagem publicada usa esse template (não o texto por omissão), com o nome do membro no sítio do placeholder.
3. **Given** não sou o dono, **When** vejo definições (ou não tenho acesso a essa secção), **Then** não consigo alterar o template de entrada.

---

### User Story 4 - Destino configurável pelo dono (Priority: P2)

Como dono, quero poder definir (nas definições) **em que canal** os anúncios de entrada são publicados, para não depender só do nome `geral` ou da escolha pontual no convite.

**Why this priority**: Completa o modelo de destino; evita ambiguidade após o primeiro convite.

**Independent Test**: Dono escolhe `#avisos` como canal de entrada → novos membros geram mensagem aí mesmo que exista `#geral`.

**Acceptance Scenarios**:

1. **Given** sou o dono, **When** escolho um canal de texto como destino dos anúncios de entrada e guardo, **Then** as próximas entradas usam esse canal.
2. **Given** existe destino configurado pelo dono, **When** alguém cria um convite, **Then** o destino do anúncio segue a configuração do dono (não exige nova escolha no convite).

---

### Edge Cases

- Canal de destino apagado ou sem permissão de escrita «do sistema»: o anúncio MUST falhar de forma segura (sem partir o join); o join do membro continua; o produto SHOULD evitar silêncio total quando for possível avisar o dono/criador noutra altura — no mínimo o membro entra com sucesso.
- Nome do canal `geral` renomeado: deixa de contar como destino por omissão `#geral`; aplica-se destino configurado ou escolha no convite.
- Vários convites / várias entradas: **cada** novo membro gera **uma** mensagem de entrada (sem agregar várias entradas numa só).
- Reentrada do mesmo membro (saiu e voltou): gera nova mensagem de entrada (comportamento simples; sem «já esteve cá»).
- Placeholder em falta no template customizado: o produto MUST ainda incluir o nome do membro de forma legível (ex. prefixar/anexar) ou rejeitar o save do template sem placeholder — default: exigir o placeholder do nome ao guardar.
- Mensagem de sistema: não conta como mensagem «de utilizador» para menções/notificações pessoais de Menção/Resposta; não aparece como se fosse o novo membro a escrever a frase.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Quando um utilizador **entra com sucesso** num servidor (ex. aceita convite), o produto MUST publicar uma **mensagem de sistema** de entrada no **canal de destino** resolvido para esse join. Os anúncios MUST permanecer **sempre activos** neste MVP (sem interruptor de desligar); o dono customiza texto e canal, não desactiva a funcionalidade.
- **FR-002**: A mensagem MUST ser apresentada no chat com estilo de **sistema / background**, **centralizada**, visualmente distinta das mensagens de membros.
- **FR-003**: O texto MUST incluir o **nome de apresentação** do novo membro. O texto por omissão MUST ser equivalente a: `Usuário <nome> acabou de entrar no canal` (substituindo `<nome>`).
- **FR-004**: Resolução do canal de destino para um join concreto, por ordem:
  1. Canal de anúncios de entrada **configurado pelo dono** (se definido e ainda válido);
  2. Caso contrário, canal de texto cujo nome é **`geral`** (destino por omissão do produto);
  3. Caso contrário, canal associado **a esse convite** (escolhido na criação do convite) — **apenas** para joins via esse código; **não** persiste como configuração do servidor.
- **FR-005**: Se na criação do convite a resolução cair no passo 3 (sem destino do dono e sem `#geral`), o fluxo de criar convite MUST exigir a selecção de um **canal de texto** guardado **nesse convite** (por-convite, não global).
- **FR-006**: O **dono do servidor** MUST poder **customizar o template** da mensagem de entrada nas **definições do servidor**, incluindo um placeholder para o nome do novo membro.
- **FR-007**: O **dono do servidor** MUST poder **definir ou alterar** o canal de destino dos anúncios de entrada nas definições do servidor (US4).
- **FR-008**: Apenas o **dono** (ou o papel/sistema equivalente de dono do produto) MUST poder alterar template e canal de destino nas definições; o criador do convite só escolhe destino quando FR-004 passo 3 se aplica.
- **FR-009**: A falha ao publicar o anúncio MUST NOT impedir a entrada do membro no servidor.
- **FR-010**: A mensagem de entrada MUST NOT ser tratada como mensagem normal do novo membro (autor aparente / menções / badge de não lida pessoal como se fosse chat seu).

### Key Entities

- **Anúncio de entrada (welcome/join notice)**: mensagem de sistema no histórico de um canal de texto, gerada no join.
- **Template de entrada**: texto configurável pelo dono, com placeholder do nome do membro; default do produto se vazio.
- **Canal de destino de anúncios**: canal de texto onde se publicam os anúncios; resolvido por FR-004.
- **Novo membro**: conta que acaba de obter membership no servidor.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos joins de teste com `#geral` presente (sem override do dono), a mensagem de sistema aparece em `#geral` dentro de poucos segundos após o join bem-sucedido.
- **SC-002**: Em 100% dos testes sem `#geral` e sem destino do dono, o fluxo de criar convite **bloqueia** sem canal escolhido; o join via **esse** convite publica no canal desse convite; um segundo convite com outro canal anuncia noutro sítio (sem alterar a config do servidor).
- **SC-003**: Em 100% dos testes após o dono alterar o template, o próximo join reflecte o novo texto com o nome correcto.
- **SC-004**: Em revisão visual, 100% das mensagens de entrada testadas aparecem centradas e distintas das mensagens de chat normais.
- **SC-005**: Em 100% dos testes em que a publicação do anúncio é forçada a falhar, o membro **ainda** fica no servidor.

## Assumptions

- «Notificação» neste pedido = **mensagem no chat** (sistema), não (obrigatoriamente) item da lista Notificações do TopBar.
- O nome por omissão do canal bootstrap continua a ser `geral`; o match do destino por omissão é pelo **nome** `geral` (canal de texto).
- «Usuário &lt;nome&gt;» usa o **nome de apresentação / handle** visível no produto para esse membro.
- A customização do template e do canal de destino vive nas **definições do servidor** acessíveis ao dono (secção nova ou existente adequada).
- Entradadas cobertas: joins via **convite** (fluxo principal); outros caminhos de membership, se existirem no futuro, SHOULD reutilizar a mesma publicação.
- Uma entrada = uma mensagem; sem digest.
- Anúncios de entrada **sempre activos** neste MVP (sem opt-out do dono); customização = template + canal de destino.
- Canal escolhido no convite (passo 3) é **por convite**, não grava o destino global do servidor; só a configuração do dono (US4) é persistente ao nível do servidor.
- Placeholder canónico no template: um marcador explícito (ex. `{nome}` ou `<nome>`) documentado na UI de definições; o texto por omissão do produto usa a frase pedida pelo utilizador.
