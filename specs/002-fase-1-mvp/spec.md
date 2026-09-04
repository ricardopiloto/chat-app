# Feature Specification: Fase 1 — MVP (cliente web)

**Feature Branch**: `002-fase-1-mvp`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "Fase 1 (MVP)"

## Clarifications

### Session 2026-09-04

- Q: Quem pode criar conta numa Instância de Hospedagem? → A: Primeira conta livre (instância vazia); depois só via convite.
- Q: O que um membro novo vê no histórico de texto? → A: O dono (quem administra o canal) escolhe no convite se o ingresso inclui o passado; o padrão é não incluir.
- Q: Mesma conta em dois dispositivos na mesma chamada? → A: Último dispositivo a publicar câmera/microfone prevalece; o outro deixa de enviar A/V; um único slot.
- Q: Onde a pessoa aparece na grade antes do dono mapear? → A: Primeiro slot vazio (ordem da grade), persistente até o dono alterar; padrão 4 slots.
- Q: Canais visíveis só para alguns membros nesta fase? → A: Não; membro do Servidor vê todos os canais. ACL por canal fica para depois.

## User Scenarios & Testing *(mandatory)*

A Fase 1 entrega o **primeiro produto usável**: um grupo pequeno (mesa de RPG ou amigos) sobe a própria instância, convida gente, conversa por texto e faz chamada de vídeo com **câmeras em posições fixas**. O cliente desta fase é o **navegador**. O aplicativo nativo de desktop fica para um port futuro (o spike mostrou que o webview de estoque no Linux desta máquina não sustenta a chamada).

O spike da Fase 0 já comprovou chamada, grade e credencial de mídia no navegador. Esta spec cobre o **produto** em volta disso: contas, servidores, canais, convites e a grade persistida — não a prova técnica descartável.

**Definição de “done”:** um operador consegue publicar a instância; duas pessoas (no mínimo) entram por convite, falam por texto num canal e se veem/ouvem num canal de vídeo com slots fixos, sem o operador da instância conseguir ler o conteúdo das mensagens nem da mídia.

### User Story 1 - Subir a instância e criar conta (Priority: P1)

Um operador coloca a Instância de Hospedagem no ar na própria máquina ou num servidor que controla. **Enquanto não existe nenhuma conta**, a primeira pessoa abre o endereço, cadastra-se (identificador e senha) e torna-se o operador inicial. **Depois disso** ninguém mais se cadastra só com o endereço: precisa de um convite. Sem conta, não há produto.

**Why this priority**: Sem instância acessível e identidade, nada mais existe.

**Independent Test**: Subir a instância, criar a primeira conta sem convite, confirmar que um segundo cadastro só pelo endereço falha, e que um convite permite a segunda conta. Entrega “há um lugar para as pessoas existirem”.

**Acceptance Scenarios**:

1. **Given** a instância ainda não está no ar, **When** o operador segue o procedimento de subida documentado, **Then** o endereço web da instância responde e o cliente carrega.
2. **Given** a instância no ar **sem nenhuma conta**, **When** uma pessoa cria uma conta com identificador ainda não usado e uma senha, **Then** a conta existe, ela entra autenticada e essa conta é o operador inicial da instância.
3. **Given** a instância **já tem pelo menos uma conta**, **When** alguém tenta cadastrar-se só com o endereço, sem convite, **Then** o cadastro é recusado e a falha é visível.
4. **Given** identificador já existente, **When** outra pessoa tenta cadastrar o mesmo identificador (no fluxo permitido de convite), **Then** o cadastro é recusado e a falha é visível.
5. **Given** credenciais corretas, **When** a pessoa entra, **Then** a sessão permanece até sair ou expirar; **When** sai, **Then** precisa autenticar de novo.

---

### User Story 2 - Criar um Servidor, canal de texto e convite (Priority: P1)

Uma pessoa autenticada cria um **Servidor** (unidade social, no sentido Discord). Dentro dele cria um canal só de texto. **Todo membro do Servidor vê todos os canais** desta fase (não há canal escondido). Gera um convite por link (expira por padrão). No convite, o dono escolhe se o recém-chegado **lê o histórico** dos canais do Servidor ou só o que for publicado depois de entrar; o padrão é **não** incluir o passado. Uma segunda pessoa aceita o convite, entra no Servidor e as duas trocam mensagens no canal. Quem não foi convidado não vê esse Servidor.

**Why this priority**: É o fluxo mínimo de comunidade. Sem convite e texto, a chamada de câmera não tem “onde” acontecer.

