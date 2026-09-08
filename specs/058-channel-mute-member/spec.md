# Feature Specification: Silenciar no canal e remoção de membro

**Feature Branch**: `058-channel-mute-member`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Sobre as permissões, «remover membro» deve apenas remover o usuário do servidor atual, não podemos apagar a conta do usuário. Vamos adicionar a opção de silenciar o usuário, e isso terá configurações de tempo: 5, 10, 15, 30 minutos ou um tempo definido pelo usuário. Durante esse período, o usuário silenciado não poderá enviar nenhuma mensagem no canal aonde ele foi silenciado."

**Depends on**: papéis e permissões de servidor/canal ([047-server-channel-permissions](../047-server-channel-permissions/)); gestão de membros ([052-members-role-assignment](../052-members-role-assignment/), [056-server-settings-shell](../056-server-settings-shell/)).

**Problem**: «Remover membro» deve ficar inequívoco: só tira a pessoa **deste servidor**, sem apagar a conta na instância. Em paralelo, moderadores precisam de um meio temporário de impedir mensagens num **canal concreto**, sem expulsar o membro do servidor.

## Clarifications

### Session 2026-09-08

- Q: Onde vive a acção principal Silenciar na v1? → A: No contexto do **canal** (menu do membro no roster / lista de membros do canal).
- Q: Quem pode silenciar e levantar silêncio? → A: Nova capacidade de papel **Silenciar membros**, além do **dono** do servidor.
- Q: Como se comporta o composer enquanto silenciado? → A: Composer **desactivado**/bloqueado, com mensagem do silêncio e fim previsto.
- Q: Como ver/levantar silêncios activos na v1? → A: No **mesmo menu do membro**: se já silenciado → «Levantar silêncio» (+ tempo restante).
- Q: Silenciado pode editar/apagar as próprias mensagens antigas? → A: **Sim** — só **novas** mensagens estão bloqueadas.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Remover membro = só sair do servidor (Priority: P1)

Como moderador ou dono com permissão de remover membros, quero **remover um membro do servidor actual** sabendo que a **conta do utilizador permanece** na instância (pode voltar por convite ou existir noutros servidores), para não destruir identidade/conta por engano.

**Why this priority**: Clarificação de segurança/produto pedida explicitamente; evita perda irreversível de conta.

**Independent Test**: Remover membro B do servidor S → B deixa de ver S; a conta de B continua a autenticar-se; B pode juntar-se a outro servidor ou ao mesmo via convite.

**Acceptance Scenarios**:

1. **Given** sou autorizado a remover membros e B é membro (não dono), **When** removo B do servidor, **Then** B deixa de ser membro desse servidor e deixa de aceder aos seus canais.
2. **Given** B foi removido do servidor, **When** B inicia sessão na mesma instância, **Then** a conta continua válida (login/handle intactos) — **não** houve apagamento de conta.
3. **Given** a UI de remoção, **When** confirmo a acção, **Then** a linguagem deixa claro que se trata de **remover do servidor** (não «apagar conta» / «eliminar utilizador»).

---

### User Story 2 - Silenciar membro num canal com duração (Priority: P1)

Como moderador autorizado, quero **silenciar** um membro num **canal** por um período (5, 10, 15, 30 minutos ou duração personalizada), para que durante esse tempo **não possa enviar mensagens** nesse canal, sem o expulsar do servidor.

**Why this priority**: Capacidade nova pedida; valor principal da feature além da clarificação do kick.

**Independent Test**: Silenciar B em canal C por 5 minutos → B não consegue enviar mensagem em C; noutro canal do mesmo servidor (se permitido) pode enviar; após expirar, B volta a poder enviar em C.

**Acceptance Scenarios**:

