# Feature Specification: Permissionamento de servidor e canais

**Feature Branch**: `047-server-channel-permissions`

**Created**: 2026-09-06

**Status**: Draft

**Input**: Spec original (servidor/canais, público/privado, papéis, convite) + amendment 2026-09-06 (tarde): **mais permissões** (frontend + backend); **página dedicada** (não modal) no painel principal (`empty-server-pane` / main); após guardar, fechar e **voltar ao canal anterior**; cada permissão = **toggle** + **descrição breve**; catálogo Geral/Texto (+ Discord onde fizer sentido); canais **públicos** sempre visíveis e com envio para todos os membros **até** alguém editar permissões do canal.

## Clarifications

### Session 2026-09-06 (manhã)

- Q: Grupos nas permissões? → A: Papéis/roles do servidor.
- Q: O que o convite concede? → A: Acesso ao servidor + só canais «visíveis a novos membros».
- Q: Criação público/privado? → A: Ao criar canal, escolher público ou privado; privado = só o criador no início; depois ACL; ícone de privado; sem permissão = não listado.
- Q: O criador do servidor vê canais privados de outros? → A: Sim — vê todos e gere ACL/conteúdo.
- Q: Quem pode criar canais? → A: Criador do servidor **ou** membros com papel «pode criar canais».
- Q: Convite vs acesso ao servidor? → A: Convite = membership; gerir acesso = membros/papéis.
- Q: Canal privado «visível a novos»? → A: Não — só públicos.
- Q: Excluir membro de canal público? → A: Não — tornar privado + ACL.

### Session 2026-09-06 (tarde) — UI e catálogo alargado

- Q: Modal vs página? → A: **Página dedicada** no painel principal (sobre a área do main / empty-server-pane); **não** modal.
- Q: Após guardar? → A: Fecha a página e **volta ao canal** onde o utilizador estava.
- Q: Forma de cada permissão na UI? → A: **Toggle** + título + **descrição breve** por baixo (padrão tipo Discord).
- Q: Públicos e envio? → A: Canais públicos **sempre** podem ser vistos e receber mensagens de todos os membros, **a não ser** que alguém edite as permissões desse canal.
- Q: «Gerenciar Perfis»? → A: Gerir **papéis/cargos** (criar/editar/apagar roles, atribuir membros) — alinhado a «Manage Roles».
- Q: «Visualizar» em canal público? → A: **Nunca oculta** o público — só se restringem outras acções; para ocultar, tornar **privado** + ACL.
- Q: Alvo da página dedicada? → A: Só permissões de **papel** (toggles Geral/Texto/Voz para o cargo seleccionado); ACL por canal permanece fora desta página (fluxos já existentes / outro sítio).

**Related**: [046-invite-5min-window](../046-invite-5min-window/); membros [008](../008-shell-chrome-members/), [019](../019-members-invite-icons/); implementação ACL/papéis já iniciada nesta feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Página dedicada de permissões (Priority: P1)

Como gestor do servidor (criador ou quem tiver autoridade), quero abrir uma **página de permissões de um papel** no painel principal (não um modal), ver categorias com toggles e descrições para esse cargo, guardar, e **regressar ao canal** onde estava.

**Why this priority**: Substitui o fluxo modal; contentor do catálogo de capacidades do papel.

**Independent Test**: Escolher/abrir um papel → página no main com toggles → alterar → guardar → voltar ao canal anterior.

**Acceptance Scenarios**:

1. **Given** estou num canal C do servidor S, **When** abro a configuração de permissões de um **papel**, **Then** o painel principal mostra a **página dedicada** desse papel (não um diálogo modal).
2. **Given** a página está aberta para o papel R, **When** guardo com sucesso, **Then** a página fecha e volto ao **canal C** (ou vista main equivalente).
3. **Given** a página está aberta, **When** vejo uma permissão, **Then** vejo título, descrição breve por baixo, e um **toggle** (capacidades **desse papel**).
4. **Given** não tenho autoridade para editar papéis/permissões, **When** tento abrir a página, **Then** a acção é recusada ou os controlos ficam só de leitura / bloqueados com feedback claro.

