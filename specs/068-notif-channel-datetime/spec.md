# Feature Specification: Notificações com nome do canal e data/hora

**Feature Branch**: `068-notif-channel-datetime`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Nas notificações, coloque apenas o nome do canal aonde o usuário foi notificado, e dia-hora da notificação."

**Depends on**: [062-message-mentions-replies](../062-message-mentions-replies/) (lista durável Menção/Resposta no TopBar); [066-topbar-notif-panel](../066-topbar-notif-panel/) (painel visível).

**Problem**: Cada item da lista de notificações duráveis mostra um rótulo de tipo (ex. Menção/Resposta) e um identificador truncado do canal (`canal ab12cd34…`), o que é pouco legível. O utilizador precisa de ver **só o nome do canal** onde foi notificado e **quando** (dia e hora), sem ruído de UUID ou de tipo na linha do item.

## Clarifications

### Session 2026-09-08

- Q: Formato de dia/hora no item? → A: Relativo — «Hoje 14:32» / «Ontem 09:01»; outros dias: data curta + hora (ex. «08 set 14:32»), fuso local
- Q: Secção «Canais com mensagens novas»? → A: In scope for **name only** — show channel name (no day/time); do not invent timestamps
- Q: Layout do item durável (nome + dia/hora)? → A: Uma linha — nome do canal + dia/hora (hora/data pode ficar mais discreta)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ler canal e momento na lista (Priority: P1)

Como membro com notificações duráveis (menção ou resposta), quero que cada item mostre **apenas o nome do canal** e a **data/hora** da notificação, para perceber de imediato onde e quando aconteceu sem decifrar IDs.

**Why this priority**: Pedido central; legibilidade da lista.

**Independent Test**: Abrir Notificações com ≥1 item durável → cada linha mostra nome de canal legível + dia/hora; não mostra UUID truncado nem rótulo «Menção»/«Resposta» na linha do item.

**Acceptance Scenarios**:

1. **Given** tenho pelo menos uma notificação durável no painel, **When** abro Notificações, **Then** cada item dessa secção mostra numa **só linha** o **nome do canal** e a **data/hora** (não um prefixo de ID).
2. **Given** o mesmo painel aberto, **When** leio um item, **Then** a linha **não** inclui o rótulo de tipo (Menção/Resposta) nem texto do género `canal <id>…`.
3. **Given** o canal ainda existe e tem nome, **When** vejo o item, **Then** o nome mostrado é o **nome actual** do canal (o mesmo que o membro reconheceria na lista de canais).
4. **Given** um item durável, **When** o vejo, **Then** o dia/hora aparece na **mesma linha** que o nome (pode estar tipograficamente mais discreto), sem segunda linha só para o momento.

---

### User Story 2 - Momento compreensível no fuso local (Priority: P1)

Como membro, quero que a data/hora seja apresentada no **meu fuso local** de forma legível (dia + hora), para saber se a notificação é de hoje, de ontem ou de outro dia.

**Why this priority**: Sem dia/hora útil o pedido fica incompleto; `created_at` já existe no domínio da notificação.

**Independent Test**: Comparar itens com instantes de hoje, ontem e outro dia → rótulos Hoje/Ontem + hora ou data curta + hora no fuso local.

**Acceptance Scenarios**:

1. **Given** uma notificação com instante conhecido **hoje** (fuso local), **When** a vejo na lista, **Then** o momento aparece no padrão **«Hoje HH:MM»** (ou equivalente local com «Hoje»).
2. **Given** uma notificação de **ontem** (fuso local), **When** a vejo, **Then** o momento aparece como **«Ontem HH:MM»**.
3. **Given** uma notificação noutro dia civil, **When** a vejo, **Then** o momento aparece como **data curta + hora** (ex. «08 set 14:32»), distinguível de hoje/ontem.
4. **Given** tema claro ou escuro, **When** leio nome + dia/hora, **Then** ambos permanecem legíveis no painel.

---

### User Story 3 - Clique e navegação inalterados (Priority: P2)

Como membro, quero **continuar a clicar** no item para ir ao canal/mensagem como hoje, mudando só o texto mostrado na linha.

**Why this priority**: Evita regressão no fluxo 062; o valor desta feature é apresentação.

**Independent Test**: Clicar num item com o novo rótulo → mesma navegação/deep-link de antes; marcar como lida se já ocorria.

**Acceptance Scenarios**:

1. **Given** um item com nome de canal + dia/hora (ou item de sessão só com nome), **When** clico nele, **Then** navego para o destino esperado da notificação (canal e mensagem quando aplicável), como no comportamento actual.
2. **Given** o painel aberto, **When** fecho ou navego, **Then** não surgem novos passos obrigatórios só por causa do texto do item.

---

### User Story 4 - Nome na secção de canais com mensagens novas (Priority: P2)

