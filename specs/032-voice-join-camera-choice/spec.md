# Feature Specification: Escolher câmera ao entrar na sala (ou ir para o banco)

**Feature Branch**: `032-voice-join-camera-choice`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Uma melhoria, vamos deixar o usuário escolher se ele entra na sala com camera ligada ou não. Se ele decidir ir sem camera ligada, por default ele vai para o banco."

**Depends on**: canais de voz/vídeo (entrar na mesa, grade/slots, **banco**); controlos de câmera/microfone existentes; ocupação ([028](../028-voice-call-roster/)). Relacionado a falhas de join ([031](../031-voice-join-errors/)) — se ambas forem implementadas, a escolha aplica-se ao caminho de join bem-sucedido.

## Clarifications

### Session 2026-09-06

- Q: Como apresentar a escolha com/sem câmera? → A: Dois botões/acções distintos no pré-join (com câmera vs sem câmera / banco)
- Q: Depois de entrar sem câmera, ao ligar a câmera na mesa? → A: Auto-slot só se houver slot livre e a cena estiver em modo de atribuição automática; senão banco

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Escolher entrar com ou sem câmera (Priority: P1)

Como membro que se junta a um canal de voz/vídeo, quero **escolher se entro com a câmera ligada ou desligada**, para não ser forçado a ligar vídeo quando só quero estar na mesa (ex. só a ouvir ou só com microfone).

**Why this priority**: Pedido principal da melhoria; hoje o caminho de join empurra «ligar câmera e microfone» como acção principal.

**Independent Test**: Antes ou no momento de juntar-se, escolher «com câmera» vs «sem câmera»; após join bem-sucedido, o estado da câmera reflecte a escolha.

**Acceptance Scenarios**:

1. **Given** estou fora da chamada, **When** inicio o join e escolho **entrar com câmera ligada**, **Then** entro na chamada com a câmera activa (sujeito a permissões do browser) e o estado local mostra câmera ligada.
2. **Given** estou fora da chamada, **When** inicio o join e escolho **entrar sem câmera**, **Then** entro na chamada **sem** activar a câmera (câmera desligada).
3. **Given** escolhi entrar com ou sem câmera, **When** o join conclui, **Then** continuo a poder ligar/desligar a câmera depois com os controlos actuais da mesa (a escolha só define o estado **inicial**).
4. **Given** entrei sem câmera (no banco) e a cena está em atribuição automática com slot livre, **When** ligo a câmera, **Then** posso ser colocado nesse slot automaticamente.
5. **Given** entrei sem câmera e **não** há auto-atribuição aplicável (modo owner / sem slot livre), **When** ligo a câmera, **Then** permaneço no banco até mover/atribuir.

---

### User Story 2 - Sem câmera → banco por omissão (Priority: P1)

Como utilizador que entra **sem câmera**, quero ir **por omissão para o banco** (área «No banco»), e **não** ocupar automaticamente um slot da grade/palco, para a composição da cena não me colocar no palco sem vídeo.

**Why this priority**: Segunda metade explícita do pedido; define o destino espacial quando se entra sem câmera.

**Independent Test**: Entrar sem câmera → aparecer no banco; não ocupar um slot de câmera da grade até (se aplicável) alguém/eu me mover para um slot ou ligar câmera e o produto atribuir slot.

**Acceptance Scenarios**:

1. **Given** escolho entrar **sem câmera**, **When** o join sucede, **Then** fico **no banco** por omissão (não num slot da grade).
2. **Given** entrei sem câmera e estou no banco, **When** outros membros vêem a mesa, **Then** não ocupo indevidamente um slot de câmera só por ter entrado.
3. **Given** entrei **com câmera ligada**, **When** o join sucede, **Then** o comportamento de colocação na grade/slots segue o padrão actual de atribuição de slot (não sou obrigado a ir para o banco).

---

### User Story 3 - Descoberta da escolha no fluxo de entrada (Priority: P2)

Como utilizador, quero que a escolha com/sem câmera seja **óbvia no fluxo de entrar** na sala (não escondida só em definições avançadas), para decidir antes de ficar «ligado».

**Why this priority**: Sem UI clara, a opção não existe na prática.

**Independent Test**: No ecrã/pré-join da mesa, há **duas acções distintas** («com câmera» e «sem câmera» / banco); ambas iniciam o join.

**Acceptance Scenarios**:

1. **Given** abro um canal de voz/vídeo em que ainda não estou na chamada, **When** vejo as acções de entrada, **Then** vejo **dois controlos/botões distintos** para entrar **com câmera** e entrar **sem câmera** (rótulos inequívocos).
2. **Given** escolho uma das opções, **When** o browser pede permissões, **Then** o pedido de câmera só é necessário no caminho «com câmera» (no caminho sem câmera, não se exige activar vídeo para completar o join).

---

### Edge Cases