**Independent Test**: Conta A cria Servidor + canal de texto + convite; conta B aceita; A e B publicam mensagens visíveis uma à outra. Convite sem histórico: B não lê mensagens anteriores ao ingresso. Convite com histórico: B lê o passado daquele canal. Uma conta C sem convite não lista nem abre esse Servidor.

**Acceptance Scenarios**:

1. **Given** uma conta autenticada, **When** ela cria um Servidor com um nome, **Then** ela é dona desse Servidor e o vê na lista.
2. **Given** um Servidor, **When** o dono cria um canal de texto, **Then** membros do Servidor abrem o canal e enviam mensagens que os demais membros veem em ordem.
3. **Given** um Servidor, **When** o dono gera um convite, **Then** o link expira por padrão; o dono pode emitir um convite sem expiração; o convite indica se inclui histórico (padrão: não inclui).
4. **Given** um convite válido **e a instância já tem contas**, **When** uma pessoa sem conta o usa, **Then** cria a conta (identificador + senha) e torna-se membro do Servidor. **When** uma conta já autenticada o aceita, **Then** passa a ser membro e vê **todos** os canais desse Servidor.
5. **Given** mensagens já existentes no canal **e** um convite **sem** histórico, **When** B entra, **Then** B não vê essas mensagens; mensagens posteriores aparecem normalmente.
6. **Given** mensagens já existentes no canal **e** um convite **com** histórico, **When** B entra, **Then** B lê o passado dos canais desse Servidor (ainda protegido de ponta a ponta; a instância não o entrega em claro).
7. **Given** convite expirado, inválido ou já usado além da política do convite, **When** alguém tenta aceitar, **Then** o ingresso é recusado e a falha é visível.
8. **Given** a mesma Instância com dois Servidores, **When** um membro de um deles navega, **Then** não vê conteúdo do outro Servidor a menos que também seja membro.

---

### User Story 3 - Canal de voz/vídeo com grade de câmeras fixas (Priority: P1)

O dono cria um canal de voz/vídeo (com texto no mesmo canal). A grade nasce com **4 slots**. Dois membros entram, ligam câmera e microfone, e cada um ocupa o **primeiro slot ainda vazio** (ordem da grade, da esquerda para a direita, de cima para baixo). Essa posição **fica** na conta até o dono remapear (US4). Uma câmera por **conta**. Se a mesma conta abre um segundo dispositivo e publica, **esse** dispositivo fica no slot e o anterior para de enviar áudio/vídeo. Slots vazios continuam visíveis; o layout não compacta. Sair e voltar com a mesma identidade recoloca a pessoa no mesmo slot. A apresentação do vídeo **cabe no slot da página**; uma câmera em retrato (ex.: celular) não estica nem reorganiza a grade dos outros.

**Why this priority**: É a cunha de entrada (mesas de RPG / composição visual). Sem isso, o MVP é só mais um chat.

**Independent Test**: Dois membros no mesmo canal de vídeo, A/V nos dois sentidos, primeiro slot vazio para cada um, rejoin no mesmo lugar, grade estável com fonte retrato e paisagem. Segunda aba/dispositivo da mesma conta: só o último a publicar envia A/V.

**Acceptance Scenarios**:

1. **Given** um Servidor, **When** o dono cria um canal de voz/vídeo, **Then** os membros do Servidor entram, veem a grade e um campo de texto do canal.
2. **Given** dois membros no canal, **When** ambos publicam câmera e microfone, **Then** cada um vê e ouve o outro.
3. **Given** um canal de vídeo novo (4 slots, sem mapa do dono), **When** A publica e em seguida B publica, **Then** A ocupa o primeiro slot e B o segundo; os demais permanecem vazios no lugar.
4. **Given** um participante já com slot, **When** sai e volta, **Then** reaparece no mesmo slot (não “primeiro vazio” de novo).
5. **Given** uma câmera com proporção diferente da do slot (ex.: celular em pé), **When** o vídeo é exibido nos outros clientes, **Then** o quadro se encaixa no slot (com barras se preciso) e a grade da página não muda de tamanho nem de zoom.
6. **Given** a mesma conta já publicando num dispositivo, **When** um segundo dispositivo da mesma conta publica câmera ou microfone, **Then** o slot permanece dessa conta, o segundo dispositivo passa a ser a fonte de A/V e o primeiro deixa de enviar.

---

### User Story 4 - Dono define as posições da grade (Priority: P2)