---

### User Story 2 - Catálogo Geral e Texto com toggles (Priority: P1)

Como gestor, quero activar/desactivar permissões **Gerais** e de **canais de texto** listadas abaixo, para o produto cobrir o conjunto pedido e o backend as aplicar.

**Why this priority**: Catálogo explícito do amendment.

**Independent Test**: Para cada toggle Geral/Texto, ligar/desligar e verificar efeito com conta de membro de teste.

**Acceptance Scenarios**:

1. **Given** a secção **Canais (Geral)**, **When** configuro os toggles, **Then** estão disponíveis pelo menos: **Visualizar canal**, **Gerenciar canal** (criar, editar ou apagar canais), **Gerenciar papéis/cargos** (criar/editar/apagar papéis e atribuir membros), **Criar convites** — cada um com descrição breve.
2. **Given** a secção **Canais (texto)**, **When** configuro os toggles, **Then** estão disponíveis: **Enviar mensagens**, **Apagar mensagens** (mensagens que **não** sejam do próprio autor) — cada um com descrição.
3. **Given** um membro **sem** «Enviar mensagens» efectivo num canal onde a regra se aplica, **When** tenta enviar, **Then** o envio é recusado / composer bloqueado.
4. **Given** um membro **com** «Apagar mensagens» (de outros), **When** apaga mensagem de outro autor, **Then** a mensagem é removida; **Given** sem essa permissão, **When** tenta o mesmo, **Then** é recusado (o autor pode continuar a apagar as **próprias** se essa regra de produto já existir).

---

### User Story 3 - Canais públicos até alguém restringir (Priority: P1)

Como membro, quero que canais **públicos** me deixem **ver** e **enviar** mensagens por omissão, até um gestor editar permissões desse canal (ou do papel que me afecta), para o default ser aberto e previsível.

**Why this priority**: Regra explícita do amendment; alinha expectativas Discord-like.

**Independent Test**: Canal público sem overrides → todos os membros vêem e enviam; após restringir «Enviar» a um papel/membro → esse sujeito deixa de enviar mas (em público) continua a ver o canal salvo regras de visualizar.

**Acceptance Scenarios**:

1. **Given** um canal **público** sem restrições editadas, **When** qualquer membro do servidor o abre, **Then** pode **ver** o canal e **enviar** mensagens (nível aberto).
2. **Given** o mesmo canal público, **When** um gestor edita permissões e remove «Enviar mensagens» a um papel/membro, **Then** esses sujeitos **deixam** de enviar; o canal **público continua visível** (não se oculta por toggle «Visualizar» — ocultar exige tornar privado).
3. **Given** um canal **privado**, **When** um membro não está na ACL, **Then** o canal continua **invisível** (comportamento já definido).

---

### User Story 4 - Permissões de voz e extras Discord que fazem sentido (Priority: P2)

Como gestor, quero também toggles de **voz/vídeo** e extras Mesa-relevantes inspirados no Discord, para não ficar só texto/geral.

**Why this priority**: Pedido «compare com Discord e traga as que fazem sentido»; secundário ao catálogo explícito.

**Independent Test**: Toggles de voz e anexos reflectem-se em entrar/falar/câmera e upload.

**Acceptance Scenarios**:

1. **Given** secção **Voz/vídeo**, **When** configuro, **Then** existem pelo menos: **Entrar / ouvir**, **Falar** (inclui **câmera**) — com descrições.
2. **Given** Mesa já tem anexos, **When** vejo permissões de texto, **Then** existe **Anexar ficheiros** (ou equivalente) com toggle + descrição.
3. **Given** já existe remover membros, **When** vejo Geral (ou Membros), **Then** existe **Remover membros** (kick) com toggle + descrição, alinhado ao comportamento de membership.

