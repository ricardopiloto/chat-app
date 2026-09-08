# Feature Specification: Paridade de permissionamento — Fase 1 (hierarquia, overwrites, explicação)

**Feature Branch**: `060-permissions-parity-phase1`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Faça uma análise de gap do permissionamento com base no documento docs/design-ref/mesa_analise_permissionamento_discord.md e crie uma spec com /speckit-specify"

**Depends on**: [047-server-channel-permissions](../047-server-channel-permissions/), [052-members-role-assignment](../052-members-role-assignment/) (papel único), [058-channel-mute-member](../058-channel-mute-member/), [059-server-owner-role](../059-server-owner-role/).

**Gap analysis**: [gap-analysis.md](./gap-analysis.md) (Mesa vs Discord reference).

**Problem**: O Mesa já tem papéis com capacidades e ACL por canal, mas falta **hierarquia administrativa**, **overwrites Allow/Deny** no estilo Discord, e **explicação** de por que um acesso foi negado/permitido — gaps que quebram a familiaridade e a moderação segura em servidores de RPG.

## Clarifications

### Session 2026-09-08

- Q: Deny de «visualizar» em canal público? → A: Deny de visualizar **só em privados**; públicos mantêm-se sempre listáveis; Deny cobre escrever/voz nos públicos
- Q: Explicação de acesso na Fase 1? → A: Erros claros **e** ecrã admin para inspeccionar acesso efectivo membro×canal (causa principal)
- Q: Camada `@everyone` / default no overwrite? → A: Overwrite explícito **«todos os membros»** por canal, aplicado **antes** dos overwrites de perfil
- Q: Quem pode reordenar a hierarquia? → A: Quem tiver capacidade de **gerir perfis**, só move perfis **estritamente abaixo** da sua posição (dono isento)
- Q: Posição inicial de novos perfis? → A: Sempre no **fundo** (posição mais baixa), acima só de «sem perfil»

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Hierarquia impede abusar de quem está acima (Priority: P1)

Como dono ou moderador, quero que expulsar, silenciar ou alterar o perfil de outro membro só seja possível se o meu perfil estiver **acima** do dele na hierarquia do servidor (e o dono sempre no topo), para um moderador júnior não poder expulsar o mestre ou o dono.

**Why this priority**: Gap #1 da análise; risco de segurança social imediato.

**Independent Test**: Criar perfis com posições distintas; membro com kick/mute tenta agir sobre alguém de posição igual ou superior → bloqueado com mensagem clara; sobre alguém abaixo → permitido (se tiver a capacidade).

**Acceptance Scenarios**:

1. **Given** o perfil Moderador está abaixo do perfil Mestre na hierarquia, e ambos têm capacidade de expulsar, **When** um Moderador tenta expulsar um Mestre, **Then** a acção é **negada**.
2. **Given** o mesmo Moderador, **When** tenta silenciar (mute de canal) um membro com perfil abaixo, **Then** a acção é **permitida** (se tiver a capacidade de mute).
3. **Given** o **Dono** do servidor, **When** qualquer outro membro tenta expulsá-lo ou alterar-lhe o perfil, **Then** a acção é **negada**.
4. **Given** um administrador de perfis, **When** tenta editar ou apagar um perfil de posição **igual ou superior** à sua, **Then** a acção é **negada** (salvo o dono).
5. **Given** um membro com capacidade de gerir perfis abaixo do Mestre, **When** tenta reordenar o perfil Mestre (igual/acima), **Then** a reordenação é **negada**; **When** reordena um perfil estritamente abaixo, **Then** é **permitida**.

---

### User Story 2 - Overwrites Allow/Deny no canal (Priority: P1)

Como mestre de mesa, quero negar explicitamente a um perfil (ou a um membro) a visualização ou a escrita num canal privado de segredos, mesmo que o perfil tenha capacidades gerais de ver/escrever no servidor, para salas `#gm-secrets` funcionarem como no Discord.

**Why this priority**: Gap central de ACL; modelo actual só “concede”, não “nega”.

**Independent Test**: Perfil Jogador com envio de mensagens no servidor; no canal X, Deny de ver ou escrever para Jogador → membro com esse perfil não vê ou não escreve; Allow individual a um jogador específico sobrescreve o deny do perfil quando aplicável à ordem de resolução.

**Acceptance Scenarios**:

