# Feature Specification: Ícones de Membros e Convite

**Feature Branch**: `019-members-invite-icons`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Agora vamos alterar o \"Membros\" para que ele seja um icone ao invés da palavra \"membros\", impersone um Designer de UI/UX para ver a melhor opção comparando com soluções de mercado. Altere também o botão de \"Convite\" para que seja um ícone no cabeçalho do servidor ao lado do nome do servidor, alinhado a direita."

**Depends on**: [008-shell-chrome-members](../008-shell-chrome-members/) (painel de membros no cabeçalho do canal); [012-shell-iconography-typography](../012-shell-iconography-typography/) (sistema de ícones do shell); fluxo de convite existente na coluna do servidor.

## Clarifications

### Session 2026-09-04

- Q: Quem vê o ícone de convite no cabeçalho do servidor? → A: Só o dono do servidor; os outros membros não o vêem.
- Q: Como o ícone de membros mostra que a lista está aberta? → A: O mesmo desenho de grupo; o botão fica com aspecto seleccionado/pressionado enquanto o painel está aberto.

## Design rationale (mercado)

Decisões de produto tomadas com olhar de UI/UX, comparando Mesa com Discord, Slack, Microsoft Teams e Google Meet/Zoom. O objectivo é **reconhecimento instantâneo**, não inventar uma metáfora nova.

### Membros — o que o mercado faz

| Produto | Onde está | O que se vê | Metáfora |
|---------|-----------|-------------|----------|
| Discord | Cabeçalho do canal, à direita (junto ao painel que abre) | Só ícone | Duas silhuetas (grupo / pessoas) |
| Slack | Cabeçalho do canal | Ícone de pessoas, por vezes com contagem | Grupo |
| Teams | Cabeçalho do chat/canal | Ícone de pessoas | Grupo |
| Meet / Zoom | Barra da reunião | Ícone de participantes | Grupo / lista de pessoas |

**Rejeitado**

- Hambúrguer ou lista genérica — lê-se como «menu», não como «quem está neste servidor».
- Engrenagem — lê-se como definições.
- Manter a palavra «Membros» — ocupa largura no cabeçalho (pior em voz, já denso) e destoa dos outros controlos do chrome que já são só ícone (pesquisa, sino, «+»).

**Decisão**: no cabeçalho do canal (texto e voz), o gatilho passa a **ícone só**, metáfora **grupo de pessoas (duas silhuetas)**. Nome acessível e dica ao pairar: «Membros». Enquanto o painel está aberto, o **mesmo desenho** do ícone permanece; o **botão** mostra estado seleccionado/pressionado (fundo/chrome distinto — padrão Discord), não uma segunda metáfora (pessoas preenchidas) nem só uma mudança de cor. O título «Membros» **dentro** do painel direito mantém-se — o destino tem nome; o chrome tem ícone.

Os outros controlos do cabeçalho (E2EE, modo palco, composição/grade) **não mudam de sítio** nesta feature: só o rótulo visível «Membros» é substituído.

### Convite — o que o mercado faz

| Produto | Onde está | Metáfora |
|---------|-----------|----------|
| Discord | Menu do servidor («Invite People») e topo da lista de membros | Pessoa com «+» |
| Slack | Menu do workspace / «Add people» | Pessoa com «+» ou «adicionar» |
| Teams | «Add members» | Pessoa com «+» |

**Rejeitado**

- Ícone de corrente / ligação — lê-se como «abrir URL» ou «copiar link genérico», não como «trazer alguém para o servidor». O diálogo Mesa continua a gerar um link; a **intenção** do utilizador é convidar pessoas.
- Manter o botão textual «Convite» no fundo da lista de canais — padrão de UI antiga, pouco alinhado com cabeçalhos Discord/Slack (título à esquerda, acções à direita) e fácil de ignorar abaixo da lista.

**Decisão**: ícone **pessoa com mais** no **cabeçalho da coluna do servidor**, na mesma linha do nome: nome à **esquerda**, ícone à **direita**. O botão textual do fundo da lista **desaparece** (é o mesmo controlo, noutro sítio). O diálogo de convite **não muda**. O ícone é visível **apenas ao dono** — alinhado à regra já existente (só o dono gera convites), para não promover um controlo que falha para os restantes membros.

Esta combinação (pessoas vs pessoa+) distingue as duas acções: **ver quem já está** vs **trazer alguém novo**.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir membros pelo ícone no canal (Priority: P1)

Como membro num canal de texto ou de voz, quero um ícone reconhecível de «pessoas» no cabeçalho do canal em vez da palavra «Membros», para libertar espaço e alinhar o chrome ao resto da Mesa e aos produtos de referência, sem perder a capacidade de abrir e fechar a lista.

**Why this priority**: Pedido principal; o controlo já existe (008) — muda só a apresentação e a descoberta.

**Independent Test**: Abrir um canal de texto e um de voz; o cabeçalho não mostra a palavra «Membros» no botão; o ícone de grupo abre/fecha o painel direito; leitor de ecrã / dica diz «Membros».