1. **Given** tenho a capacidade **Silenciar membros** (ou sou dono) e B é membro visível no canal, **When** abro o menu de B no **contexto desse canal** (roster / lista de membros do canal), escolho silenciar e selecciono **5 / 10 / 15 / 30 minutos**, **Then** o silêncio fica activo nesse canal até ao fim do intervalo.
2. **Given** o fluxo de silenciar, **When** escolho **tempo definido por mim** (duração personalizada válida), **Then** o silêncio usa essa duração.
3. **Given** B está silenciado no canal C, **When** B abre o canal C, **Then** o composer está **desactivado/bloqueado** e mostra feedback claro do silêncio (incluindo fim previsto quando conhecido); B **não** consegue iniciar um envio normal.
4. **Given** B está silenciado só em C, **When** B usa o composer noutro canal D (sem silêncio), **Then** pode enviar normalmente em D (mute é **por canal**).

---

### User Story 3 - Ver estado e levantar silêncio (Priority: P2)

Como moderador, quero ver no menu do membro se está silenciado e **levantar o silêncio antes do fim**, e como membro silenciado quero perceber no composer até quando estou impedido de falar nesse canal.

**Why this priority**: Operação e transparência; secundário ao poder silenciar.

**Independent Test**: Silenciar → UI mostra estado/restante; moderador remove silêncio → B envia de imediato; silêncio expira sozinho sem acção.

**Acceptance Scenarios**:

1. **Given** B está silenciado no canal, **When** um moderador autorizado abre o **menu de B** nesse canal, **Then** vê indicação de silêncio activo (com tempo restante quando disponível) e a acção **Levantar silêncio**.
2. **Given** B está silenciado, **When** um moderador autorizado escolhe **Levantar silêncio** no menu de B, **Then** B pode enviar mensagens de imediato nesse canal (composer desbloqueia).
3. **Given** o período termina, **When** B reabre ou permanece no canal, **Then** o composer volta ao normal sem necessidade de acção manual.

---

### Edge Cases

- Remover o **dono** do servidor: continua proibido (comportamento actual de hierarquia).
- Remover a si próprio: fora de âmbito desta feature (sair do servidor, se existir, é outro fluxo).
- Silenciar o dono do servidor ou a si próprio: **não** permitido.
- Silenciar quem já está silenciado no mesmo canal: renovar/substituir a duração pelo novo pedido (último silêncio prevalece).
- Duração personalizada inválida (vazia, zero, negativa, ou acima do máximo aceite): rejeitada com mensagem clara; presets 5/10/15/30 continuam válidos.
- Canal de voz/vídeo: o silêncio desta feature aplica-se a **mensagens de texto** no contexto do canal; não desliga automaticamente microfone/câmara numa chamada (salvo se o canal for só texto — o bloqueio é de envio de mensagens).
- Membro silenciado ainda **vê** o canal e o histórico (só não envia mensagens novas), salvo outras regras de ACL; pode editar/apagar as próprias mensagens antigas.
- Remover do servidor um membro que estava silenciado: o mute desse canal deixa de ser relevante (já não é membro); a conta permanece.
- Relógio / fuso: o fim do silêncio é absoluto no tempo do servidor; ao expirar, o composer desbloqueia e o próximo envio já é permitido.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A acção **Remover membro** MUST remover apenas a **membership** do utilizador no **servidor actual** (deixar de ser membro).
- **FR-002**: Remover membro MUST **NÃO** apagar a conta do utilizador na instância (credenciais, handle e existência da conta permanecem).
- **FR-003**: A UI e confirmações de remoção MUST usar linguagem de «remover do servidor» / equivalente — MUST NÃO sugerir apagar conta.
- **FR-004**: Utilizadores autorizados MUST poder **silenciar** outro membro num **canal** específico por uma duração escolhida, a partir do **menu/contexto do membro nesse canal** (roster ou lista de membros do canal) — não como fluxo principal na página Gerir membros do servidor na v1.
- **FR-005**: As durações preset MUST incluir **5, 10, 15 e 30 minutos**, mais uma opção de **duração personalizada** definida pelo moderador.
- **FR-006**: Enquanto o silêncio estiver activo nesse canal, o membro silenciado MUST NÃO conseguir **enviar mensagens novas** nesse canal (incluindo anexos associados a uma nova mensagem).
- **FR-006a**: Para o silenciado, o **composer** desse canal MUST ficar **desactivado ou equivalente bloqueado** (não apenas falhar no submit), com texto que explique o silêncio e, quando disponível, **até quando** dura.
- **FR-006b**: O silêncio MUST **NÃO** impedir o membro de **editar ou apagar as suas próprias** mensagens já existentes nesse canal (sujeito às regras normais de edição/apagamento).
- **FR-007**: O silêncio MUST ser **por canal**: não impede, por si só, mensagens noutros canais do mesmo servidor.
- **FR-008**: O produto MUST reforçar no servidor a recusa de envios do silenciado (mesmo se o cliente for contornado) e MUST permitir envio de novo quando o silêncio expirar ou for levantado; o composer MUST voltar ao normal após o fim.
- **FR-009**: Utilizadores autorizados MUST poder **levantar** um silêncio activo antes do fim da duração, via o **mesmo menu do membro** no canal (quando o alvo já está silenciado, a acção primária é «Levantar silêncio», com tempo restante quando conhecido).
- **FR-009a**: A v1 MUST NÃO exigir uma lista dedicada «todos os silenciados do canal»; o estado consulta-se por membro no menu.
- **FR-010**: Quem pode silenciar e levantar silêncio: o **dono do servidor**, ou um membro com a capacidade efectiva de papel **Silenciar membros** (nova flag nas permissões de perfil). O criador do canal **não** ganha silêncio só por ser criador; **Apagar mensagens** / **Remover membros** **não** substituem esta capacidade.
- **FR-011**: Quem pode remover membros permanece a regra já existente de permissão **Remover membros** (dono / capacidade correspondente); esta feature apenas clarifica o efeito (FR-001/002).
- **FR-012**: Duração personalizada MUST aceitar um intervalo razoável (mínimo 1 minuto; máximo 24 horas) em minutos inteiros; fora disso, rejeitar.
- **FR-013**: A UI de edição de permissões de perfil MUST expor o toggle **Silenciar membros** (secção adequada, tipicamente Geral ou Texto) para papéis do servidor.
- **FR-014**: Membros sem a capacidade e que não sejam dono MUST NÃO ver (ou não poder concluir) a acção Silenciar / Levantar no menu do canal.