1. **Given** um canal e um perfil com Deny de visualizar nesse canal, **When** um membro só com esse perfil lista canais / abre o canal, **Then** **não** vê o canal (ou recebe negação clara).
2. **Given** Deny de escrever no canal para um perfil, mas o membro ainda pode ver, **When** tenta enviar mensagem, **Then** o envio é **negado**.
3. **Given** Deny para o perfil e Allow de visualizar para um **membro** concreto no mesmo canal, **When** esse membro acede, **Then** consegue visualizar (overwrite de membro prevalece sobre o do perfil, na ordem definida).
4. **Given** Deny de escrever no overwrite **«todos os membros»** e Allow de escrever no perfil Mestre, **When** um Mestre tenta enviar, **Then** consegue enviar (perfil prevalece sobre «todos»).
5. **Given** o **dono** do servidor, **When** existem Deny no canal, **Then** o dono continua a poder administrar e aceder (autoridade absoluta do dono mantém-se).
6. **Given** um canal **público**, **When** se tenta Deny de visualizar a um perfil ou a «todos», **Then** o canal continua listável para membros; Deny de visualizar nesse canal é rejeitado ou sem efeito de ocultação (Deny de escrever/voz continua permitido).

---

### User Story 3 - Explicar por que o acesso foi negado (Priority: P2)

Como administrador, quero mensagens de erro claras nas acções negadas **e** um **ecrã de inspecção** do acesso efectivo de um membro a um canal — por exemplo «negado pelo overwrite» ou «perfil abaixo na hierarquia» — para diagnosticar salas e moderação sem adivinhar.

**Why this priority**: Recomendação forte do documento de referência; reduz suporte; completa a Fase 1.

**Independent Test**: Forçar negação por hierarquia e por overwrite; erro da acção inclui motivo em português; abrir inspecção admin membro×canal mostra os mesmos factores e o resultado allow/deny.

**Acceptance Scenarios**:

1. **Given** uma expulsão negada por hierarquia, **When** o actor vê o erro, **Then** a mensagem indica que o alvo está no mesmo nível ou acima (sem jargão técnico opaco).
2. **Given** envio de mensagem negado por Deny no canal, **When** o membro tenta enviar, **Then** a mensagem de erro indica restrição do canal (não um erro genérico sem causa).
3. **Given** um administrador com permissão para gerir o servidor/canais, **When** abre o ecrã de inspecção do acesso de um membro a um canal, **Then** vê o resultado efectivo (permitido/negado) e um resumo dos factores (perfil, overwrite, dono) coerente com a decisão do motor.

---

### Edge Cases

- Canais **públicos**: Deny de visualizar não esconde o canal; só Deny de escrever/voz (e Allow correspondentes) aplicam-se a públicos.
- Servidor só com perfil Dono: hierarquia trivial; dono continua a poder tudo.
- Membro **sem perfil**: tratado como o fundo da hierarquia (abaixo de qualquer perfil posicionado); capacidades = defaults abertos actuais salvo overwrites.
- Perfil **novo**: entra sempre no fundo da hierarquia; o criador pode reordená-lo depois se tiver autoridade (FR-003).
- Migrar ACL antiga (só grants): grants existentes MUST continuar a permitir o que já permitiam; Deny é aditivo.
- Reordenar hierarquia: só quem gere perfis e só alvos abaixo; mudanças de posição MUST aplicar-se de imediato às próximas acções administrativas.
- Preferência de movimento / UI: fora de âmbito excepto controlos mínimos para reordenar perfis e editar overwrites.
- Multi-papel por membro: **fora** desta feature (mantém-se papel único 052).
- Categorias, threads, comandos slash, ABAC/campanha, flag ADMINISTRATOR distinta do dono: **fora** desta fase (ver gap-analysis).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Cada perfil de servidor MUST ter uma **posição hierárquica** ordenável (maior = mais autoridade administrativa). O perfil **Dono** (ou o dono do servidor) MUST estar sempre no topo efectivo para acções administrativas sobre membros.
- **FR-001a**: Um perfil **novo** (não-Dono) MUST nascer na **posição mais baixa** da hierarquia (acima apenas de membros sem perfil); reordenação posterior segue FR-003.
- **FR-002**: Acções administrativas sobre **membros** (pelo menos: expulsar, silenciar em canal, atribuir/alterar perfil) MUST ser negadas se a posição do actor for **menor ou igual** à do alvo (excepto o dono do servidor a actuar sobre outros).
- **FR-003**: Acções administrativas sobre **perfis** (editar capacidades, apagar, **reordenar**) MUST exigir capacidade de gerir perfis **e** respeitar a hierarquia: o actor só altera ou move perfis **estritamente abaixo** da sua posição; o **dono** está isento e pode reordenar qualquer perfil não-protegido pelo topo absoluto do dono.
- **FR-004**: Administradores autorizados MUST poder definir **overwrites** por canal para (1) **todos os membros** (camada `@everyone` / default do canal), (2) **perfis**, e (3) **membros**, com efeito **Allow** ou **Deny** sobre capacidades de canal relevantes (no mínimo: visualizar; enviar mensagem em texto; ligar/falar em voz conforme o tipo do canal).
- **FR-004a**: **Deny de visualizar** MUST aplicar-se apenas a canais **privados**. Canais **públicos** permanecem sempre listáveis/visíveis a membros do servidor (regra 047 FR-008); em públicos, Deny MAY restringir escrever (texto) ou ligar/falar (voz), mas MUST NÃO esconder o canal da lista.
- **FR-005**: A resolução de acesso ao canal MUST aplicar overwrites nesta ordem estável: base (capacidades do perfil + regras de visibilidade públicas/privadas) → overwrite **todos os membros** → overwrites de **perfil** → overwrite de **membro** → excepção do **dono**. Deny MUST poder retirar um direito que a base concederia (excepto visualizar em canal público — FR-004a).
- **FR-006**: Grants/ACL já existentes MUST permanecer válidos após a introdução de Deny (migração sem perda de acesso já concedido).
- **FR-007**: Quando uma acção coberta por FR-002/FR-004 for negada, o produto MUST expor uma **explicação** compreensível na mensagem de erro (API + UI) que identifique a causa principal (hierarquia vs overwrite vs falta de capacidade).
- **FR-007a**: Administradores autorizados MUST poder abrir um **ecrã de inspecção** (membro × canal) que mostre o acesso efectivo e a causa principal, alinhado ao mesmo motor de decisão (não só erros reativos).
- **FR-008**: O motor de decisão desta fase MUST ser conceptualmente único (mesmas regras na API e na UI); novos pontos de verificação destas regras MUST reutilizar essa lógica em vez de duplicar condições ad hoc.
- **FR-009**: Papel **único** por membro permanece (052). Esta feature MUST NÃO reintroduzir múltiplos perfis por membro.
- **FR-010**: Categorias de canais, threads, permissões de comandos, políticas ABAC/campanha e flag «Administrador» separada do dono estão **fora** do âmbito obrigatório desta feature.