**Acceptance Scenarios**:

1. **Given** um canal de texto com servidor seleccionado, **When** olho para o cabeçalho do canal, **Then** vejo um ícone de grupo de pessoas (não o texto «Membros») e, ao activá-lo, o painel de membros abre como hoje.
2. **Given** o painel aberto, **When** volto a activar o mesmo ícone, **Then** o painel fecha; enquanto esteve aberto, o botão do ícone parecia seleccionado/pressionado (mesmo desenho de grupo, chrome distinto).
3. **Given** um canal de voz/vídeo, **When** uso o mesmo ícone no cabeçalho, **Then** o comportamento é o mesmo que no texto (paridade 008).
4. **Given** teclado ou leitor de ecrã, **When** foco o controlo, **Then** o nome acessível é «Membros» (a função não fica só no desenho).

---

### User Story 2 - Convidar a partir do cabeçalho do servidor (Priority: P1)

Como **dono** de um servidor, quero convidar outras pessoas a partir de um ícone à direita do nome do servidor (não de um botão «Convite» no fundo da lista), para a acção viver no sítio onde o mercado coloca acções do servidor: o cabeçalho da coluna. Membros que não são donos não vêem este ícone.

**Why this priority**: Pedido explícito de colocação; o fluxo de convite já existe — muda gatilho e sítio.

**Independent Test**: Como dono, seleccionar um servidor → cabeçalho com nome à esquerda e ícone pessoa+ à direita → activar abre o diálogo de convite actual; o botão textual «Convite» no fundo da lista já não existe. Como membro não-dono, o ícone não aparece.

**Acceptance Scenarios**:

1. **Given** sou o dono e tenho esse servidor seleccionado, **When** olho para o cabeçalho da coluna de canais, **Then** o nome do servidor está à esquerda e, alinhado à direita na mesma linha, um ícone de pessoa com mais (dica «Convite»).
2. **Given** esse ícone, **When** o activo, **Then** abre o mesmo diálogo de convite de hoje (gerar/mostrar o convite).
3. **Given** a lista de canais, **When** percorro o fundo da coluna, **Then** **não** há botão com o texto «Convite».
4. **Given** nenhum servidor seleccionado («Sem servidor»), **When** olho o cabeçalho, **Then** o ícone de convite **não está visível**.
5. **Given** sou membro mas **não** dono do servidor seleccionado, **When** olho o cabeçalho, **Then** vejo o nome do servidor e **não** vejo o ícone de convite.

---

### User Story 3 - Distinguir «ver membros» de «convidar» (Priority: P2)

Como membro que usa os dois controlos no mesmo ecrã, quero que os dois ícones não se confundam, para não abrir a lista quando queria um link de convite (ou o contrário).

**Why this priority**: Risco clássico de dois ícones «de pessoas» na mesma shell; resolve-se com metáforas diferentes já escolhidas acima.

**Independent Test**: Como dono, com servidor e canal abertos, os dois ícones estão visíveis em sítios diferentes (cabeçalho do canal vs cabeçalho do servidor) e com formas distintas (grupo vs pessoa+). Como não-dono, só o de membros aparece no canal.

**Acceptance Scenarios**:

1. **Given** sou dono, com servidor e canal abertos, **When** comparo os dois controlos, **Then** o de membros é um **grupo** no cabeçalho do **canal** e o de convite é **pessoa com mais** no cabeçalho do **servidor**.
2. **Given** pairar ou foco, **When** leio a dica/nome, **Then** um diz «Membros» e o outro «Convite».
3. **Given** não sou dono, **When** olho a shell com canal aberto, **Then** o ícone de membros no canal continua visível e o de convite no cabeçalho do servidor **não**.

---

### Edge Cases