O dono (ou quem tiver permissão de administrar o canal) escolhe quantos slots (2–4) e quem ocupa qual posição, **substituindo** o mapa automático (primeiro vazio). Membros comuns não reordenam a grade. A atribuição sobrevive a sair da chamada e a recarregar o cliente.

**Why this priority**: Distingue “grade automática” de “composição intencional”, que é o diferencial. Pode vir logo após a chamada funcionar com um mapa padrão.

**Independent Test**: Dono põe a pessoa A no slot 0 e B no slot 1; ambos saem e voltam; as posições permanecem. Tentar mover slot sem permissão não altera o layout para ninguém.

**Acceptance Scenarios**:

1. **Given** um canal de vídeo já com mapa automático, **When** o dono define o número de slots entre 2 e 4 e associa membros a slots, **Then** todos os participantes veem o mapa do dono (não o de chegada).
2. **Given** um mapa salvo, **When** os membros reconectam noutro dia, **Then** as posições continuam as mesmas até o dono alterar.
3. **Given** um membro sem permissão de administrar o canal, **When** tenta alterar slots, **Then** a alteração é recusada.

---

### User Story 5 - Proteção ponta-a-ponta ligada por padrão (Priority: P2)

Texto, voz e vídeo nesta instância saem do dispositivo já protegidos de ponta a ponta. O operador da Instância de Hospedagem, com acesso à máquina e aos dados que ela guarda, **não** consegue ler o conteúdo das mensagens nem assistir/ouvir a mídia em claro. Não há, nesta fase, um modo de “desligar a proteção para gravar no servidor”.

**Why this priority**: Premissa de confiança do produto. O spike mostrou que isso é viável no **navegador** desta máquina; o cliente nativo Linux de estoque **não** entra nesta garantia.

**Independent Test**: Dois clientes web numa conversa e numa chamada; inspeção do que a instância armazena e do que o serviço de mídia encaminha não revela o conteúdo em claro. Um terceiro cliente web (Windows ou macOS) no mesmo canal ainda é gap explícito a registrar, não bloqueia o done no Linux/web desta fase.

**Acceptance Scenarios**:

1. **Given** um canal de texto, **When** uma mensagem é enviada, **Then** o destinatário autorizado lê o texto original e um observador com acesso só à instância não obtém esse texto em claro.
2. **Given** uma chamada de vídeo no cliente web, **When** a mídia flui, **Then** os participantes se veem/ouvem e o encaminhador de mídia da instância não entrega o áudio/vídeo decodificável ao operador.
3. **Given** a Fase 1, **When** alguém procura um controle para desligar essa proteção a fim de gravar no servidor, **Then** essa opção **não existe** ainda (gravação/exportação no servidor fica para fase posterior, com sinalização explícita).

---

### Edge Cases