---

### User Story 5 - Papéis, privado/público e convite (Priority: P2) — preservação

Como criador, quero manter o modelo já clarificado: papéis, canais público/privado, «visível a novos» só em públicos, criador do servidor com visão plena.

**Why this priority**: Base já especificada; a página nova **MUST** continuar a respeitar estas regras.

**Independent Test**: Regressão dos critérios de privado/ícone/convite/owner bypass.

**Acceptance Scenarios**:

1. **Given** canal privado, **When** membro sem ACL (e não owner), **Then** não vê o canal.
2. **Given** convite aceite, **When** novo membro lista canais, **Then** só públicos «visíveis a novos» (e regras de nível/toggles aplicáveis).
3. **Given** sou criador do servidor, **When** outro cria canal privado, **Then** vejo e posso gerir.

---

### Edge Cases

- Guardar com falha de rede: mensagem clara; permaneço na página; canal anterior memorizado para quando guardar/sair com sucesso.
- Sair sem guardar: MUST NOT aplicar toggles pendentes (descartar ou pedir confirmação — Assumptions).
- Toggle desligado porque o gestor **não** tem essa permissão (padrão Discord «cannot modify»): toggle bloqueado + mensagem explicativa.
- Canal público com «Visualizar» desligado para um papel: **não oculta** o canal; públicos só restringem outras acções via toggles; ocultar = tornar **privado** + ACL.
- Autor a apagar a **própria** mensagem vs «Apagar mensagens» de outros: regras distintas.
- Stage / membros abertos: a página ocupa o main; chrome lateral permanece.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O produto MUST expor a configuração das **capacidades de um papel** numa **página dedicada** no painel principal da shell (área do main / empty-server-pane), **MUST NOT** usar um modal como UI principal dessa configuração. A edição de ACL **por canal** MUST NOT ser o objecto desta página (pode permanecer noutro fluxo).
- **FR-002**: Ao **guardar** com sucesso as capacidades do papel, a UI MUST fechar a página e **restaurar** o canal (ou vista main) em que o utilizador estava antes de abrir a página.
- **FR-003**: Cada capacidade do papel na página MUST ser apresentada como **toggle**, com **título** e **descrição breve** por baixo do título.
- **FR-004**: O catálogo **Geral** MUST incluir pelo menos: Visualizar canal; Gerenciar canal (criar/editar/apagar canais); **Gerenciar papéis/cargos** (criar/editar/apagar papéis e atribuir membros); Criar convites.
- **FR-005**: O catálogo **Texto** MUST incluir pelo menos: Enviar mensagens; Apagar mensagens de outros autores.
- **FR-006**: O catálogo **Voz/vídeo** MUST incluir pelo menos: Entrar/ouvir; Falar (inclui câmera).
- **FR-007**: O catálogo MUST incluir **Anexar ficheiros** (texto) e **Remover membros** (servidor), por relevância Mesa/Discord.
- **FR-008**: Canais **públicos** MUST, por omissão, permitir a **todos** os membros **ver** e **enviar** mensagens (e uso de voz no nível aberto, se aplicável), até um gestor **editar** permissões que restrinjam toggles efectivos. Em canal **público**, desligar «Visualizar» MUST NOT ocultar o canal; para ocultar MUST tornar o canal **privado** e usar ACL.
- **FR-009**: Frontend e backend MUST aplicar as mesmas regras efectivas para cada toggle (tentativas sem permissão falham de forma segura e clara).
- **FR-010**: Persistência: alterações guardadas MUST sobreviver a refresh; cancelar/sair sem guardar MUST NOT alterar o estado persistido.
- **FR-011**: Mantém-se: membership = acesso ao servidor; papéis; canais público/privado; ACL; «visível a novos» só em públicos; criador do servidor com acesso pleno; «pode criar canais» em papéis — conforme clarificações da manhã, excepto onde este amendment substitui UI (página vs modal) ou alarga o catálogo de capacidades.
- **FR-012**: «Gerenciar canal» MUST cobrir criar, editar e apagar canais (qualquer canal do servidor, para quem tiver a capacidade efectiva).
- **FR-013**: «Criar convites» MUST controlar quem pode gerar convites do servidor (além do criador do servidor, que MUST poder sempre ou conforme regra de owner bypass).
- **FR-014**: «Apagar mensagens» (de outros) MUST ser distinto de apagar as próprias mensagens do autor.
- **FR-015**: «Gerenciar papéis/cargos» MUST controlar criar, editar, apagar papéis e atribuir/remover membros a papéis nesse servidor.
### Key Entities