Como membro com actividade de sessão (canais com mensagens novas), quero ver o **nome do canal** nessa secção em vez de um ID truncado, sem data/hora inventada.

**Why this priority**: Clarificação explícita; consistência do painel sem expandir o formato dia-hora às linhas de sessão.

**Independent Test**: Abrir Notificações com ≥1 canal na secção de sessão → item mostra nome do canal; sem dia/hora nessa linha.

**Acceptance Scenarios**:

1. **Given** a secção «canais com mensagens novas» tem pelo menos um canal, **When** abro Notificações, **Then** cada item dessa secção mostra o **nome do canal** (não `Canal <id>…`).
2. **Given** o mesmo item de sessão, **When** o leio, **Then** **não** aparece dia/hora nessa linha (só nas notificações duráveis).

---

### Edge Cases

- Canal renomeado depois da notificação: mostrar o **nome actual**; se o canal já não existir ou o nome não estiver disponível, mostrar um fallback curto e compreensível (ex. «Canal indisponível»), **sem** voltar a expor UUID longo na linha.
- Várias notificações no mesmo canal: cada uma tem a **sua** data/hora; o nome do canal pode repetir-se.
- Secção de sessão «canais com mensagens novas»: mostra **nome do canal** apenas; **sem** dia/hora.
- Instantes em fusos/DST: usar o fuso local do dispositivo no momento da visualização.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada item da lista de **notificações duráveis** (menção/resposta) MUST mostrar o **nome do canal** associado à notificação.
- **FR-002**: Cada item durável MUST mostrar o momento de criação no fuso local, com rótulos relativos **Hoje** / **Ontem** + hora (`HH:MM`) quando o dia civil for hoje/ontem; noutros dias, **data curta + hora** (sem exigir segundos).
- **FR-002a**: Nome do canal e dia/hora MUST aparecer na **mesma linha** do item (o momento pode ser tipograficamente secundário); MUST NOT usar uma segunda linha só para o momento, nem restringir o momento a tooltip.
- **FR-003**: O texto do item durável MUST **não** incluir o rótulo de tipo (Menção/Resposta) nem um identificador truncado do canal no lugar do nome.
- **FR-004**: O clique no item MUST preservar a navegação existente para o canal/mensagem (sem novos passos de confirmação).
- **FR-005**: Se o nome do canal não puder ser resolvido, o sistema MUST mostrar um fallback curto e compreensível, sem UUID longo como único rótulo principal.
- **FR-006**: A apresentação MUST permanecer legível em tema claro e escuro e no painel estreito de notificações.
- **FR-007**: Cada item da secção de sessão «canais com mensagens novas» MUST mostrar o **nome do canal** (não ID truncado) e MUST **não** mostrar dia/hora.

### Key Entities

- **Notificação durável**: Evento já existente (menção ou resposta) com canal, mensagem opcional e instante de criação; esta feature altera só a **apresentação** na lista.
- **Canal**: Espaço nomeado onde a notificação ocorreu; o utilizador reconhece o canal pelo **nome**, não pelo ID.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em ≤ 1 minuto, um membro identifica o canal e o momento de uma notificação de teste só pelo texto do item (sem abrir DevTools nem comparar IDs).
- **SC-002**: Em 100% dos itens duráveis de um painel de teste, não aparece UUID truncado nem rótulo Menção/Resposta na linha do item.
- **SC-003**: Em ≥ 3 notificações de teste (hoje, ontem, e outro dia), os rótulos usam Hoje/Ontem + hora ou data curta + hora conforme o dia civil local, sem dia errado.
- **SC-004**: Clicar num item com o novo texto continua a levar ao canal/mensagem correcto (sem regressão face ao fluxo actual).
- **SC-005**: Em 100% dos itens da secção de sessão num painel de teste, aparece nome de canal e não aparece dia/hora nem UUID truncado.

## Assumptions

- Âmbito: (1) notificações **duráveis** — nome do canal + dia/hora **numa linha**; (2) secção de sessão «canais com mensagens novas» — **nome do canal apenas**, sem inventar data/hora (clarificado).
- Layout durável (clarificado): uma linha; dia/hora pode ser mais discreto que o nome; sem tooltip-only para o momento.
- Formato de dia/hora (clarificado): **Hoje HH:MM** / **Ontem HH:MM** / data curta + hora; locale/abreviação de mês alinhada ao resto da app (ex. separadores de dia); sem UTC cru nem segundos obrigatórios.
- Não se altera o modelo de quem recebe notificação, tipos de evento, nem regras de leitura/badge — só o texto do item.
- Nome do canal é o nome que o membro já usa na app (lista de canais / navegação); pode exigir resolução a partir do ID já conhecido pela notificação.
- Dependência: painel de notificações 062/066 já utilizável.