### Key Entities

- **Role position**: Ordenação administrativa de um perfil no servidor (não herda capacidades automaticamente).
- **Channel overwrite**: Regra Allow/Deny por canal; sujeito = **todos os membros**, **perfil** ou **membro**; sobre um direito de canal.
- **Access decision**: Resultado allow/deny + factores de explicação (perfil, posição, overwrite, dono).
- **Authorization check**: Avaliação «pode o actor fazer a acção sobre o recurso?» usada por expulsar/mute/ACL/escrita.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 10 tentativas de expulsão/mute de um alvo com posição ≥ à do actor (não-dono), 10/10 são bloqueadas.
- **SC-002**: Em 10 tentativas do mesmo actor sobre alvos estritamente abaixo (com capacidade), 10/10 são permitidas.
- **SC-003**: Em 10 canais com Deny de visualizar para um perfil, membros só com esse perfil não acedem em 10/10 testes.
- **SC-004**: Em 5 casos Allow de membro sobre Deny de perfil, o membro Allow acede em 5/5.
- **SC-005**: Em 10 negações (hierarquia ou overwrite), 10/10 mostram explicação utilizável (não só código genérico).
- **SC-005a**: Em 5 pares membro×canal inspeccionados no ecrã admin, 5/5 mostram resultado e causa principal coerentes com a decisão real da API.
- **SC-006**: Após migração, 5 canais que só tinham grants antigos mantêm o mesmo acesso efectivo para os mesmos membros (regressão zero nesse conjunto de teste).

## Assumptions

- A análise completa Mesa vs Discord está em [gap-analysis.md](./gap-analysis.md); esta feature cobre só a **Fase 1**.
- «Hierarquia» = controlo administrativo entre membros/perfis; **não** significa que um perfil superior herda automaticamente as capacidades dos inferiores (alinhado ao Discord).
- O dono do servidor (`owner_account_id` / perfil Dono) permanece autoridade absoluta, acima de qualquer posição.
- Direitos de canal na v1 desta feature alinham-se aos já existentes (ver / enviar; ligar / falar), expressos como Allow/Deny nos overwrites.
- UI mínima: reordenar perfis na gestão de perfis; editar overwrites (incluindo **«todos os membros»**) no fluxo de ACL do canal; **ecrã de inspecção** membro×canal (FR-007a) obrigatório nesta fase.
- Referência de produto: [mesa_analise_permissionamento_discord.md](../../docs/design-ref/mesa_analise_permissionamento_discord.md).