- Sem servidor: o ícone de convite **não aparece**; membros continua desabilitado/oculto como hoje se não houver servidor no canal.
- Membro que não é dono: o cabeçalho do servidor mostra só o nome (sem ícone de convite); a lista de membros no canal continua disponível para todos.
- Modo Palco com coluna de canais colapsada: o cabeçalho do servidor (e o ícone de convite) pode estar oculto como o resto do chrome dessa coluna; o convite volta a estar disponível ao expandir «mostrar canais» — não é obrigatório um segundo atalho de convite no palco.
- Viewport estreito / drawer: o ícone de convite permanece na linha do nome (não deve empurrar o nome para fora de forma ilegível; o nome pode encurtar com reticências).
- Cabeçalho de voz já denso: o ícone de membros deve ocupar **menos** largura do que a palavra «Membros»; não deve empurrar «Modo palco» / E2EE para uma segunda linha se hoje cabem numa.
- Ícone em falta / falha de desenho: o controlo continua identificável pelo nome acessível (não um botão vazio).
- Tema claro e escuro: ambos os ícones legíveis, mesmo traço/peso que o resto do sistema de ícones da Mesa.
- O diálogo de convite e o conteúdo do painel de membros **não** mudam; a visibilidade do ícone de convite passa a reflectir a regra (só o dono).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: No cabeçalho do canal de **texto** e do canal de **voz/vídeo**, o gatilho da lista de membros MUST ser um **ícone só** com metáfora de **grupo de pessoas** (duas silhuetas ou equivalente inequívoco de «membros»), MUST NOT mostrar a palavra «Membros» como rótulo visível desse botão.
- **FR-002**: Esse controlo MUST manter a função actual: abrir/fechar o painel de membros à direita. MUST expor nome acessível e dica «Membros». Enquanto o painel está aberto, MUST usar o **mesmo desenho** de grupo e MUST mostrar o botão em estado **seleccionado/pressionado** (chrome/fundo distinto do estado fechado). MUST NOT depender só da cor (ex. só mudar o matiz do traço) e MUST NOT exigir um segundo pictograma (contorno vs preenchido).
- **FR-003**: O título «Membros» **dentro** do painel da lista MAY permanecer; esta feature MUST NOT exigir esconder esse título.
- **FR-004**: Quando o utilizador é **dono** do servidor seleccionado, o cabeçalho da coluna do servidor MUST mostrar o **nome à esquerda** e um ícone de **convite à direita** na mesma linha. A metáfora MUST ser **pessoa com mais** (trazer alguém), MUST NOT ser só uma corrente/ligação.
- **FR-005**: Activar o ícone de convite MUST abrir o **mesmo** fluxo/diálogo de convite que o botão «Convite» actual. O conteúdo do diálogo MUST permanecer igual. A regra de quem pode gerar convites MUST permanecer: **só o dono**.
- **FR-006**: O botão textual «Convite» no fundo da lista de canais MUST ser **removido**. MUST NOT ficar um segundo gatilho duplicado nesse sítio.
- **FR-007**: O ícone de convite MUST estar **oculto** (não visível, não apenas inactivo) quando não há servidor seleccionado **ou** quando o utilizador actual **não** é o dono desse servidor.
- **FR-008**: Os dois ícones MUST ser distinguíveis entre si (grupo vs pessoa+) e MUST seguir o mesmo sistema visual dos outros ícones do shell (pesquisa, sino, «+»): tamanho, peso, alinhamento, tema claro/escuro.
- **FR-009**: Esta feature MUST NOT alterar o processo de gerar ou aceitar convites, nem o comportamento do painel de membros para além do gatilho no cabeçalho do canal.

### Out of Scope

- Redesign do diálogo de convite.
- Alargar convites a não-donos (a regra continua: só o dono gera convites).
- Segundo atalho «Convidar» dentro do painel de membros (padrão Discord; pode ser backlog).
- Contagem de membros no ícone, presença online, ou badges.
- Reordenar os outros controlos do cabeçalho do canal (composição/grade, editar cena, modo palco, E2EE).
- Novos fluxos de convite (e-mail, DM, QR).

### Key Entities

- **Gatilho de membros**: controlo no cabeçalho do canal que mostra/oculta a lista do servidor.
- **Gatilho de convite**: controlo no cabeçalho da coluna do servidor que inicia o fluxo de convite existente.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão visual dos cabeçalhos de canal (texto e voz) e do cabeçalho do servidor, **0** ocorrências da palavra «Membros» ou «Convite» como rótulo visível desses dois gatilhos.
- **SC-002**: Em teste com 5 pessoas familiarizadas com Discord ou Slack, **≥4** identificam correctamente o ícone de grupo como «lista de membros» e o ícone pessoa+ como «convidar», sem instrução prévia.
- **SC-003**: Para o **dono**, abrir o diálogo de convite continua a ser **um** clique a partir do cabeçalho do servidor (mesmo número de passos que o botão antigo, noutro sítio).
- **SC-004**: 100% dos dois controlos têm nome acessível em português («Membros» / «Convite») verificável com leitor de ecrã ou inspecção de acessibilidade.
- **SC-005**: No cabeçalho de voz, a largura ocupada pelo gatilho de membros é **menor** do que com a palavra «Membros»; o cabeçalho não piora o wrapping relativamente ao estado actual.
- **SC-006**: Em revisão com uma conta que **não** é dona do servidor seleccionado, **0** ícones de convite visíveis no cabeçalho do servidor.

## Assumptions

- O sistema de ícones da 012 (mesmo traço e peso) é o sítio certo para estes dois símbolos; não se introduzem pictogramas de outro estilo.
- Ícone só + dica ao pairar é o padrão certo aqui (como pesquisa e sino), **não** ícone+texto como nos controlos de chamada (microfone/câmara), que são de alto risco ao vivo.
- Só o dono do servidor pode gerar convites (regra já existente); o chrome passa a mostrar o ícone **apenas** a esse dono, em vez de o oferecer a todos e falhar ao clicar.
- Em palco colapsado, perder temporariamente o cabeçalho do servidor (e o convite) é aceitável — é o mesmo chrome que já desaparece.
- Distinguir as duas metáforas (grupo vs pessoa+) é suficiente; não é necessário texto visível para as separar.
- O estado «lista aberta» no gatilho de membros é o botão seleccionado/pressionado, não um segundo desenho do ícone.