### Key Entities

- **Server membership**: Relação conta ↔ servidor; remoção elimina só esta relação.
- **Account**: Identidade na instância; não é destruída por remoção de membro.
- **Channel mute**: Registo de silêncio (canal, conta alvo, quem aplicou, início, fim); impede envio de mensagens no canal até expirar ou ser revogado.
- **Silenciar membros (capacidade)**: Flag de papel de servidor que autoriza silenciar/levantar (além do dono).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 10 remoções de membro de teste, 10/10 resultam em perda de acesso ao servidor e 0/10 apagam a conta (login da conta alvo continua possível).
- **SC-002**: Em 10 silêncios com preset (mistura 5/10/15/30), 10/10 bloqueiam envio no canal alvo durante o período e permitem envio noutro canal sem mute.
- **SC-003**: Em 5 silêncios com duração personalizada válida, 5/5 respeitam a duração (± tolerância de 1 minuto na percepção do utilizador no fim).
- **SC-004**: Em 5 aberturas do canal enquanto silenciado, 5/5 mostram composer bloqueado com motivo/fim e 0/5 publicam mensagem nova nesse canal.
- **SC-005**: Em 5 levantamentos manuais de silêncio, 5/5 permitem envio imediato no canal.

## Assumptions

- «Remover membro» já existe como capacidade; o trabalho é **garantir e comunicar** que nunca apaga conta (e corrigir se algum fluxo o fizer).
- Mute é **só mensagens novas** (composer bloqueado); editar/apagar as próprias continua permitido; não é timeout de voz global.
- Quem silencia = **dono** ou papel com **Silenciar membros** (nova capacidade); não reutilizar só «Apagar mensagens» nem o criador do canal por defeito.
- Presets em minutos; personalizado em minutos inteiros, 1–1440.
- Lista/estado de silenciados e acção Silenciar / Levantar: **entrada principal no chrome do canal** (menu do membro no roster / membros do canal); levantar no mesmo menu; sem lista dedicada obrigatória na v1.
- Notificação push ao silenciado é opcional na v1; o composer bloqueado basta para SC-004.