- Instância inacessível ou em manutenção: o cliente informa falha de conexão, sem corromper dados locais de sessão além de exigir novo login se a sessão caiu.
- Senha esquecida: nesta fase não há recuperação por e-mail; o operador inicial da instância pode redefinir ou recriar a conta por procedimento administrativo documentado.
- Tentativa de cadastro aberto após a primeira conta: recusada; o caminho é o convite.
- Pessoa sem câmera ou sem permissão de captura: entra no canal de vídeo, ocupa o slot, áudio pode existir; o slot de vídeo fica vazio no lugar, sem compactar a grade.
- Terceiro participante quando todos os slots estão ocupados: vê a grade, ouve, mas não ganha um quinto slot; a Fase 1 não amplia a grade além de 4 (nem além do N que o dono configurou).
- Dono reduz o número de slots e alguém estava num slot que deixa de existir: essa conta passa a ver/ouvir sem slot de câmera até o dono a recolocar.
- Convite aberto copiado para quem não deveria: o dono revoga o convite; links revogados deixam de funcionar.
- Convite com histórico: o recém-chegado lê o passado dos canais **desse Servidor**; um convite sem essa marca não “herda” histórico de outro convite.
- Tentativa de esconder um canal de parte dos membros: **fora desta fase**; não há UI nem regra para isso.
- Dois dispositivos da mesma conta na mesma chamada: um único slot; o **último** a publicar câmera ou microfone prevalece; o outro dispositivo permanece na chamada se quiser (texto, ver a grade) mas **não** envia A/V.
- Cliente nativo / webview de desktop Linux de estoque: **fora desta fase**; o done é no navegador.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir a um operador publicar uma Instância de Hospedagem isolada (sem federação com outras instâncias).
- **FR-002**: A **primeira** conta da instância (instância sem contas) MUST poder ser criada só com o endereço web (identificador único + senha); essa conta MUST ser o operador inicial. Depois disso, novas contas MUST exigir um convite válido; cadastro só com o endereço MUST ser recusado. Pessoas MUST autenticar-se com senha; sessões MUST poder ser encerradas pela pessoa.
- **FR-003**: Qualquer conta autenticada MUST poder criar um Servidor do qual é dona.
- **FR-004**: O dono MUST poder criar canais de dois tipos: somente texto, e voz/vídeo com texto no mesmo canal.
- **FR-005**: Membros de um Servidor MUST ver todos os canais desse Servidor e MUST NOT ver Servidores (nem canais) dos quais não são membros; isolamento entre Servidores na mesma instância é obrigatório. Nesta fase MUST NOT existir canal visível só a um subconjunto de membros.
- **FR-006**: O dono MUST emitir convites por link, com expiração padrão e opção de convite permanente; MUST poder revogar convites. Cada convite MUST indicar se o ingresso inclui o histórico dos canais **do Servidor**; o padrão MUST ser **não** incluir.
- **FR-007**: Aceitar um convite válido MUST tornar a pessoa membro do Servidor indicado; se ainda não tiver conta, MUST criar a conta nesse fluxo.
- **FR-008**: Em canal de texto (e no texto de canal de vídeo), membros do Servidor MUST enviar e receber mensagens em ordem cronológica. Quem entra **sem** histórico no convite MUST NOT ver mensagens anteriores ao ingresso. Quem entra **com** histórico MUST poder ler o passado dos canais desse Servidor; a instância MUST NOT entregar esse conteúdo em claro.
- **FR-009**: Em canal de voz/vídeo, membros do Servidor MUST entrar, publicar câmera e microfone (se o dispositivo permitir) e receber áudio/vídeo dos demais participantes. Uma conta MUST ocupar no máximo um slot; se um segundo dispositivo da mesma conta publicar, esse MUST tornar-se a fonte de A/V e o anterior MUST deixar de enviar.
- **FR-010**: A sala de vídeo MUST ter entre 2 e 4 slots (padrão ao criar o canal: **4**); cada **conta** ocupa no máximo um slot; slots vazios permanecem visíveis; o layout não compacta.
- **FR-011**: Enquanto o dono não remapear, a conta MUST ocupar o primeiro slot ainda vazio na ordem da grade (esquerda→direita, cima→baixo); esse slot MUST permanecer atrelado à identidade ao sair e reentrar.
- **FR-012**: O dono (ou quem administrar o canal) MUST poder alterar o número de slots e a ocupação por pessoa, substituindo o mapa automático; membros sem essa permissão MUST NOT alterar o mapa.
- **FR-013**: O vídeo de cada participante MUST ser apresentado dentro do slot da página receptora, sem alterar o tamanho ou o zoom da grade por causa da proporção da câmera de origem.
- **FR-014**: A credencial de acesso à sala de mídia MUST ser emitida pela instância; o cliente MUST NOT carregar o segredo de administração do encaminhador de mídia.
- **FR-015**: Texto, voz e vídeo MUST estar protegidos de ponta a ponta por padrão no cliente web; a instância MUST NOT armazenar nem encaminhar esse conteúdo em claro.
- **FR-016**: O cliente desta fase MUST ser o navegador; aplicativo nativo de desktop NÃO faz parte do done da Fase 1.
- **FR-017**: O procedimento de subida da instância MUST estar documentado o suficiente para um operador repetir (incluindo portas de sinalização e de mídia necessárias para participantes fora da máquina).

### Key Entities