- **Página de permissões de papel**: vista full-main com secções (Geral, Texto, Voz, …), toggles das **capacidades do papel seleccionado**, acção Guardar; memória do canal de origem.
- **Capacidade (permission flag)**: booleano nomeado no papel (ex. enviar mensagens, criar convites) com descrição de produto.
- **Papel (role)**: sujeito da página; conjunto de membros + conjunto de capacidades toggleáveis.
- **Canal público | privado**, **ACL de canal**, **membership**, **visível a novos**: como na sessão da manhã; ACL de canal **não** é editada nesta página.
## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 10 aberturas da configuração de permissões, 10/10 usam a **página** no main (0/10 abrem só um modal como UI principal).
- **SC-002**: Em 10 guardados com sucesso a partir de um canal C, 10/10 regressam a C (ou à vista main correcta se C já não existir).
- **SC-003**: 100% das permissões do catálogo obrigatório (Geral + Texto + Voz mínimo + anexar + remover membros) mostram título + descrição + toggle na página.
- **SC-004**: Em canal público sem restrições, 10/10 membros de teste conseguem ver e enviar; após restrição de envio a um papel, 10/10 membros só desse papel falham ao enviar.
- **SC-005**: Conta sem «Apagar mensagens» de outros: 10/10 tentativas de apagar mensagem alheia falham; com a permissão: 10/10 sucedem.
- **SC-006**: Regressão: 0 regressões nos critérios de canal privado invisível e owner vê todos (suite de aceitação existente).

## Assumptions

- A página reutiliza o chrome Mesa (topbar/nav); só o **main** muda para a vista de permissões.
- Descrições dos toggles em **português**, tom claro, uma ou duas frases (como nos ecrãs Discord de referência).
- Owner do servidor mantém bypass / capacidade plena de configurar.
- Sair sem guardar: **descarta** alterações sem diálogo obrigatório (salvo o produto já tenha padrão de confirmação noutros sítios — então alinhar).
- Default confirmado: **públicos nunca ficam ocultos** por toggle «Visualizar»; ocultar exige **privado** + ACL.
- «Gerenciar Perfis» no pedido original = **Gerenciar papéis/cargos**.
- A página dedicada edita **só capacidades de papel**; ACL por canal fica noutro fluxo (já existente ou futuro), fora do objecto desta página.
- Anexar ficheiros e voz entram no amendment porque Mesa já tem esses fluxos; só **Remover membros** (kick) se já suportado — Ban permanente fora.
- Fora de escopo neste amendment: threads/fóruns Discord; slowmode; @everyone fino; ban + apagar histórico; directory público; redesenho total do painel de membros; editor de ACL de canal **dentro** desta página.

## Out of Scope

- Página dedicada de permissões de **canal** (ACL) como superfície principal deste amendment.
- Modal como superfície principal de edição de capacidades de papel.
- Permissões de threads/fóruns, slowmode, pin, bypass slowmode (Discord) sem produto Mesa correspondente.
- Ban permanente com purge de mensagens (salvo já existir).
- Traduzir pixel-perfect o Discord (só o padrão toggle + título + descrição + secções).