- Permissão de câmera negada no caminho «com câmera»: tratar como falha de média desse caminho (alinhar a [031](../031-voice-join-errors/) se implementado); não fingir câmera ligada nem slot com vídeo.
- Entrar sem câmera mas com microfone: permitido; microfone segue o default actual do produto no join (ligado, salvo se o utilizador já o tiver desligado antes — se a UI pré-join não expuser mic, assume-se mic ligado por omissão).
- Entrar sem câmera e depois ligar a câmera na mesa: MUST ser possível. Se a cena estiver em **atribuição automática** e existir **slot livre**, MUST atribuir automaticamente esse slot ao ligar a câmera; caso contrário MUST **permanecer no banco** até mover/atribuir manualmente (dono ou utilizador). Esta feature não redefine o editor de composição.
- Sala cheia de slots: entrar sem câmera → banco continua válido; entrar com câmera quando não há slot livre → comportamento actual de «sem slot / banco» se já existir; não inventar overflow novo.
- Mudar de canal de voz (move): nova escolha de câmera no join ao destino, ou reutilizar a última intenção — **default**: apresentar de novo a escolha (ou o mesmo par de acções) ao juntar-se ao novo canal.
- Fora de âmbito: lembrar preferência global entre sessões (opcional futuro); forçar todos no banco; mudar regras de quem aparece na lista aninhada 028; redesenhar o editor de composição.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Antes de completar o join à sala de voz/vídeo, o utilizador MUST poder **escolher** entrar **com câmera ligada** ou **sem câmera**.
- **FR-002**: Se o utilizador escolhe **com câmera**, o join MUST tentar activar a câmera como parte do estado inicial (sujeito a permissões do dispositivo).
- **FR-003**: Se o utilizador escolhe **sem câmera**, o join MUST concluir **sem** activar a câmera; o estado inicial da câmera MUST ser desligada.
- **FR-004**: Se o utilizador escolhe **sem câmera**, após join bem-sucedido MUST ficar **no banco** por omissão (não atribuído automaticamente a um slot da grade).
- **FR-005**: Se o utilizador escolhe **com câmera** e o join sucede com vídeo, a colocação na grade MUST seguir o comportamento actual de atribuição de slot (não forçar banco).
- **FR-006**: A UI de entrada MUST apresentar **duas acções/botões distintos** no pré-join (entrar **com câmera** vs entrar **sem câmera** / banco) — não um único botão ambíguo «ligar câmera e microfone».
- **FR-007**: No caminho **sem câmera**, o sistema MUST NOT exigir permissão/activação de câmera para considerar o join bem-sucedido.
- **FR-008**: Após entrar (com ou sem câmera), o utilizador MUST poder alterar câmera/microfone e posição banco↔slot com os fluxos já existentes da mesa.
- **FR-009**: Esta feature MUST NOT remover a capacidade de estar na chamada só a ouvir / no banco; clarifica o caminho de entrada para esse estado.
- **FR-010**: Se o utilizador entrou **sem câmera** e depois **liga a câmera**, o sistema MUST atribuir automaticamente um slot **somente** quando (1) existe slot livre **e** (2) a cena está em modo de **atribuição automática**; caso contrário MUST permanecer no banco até atribuição/movimento manual.

### Key Entities

- **Join camera choice**: Decisão do utilizador no join — câmera on vs off.
- **Banco**: Área da mesa para participantes **fora** dos slots de câmera da grade («No banco»).
- **Grade / slot**: Posições de câmera no palco/composição; ocupadas tipicamente por quem transmite vídeo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um utilizador consegue escolher entrar sem câmera e completar o join em ≤1 minuto no caminho feliz, ficando no banco com câmera desligada.
- **SC-002**: Um utilizador consegue escolher entrar com câmera e completar o join no caminho feliz com câmera ligada e colocação na grade conforme o padrão actual (quando há slot).
- **SC-003**: Em teste com observador, quem entrou sem câmera **não** aparece num slot de câmera só por ter entrado (está no banco).
- **SC-004**: No caminho sem câmera, o join completa **sem** diálogo obrigatório de permissão de câmera (pode ainda pedir microfone se o áudio estiver ligado).
- **SC-005**: Após entrar sem câmera, ligar a câmera pelos controlos da mesa continua possível numa tentativa (sem refresh da app).
- **SC-006**: Com atribuição automática + slot livre, ligar a câmera após entrada sem câmera resulta em ocupação de um slot; sem essas condições, o utilizador permanece observavelmente no banco.

## Assumptions

- «Banco» = a área **No banco** já existente na UI de voz/vídeo (`CallBank` / participantes fora dos slots), não um novo conceito social.
- A escolha no pré-join é apresentada como **dois botões/acções** (com câmera vs sem câmera / banco), não como toggle num único «Entrar».
- A escolha é **por tentativa de join**, não uma preferência de conta persistente (salvo se o implement reutilizar um toggle local da sessão — não obrigatório).
- Ao ligar a câmera depois de entrada no banco: auto-slot **só** com atribuição automática + slot livre; senão permanece no banco.
- Microfone: default actual do produto no join (tipicamente ligado); esta feature não exige um segundo par «com/sem mic», só câmera + destino banco.
- Entrar com câmera continua a pedir permissões de vídeo; entrar sem câmera pede só o necessário para áudio (se mic on).
- Compatível com 031: falha no caminho «com câmera» não deve deixar o utilizador «conectado» falso; o caminho «sem câmera» reduz dependência de hardware de vídeo.