- **Instância de Hospedagem**: o processo/serviço que o operador publica; isolada; pode conter vários Servidores.
- **Conta**: identidade na instância (identificador + credencial de autenticação). A primeira conta da instância é o operador inicial; as demais nascem via convite.
- **Servidor**: unidade social com dono, membros e canais; isolada das demais na mesma instância.
- **Canal**: texto ou voz/vídeo+texto; pertence a um Servidor; nesta fase visível a **todos** os membros desse Servidor (sem restrição por subconjunto).
- **Convite**: link para ingressar num **Servidor**; também é o único caminho para **criar conta** depois da primeira; tem validade, pode ser revogado, e carrega a escolha de **incluir ou não o histórico** dos canais desse Servidor (padrão: não incluir).
- **Mensagem**: conteúdo de texto de um canal, visível aos membros do Servidor e, para recém-chegados, só se o convite incluir histórico ou a mensagem for posterior ao ingresso; protegido de ponta a ponta.
- **Grade da sala**: mapa de 2–4 slots de um canal de vídeo (padrão 4); cada slot aponta para no máximo uma conta; preenchimento inicial = primeiro vazio, persistente até o dono alterar.
- **Participação na chamada**: presença de uma conta num canal de vídeo, com ou sem câmera/microfone ativos; no máximo uma fonte de A/V por conta (último dispositivo a publicar).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um operador que nunca viu o código consegue, seguindo só a documentação da Fase 1, ter a instância respondendo no navegador em menos de 30 minutos numa máquina com os pré-requisitos listados.
- **SC-002**: Duas pessoas completam o fluxo “criar contas → convite → primeira mensagem de texto” em menos de 10 minutos após a instância estar no ar.
- **SC-003**: Duas pessoas completam o fluxo “entrar no canal de vídeo → se ver e se ouvir com slots fixos” em menos de 5 minutos após já serem membros do Servidor.
- **SC-004**: Em 100% dos testes com 2 participantes, sair e reentrar recoloca cada um no mesmo slot, e a grade permanece 2×2 (ou o N configurado) com vazios visíveis.
- **SC-005**: Em teste com câmera em retrato num lado e paisagem no outro, a página do outro participante não muda de layout (mesma geometria da grade antes e depois do vídeo aparecer).
- **SC-006**: Um revisor com acesso de operador à instância, sem as chaves das pessoas, não obtém o texto das mensagens nem o áudio/vídeo em claro em inspeção documentada (arquivos da instância + tráfego do encaminhador de mídia).
- **SC-007**: Pelo menos 3 pessoas autenticadas na mesma instância, em 2 Servidores distintos, não vazam lista nem mensagens de um Servidor para membros exclusivos do outro.

## Assumptions

- O cliente da Fase 1 é **somente navegador** (o spike da Fase 0 validou chamada e grade nesse caminho). Port nativo (incluindo Linux com webview de estoque) fica para fase posterior.
- Autenticação na Fase 1 é identificador + senha na própria instância (sem provedor externo, sem recuperação por e-mail). Cadastro aberto **só** na instância vazia; depois, convite.
- Histórico de texto para quem entra depois é **opção do convite**, não um comportamento global; o default é só mensagens a partir do ingresso (menos superfície de partilha de chaves antigas).
- Qualquer conta pode criar Servidores (multi-tenancy na instância), como no brief do produto.
- Cargos além de dono do Servidor / membro / permissão de administrar canal de vídeo ficam no mínimo necessário para US4; papéis ricos estilo Discord avançado e **canais privados/restritos** ficam de fora.
- **Fora desta fase (adiado):** aplicativo nativo; cenas de câmera trocáveis; compartilhamento de tela; gravação/exportação no servidor e o desligar consciente da proteção ponta-a-ponta; diretório público de Servidores; canal de denúncia ao mantenedor; instalador gráfico guiado; federação; importador de Discord; plugins; canais visíveis só a um subconjunto de membros.
- Gravação no servidor foi citada no brief original do MVP; nesta Fase 1 fica de fora de propósito, porque exige desligar a proteção ponta-a-ponta. A cunha (grade fixa ao vivo) não depende de gravar.
- Travessia de NAT “hotspot / IP público” permanece desejável; se o operador não puder abrir portas, documenta-se como limite de ambiente, não como falha do produto, desde que a chamada funcione na mesma rede.
- A constituição do repositório ainda é o modelo não ratificado; não impõe TDD nem stack além do que esta spec e o brief já delimitam.
- O código em `spike/` é descartável e **não** é a base a copiar para o binário de produto; o MVP reimplementa no desenho de produto.

## Out of Scope

- Cliente desktop nativo e garantia de chamada nesse tipo de aplicativo.
- Federação entre Instâncias de Hospedagem.
- Mais de 4 slots, várias câmeras por pessoa, troca de “cenas” ao vivo.
- Compartilhamento de tela, bots, emojis customizados, threads, integrações.
- Gravação, streaming para plataforma externa e desligar proteção ponta-a-ponta por canal.
- Diretório público, denúncia ao mantenedor, telemetria.
- Canais privados/restritos a um subconjunto de membros do mesmo Servidor.
- Windows/macOS como requisito de done da proteção de mídia (gap conhecido; o done da US5 é no cliente web desta máquina de desenvolvimento e em outro navegador da mesma família, se disponível).
