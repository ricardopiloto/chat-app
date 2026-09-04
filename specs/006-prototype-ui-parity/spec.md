# Feature Specification: Fidelidade pixel ao Protótipo Mesa v2

**Feature Branch**: `006-prototype-ui-parity`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "… fidelidade ao protótipo v2 … continuidade de vídeo após Salvar … enquadramento cover/centrado … (clarify: E2EE off/gravar/custódia; inventário diferido em backlog). Adenda: lista vertical só com ícone do servidor ao lado da lista de canais (estilo Discord) para trocar de servidor; clique direito em canal (voz/texto) ou servidor com opção de apagar, só se o utilizador for o criador do canal/servidor."

**Fonte da verdade visual**:
- `docs/design-ref/Mesa - Protótipo v2.dc.html` — protótipo Nocturne vigente (estrutura, medidas, tipografia, estados, cópia)
- `docs/design-ref/design-prd.md` — intenções de produto/UX que o protótipo ilustra
- `docs/design-ref/_ds/` — tokens e componentes do design system Nocturne

**Contexto**: As fases 004–005 já trouxeram shell Nocturne, modo palco, layouts nomeados e limpeza de UI. Esta feature fecha o fosso entre a SPA actual e o protótipo v2 ao nível de composição, hierarquia, espaçamento, tipografia, estados e microcopy — **pixel a pixel sempre que for tecnicamente viável**. Inclui correcções de palco (**continuidade do vídeo após Salvar**, **enquadramento cover/centrado**) e o fluxo do protótipo de **Gravar cena ⇄ E2EE desligada / religar** (com backend novo se necessário). O protótipo v2 **não** inclui co-diretor nem chat de texto no ecrã de voz/vídeo — a SPA deve espelhar isso.

**Desvio consciente do protótipo/PRD (navegação)**: o PRD tinha descartado o rail de servidores; nesta feature **reintroduz-se um rail vertical só de ícones** ao lado da lista de canais (padrão tipo Discord) para troca rápida de Servidor. O resto do chrome continua alinhado ao Nocturne v2.

## Clarifications

### Session 2026-09-04

- Q: O inventário do protótipo sem produto entra na 006? → A: Fica de fora da 006 e mapeado em `docs/backlog-prototype-v2-gaps.md` — **excepto** E2EE off / gravar (ver abaixo).
- Q: Chrome parcial (badges / rodapé / roles nos tiles) na 006? → A: Aproximar só com dados reais; omitir o resto (sem texto fake).
- Q: Conflito protótipo vs decisões 005 (co-diretor, texto no voz, E2EE)? → A: Leitura corrigida: o protótipo v2 **não tem** co-diretor nem texto no canal de vídeo. **E2EE off fica dentro da 006**; criar backend se necessário.
- Q: Custódia da chave de E2EE do canal (G5) para Religar? → A: G5 na 006 — UI de custódia ao criar + religar com a chave do canal como no protótipo.
- Q: Canais de voz legados (sem chave de canal)? → A: Gravar/Religar desabilitados até recriar o canal.
- Q: Quem pode apagar um canal? → A: Dono do Servidor **ou** criador do canal; apagar Servidor só o criador/dono do Servidor.
- Q: O que “Apagar” remove? → A: Hard delete de tudo ligado ao canal/Servidor; participantes em voz são desligados.
- Q: Troca de Servidor — rail e/ou cabeçalho? → A: Só o rail; remover a troca de Servidor do cabeçalho da coluna de canais.
- Q: Apagar o último canal do Servidor? → A: Bloqueado — o Servidor deve manter ≥1 canal.
- Q: Profundidade de “Gravar cena” na 006? → A: UX + estado E2EE obrigatórios; artefacto de gravação quando o egress funciona, erro claro se não.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Shell Nocturne + rail de servidores (Priority: P1)

Uma pessoa autenticada vê a barra superior **como no protótipo v2**: marca Mesa, “instância · …”, alternador Escuro/Claro, chip do utilizador. Ao lado da coluna de canais há um **rail vertical estreito só com ícones dos Servidores** (um por Servidor de que é membro), no espírito Discord: o Servidor actual destaca-se; um clique troca o Servidor e a lista de canais. A coluna de canais mantém o **nome do Servidor actual** no cabeçalho (leitura), secções **Texto** / **Voz e vídeo**, Criar canal / Criar servidor, rodapé de procedência — **sem** controlo de troca de Servidor no cabeçalho (a troca fica **só no rail**). **Modo palco** recolhe rail + coluna de canais; em viewport estreita, rail e canais entram na gaveta sem destruir o palco.

**Why this priority**: Sem chrome navegável, o resto da comparação falha; o rail corrige a troca de Servidor que o protótipo resolvia só pelo cabeçalho.

**Independent Test**: ≥2 Servidores; clicar ícones no rail troca canais; cabeçalho mostra nome sem selector; comparar coluna com o protótipo (aceitando o rail); modo palco esconde rail+canais.

**Acceptance Scenarios**:

1. **Given** conta com pelo menos um Servidor, **When** abre a app, **Then** vê barra Nocturne + rail de ícones + coluna de canais do Servidor actual (hierarquia e densidade alinhadas ao protótipo na coluna; rail é adição documentada).
2. **Given** dois ou mais Servidores, **When** clica o ícone de outro Servidor no rail, **Then** a coluna de canais e o contexto passam a esse Servidor sem fluxo extra no cabeçalho.
2b. **Given** a coluna de canais, **When** o utilizador olha o cabeçalho, **Then** vê o nome do Servidor actual mas **MUST NOT** depender de um selector/menu de troca de Servidor nesse cabeçalho (rail é o único caminho).
3. **Given** modo Escuro ou Claro, **When** alterna, **Then** tokens do chrome (incl. rail) seguem o tema; o **palco de vídeo permanece escuro**.
4. **Given** canal de voz em chamada, **When** activa Modo palco, **Then** rail e sidebar de canais desaparecem; **When** mostra canais, **Then** ambos voltam.
5. **Given** viewport &lt;900px, **When** usa gaveta e modo palco, **Then** o palco/tiles não colapsam para ecrã vazio.
6. **Given** o protótipo mostra badges/roles/contagens mock, **When** a SPA não tem esse dado, **Then** omite o elemento (ou mostra só o que for real) — sem texto inventado.
7. **Given** Servidor sem imagem de ícone, **When** aparece no rail, **Then** usa um marcador derivado do nome (ex. iniciais) — sem exigir upload de ícone nesta feature.

---

### User Story 1b - Apagar Servidor ou canal (Priority: P1)

O **dono do Servidor** ou o **criador do canal** pode abrir um menu de contexto (clique direito no desktop; long-press no telemóvel) sobre um canal (texto ou voz) e escolher **Apagar**. Só o **criador/dono do Servidor** pode apagar o Servidor. Quem não tem permissão **não** vê a acção de apagar (ou vê-a desabilitada de forma inequívoca). Apagar é destrutivo: exige **confirmação explícita**. Após apagar o Servidor/canal actual, a app navega para um estado válido (outro Servidor/canal ou ecrã vazio). Backend MUST existir ou ser criado nesta feature se ainda não houver remoção.

**Why this priority**: Sem apagar, a navegação nova acumula Servidores/canais de teste sem saída segura.

**Independent Test**: Dono apaga canal criado por outro; criador apaga o próprio canal; membro comum não consegue; só dono apaga Servidor; API rejeita não autorizados.

**Acceptance Scenarios**:

1. **Given** o utilizador é criador do canal **ou** dono do Servidor, **When** abre o menu de contexto nesse canal e confirma Apagar, **Then** o canal deixa de existir para todos os membros e desaparece da lista.
2. **Given** o utilizador **não** é criador do canal **nem** dono do Servidor, **When** abre o menu de contexto, **Then** **MUST NOT** conseguir apagar (sem opção ou rejeição clara).
3. **Given** o utilizador é criador/dono do Servidor, **When** confirma Apagar Servidor, **Then** o Servidor e o seu conteúdo deixam de estar acessíveis aos membros; o criador deixa de o ver no rail.
4. **Given** o utilizador **não** é criador/dono do Servidor, **When** tenta apagar o Servidor, **Then** a acção falha ou não está disponível.
5. **Given** apagar o canal ou Servidor em que está, **When** a remoção conclui, **Then** a UI muda para outro destino válido sem ecrã partido.
6. **Given** menu de contexto, **When** o utilizador cancela a confirmação, **Then** nada é apagado.
7. **Given** pessoas em chamada num canal de voz, **When** esse canal (ou o Servidor) é apagado, **Then** a chamada termina para esses participantes e o recurso deixa de existir.
8. **Given** um Servidor com um único canal, **When** o utilizador autorizado tenta Apagar esse canal, **Then** a acção é **bloqueada** com mensagem clara; o canal permanece.

### User Story 2 - Canal de texto e canal de voz/vídeo fiéis (Priority: P1)

No canal de texto: cabeçalho com nome, subtítulo, chip E2EE; mensagens em grelha avatar+corpo (~74ch); composer com altura e raio do protótipo. No canal de voz/vídeo: cabeçalho (nome, cena, “N de M em cena”), alternador **Composição / Grade**, Modo palco, Editar cena (só quem pode); **palco** com tiles (dica de slot + chip nome/estado); controlos em pílula (**microfone**, **câmara**, **Gravar cena…**, sair); linha de estado de privacidade; **banco** quando aplicável. **Sem** lista/composer de texto neste ecrã (o protótipo v2 também não os tem). A composição usa a geometria dos layouts nomeados já no produto.

**Why this priority**: É o produto no dia-a-dia; o PRD trata o palco como o produto.

**Independent Test**: Comparar ecrãs de texto e vídeo do protótipo com a SPA; alternar Composição/Grade; confirmar banco e contagem; confirmar ausência de chat no ecrã de voz.

**Acceptance Scenarios**:

1. **Given** canal de texto com mensagens, **When** o abre, **Then** layout (cabeçalho, lista, composer) é reconhecível como o do protótipo em tipografia, raios e espaçamento.
2. **Given** chamada com cena activa, **When** está em Composição, **Then** o palco reflecte o layout da cena (tiles com dica + chip); **When** Grade, **Then** vê grelha automática incluindo quem está no banco.
3. **Given** participante sem slot, **When** Composição, **Then** não aparece no palco mas continua na chamada (banco / linha de estado).
4. **Given** canal de voz/vídeo, **When** qualquer participante o usa, **Then** **MUST NOT** haver chat de texto nem UI de co-diretor nesse ecrã.

---

### User Story 2b - Gravar cena e E2EE desligada (Priority: P1)

Como no protótipo v2: quem pode gravar inicia **Gravar cena…**, confirma o diálogo que explica a troca (Egress exige o servidor decodificar → E2EE desliga), e o canal passa a mostrar a **faixa persistente** “E2EE desligada — gravando…” com ponto pulsante, quem desligou, quando, referência a auditoria, e **Religar E2EE**. Enquanto E2EE estiver desligada, o estado é visível para todos no canal. Backend e modelo de dados **podem e devem** ser criados nesta feature se ainda não existirem. A UI e o estado E2EE são obrigatórios; o **ficheiro/artefacto** de gravação é produzido quando o egress da instância funciona — caso contrário erro claro sem estado de privacidade ambíguo.

Ao **criar** canal de voz/vídeo, o diálogo inclui o bloco de **custódia da chave de E2EE do canal** (mostrar chave, copiar, checkbox “Salvei a chave…”); **Criar canal** só habilita após confirmar a custódia — como no protótipo. **Religar E2EE** exige essa chave do canal (fluxo de custódia do protótipo).

**Why this priority**: É a cunha de privacidade do PRD/protótipo; sem ela a fidelidade do ecrã de voz fica incompleta de propósito.

**Independent Test**: Criar canal de voz com custódia; gravar → todos vêem faixa; religar com a chave → E2EE volta; comparar diálogo/faixa/custódia com o protótipo.

**Acceptance Scenarios**:

1. **Given** chamada com E2EE activa, **When** o diretor confirma **Gravar cena…** no diálogo do protótipo, **Then** E2EE desliga no canal, a gravação/estado de gravação reflecte-se, e **todos** os participantes vêem a faixa de aviso (não só quem gravou).
2. **Given** E2EE desligada, **When** um participante olha o canal, **Then** vê quem desligou, quando, e indicação de registo em auditoria, no espírito do protótipo.
3. **Given** E2EE desligada, **When** alguém com permissão escolhe **Religar E2EE** e fornece/usa a **chave do canal** conforme o fluxo de custódia, **Then** a faixa desaparece, E2EE volta a activa para o canal, e a UI de “gravar” volta ao estado normal.
4. **Given** E2EE activa, **When** ninguém gravou, **Then** a faixa de E2EE desligada **MUST NOT** aparecer; o chip/linha mostram E2EE activa.
5. **Given** dono a criar canal de voz/vídeo, **When** ainda não marcou “Salvei a chave…”, **Then** **Criar canal** permanece desabilitado; **When** marca e cria, **Then** a chave ficou sob custódia do criador (não no servidor em claro para repor o fluxo do protótipo).
6. **Given** canal de voz criado **antes** desta feature (sem chave de canal / custódia), **When** o dono tenta Gravar ou Religar, **Then** a acção está **desabilitada** (com explicação para recriar o canal); **MUST NOT** improvisar um caminho alternativo de chave.

### User Story 3 - Vídeo continua após o diretor guardar a cena (Priority: P1)

Hoje, quando o **diretor** (dono que edita a cena) guarda alterações, a grade/composição actualiza-se mas as **câmaras ficam travadas** — participantes são forçados a sair da chamada e voltar. Nesta feature, após Salvar (ou qualquer actualização de mapa/layout da cena activa que todos recebem), **áudio e vídeo continuam a fluir** nos slots correctos **sem** sair e reentrar.

**Why this priority**: Quebra a sessão no momento em que o mestre ajusta a mesa — pior do que chrome desalinhado.

**Independent Test**: Duas contas na mesma chamada; diretor edita layout/atribuições, Salva; ambas as contas vêem a nova composição com vídeo a correr, sem “Sair” / religar.

**Acceptance Scenarios**:

1. **Given** pelo menos duas pessoas em chamada com vídeo activo, **When** o diretor Salva uma cena activa com novo layout ou novas atribuições, **Then** todos vêem a composição actualizada **e** as imagens/áudio continuam sem interrupção que obrigue a sair e voltar.
2. **Given** uma pessoa mudou de slot no mapa guardado, **When** a actualização chega, **Then** o vídeo dessa pessoa aparece no novo slot (e deixa o antigo) sem reentrar na chamada.
3. **Given** alguém ficou só no banco após o Salvar, **When** está em Composição, **Then** deixa de ocupar tile no palco mas **permanece** na chamada com áudio; **MUST NOT** ser desligado da sala.
4. **Given** o diretor Descartar (não Salvar), **When** volta ao canal, **Then** o quadro ao vivo não muda e as câmaras dos outros **não** travam por causa do abandono do rascunho.

---

### User Story 4 - Enquadramento: câmara preenche o slot (Priority: P1)

Cada feed de câmara (próprio e remoto) **preenche todo o espaço útil do slot/tile**: a imagem escala para cobrir a área (mesmo que isso corte bordas — “zoom” de enquadramento), **centradas** no slot para privilegiar a zona onde as pessoas aparecem na câmara. Não deixar barras vazias nem imagem “letterbox” dentro do tile quando a proporção do vídeo difere da do slot. Aplica-se a Composição e a Grade.

**Why this priority**: O palco é o produto; tiles com vídeo pequeno ou desalinhado destroem a leitura da cena mesmo com chrome correcto.

**Independent Test**: Entrar em chamada com proporções de slot diferentes (ex. Mestre em destaque vs faixa); verificar que cada vídeo cobre o tile, centrado, sem faixas vazias dominantes.

**Acceptance Scenarios**:

1. **Given** um slot com proporção diferente do sensor da câmara, **When** o vídeo é mostrado, **Then** o feed cobre a área do slot (recorte nas bordas se necessário) e fica **centrado** no tile.
2. **Given** Composição e Grade, **When** o utilizador alterna entre elas, **Then** a mesma regra de preenchimento/centragem aplica-se em ambos os modos.
3. **Given** slot vazio (sem pessoa atribuída / sem vídeo), **When** se vê o tile, **Then** o placeholder do protótipo (borda/dica) mantém-se — a regra de preenchimento aplica-se só a feeds de vídeo activos.

---

### User Story 5 - Editor de cena e diálogos de criar (Priority: P2)

O editor do dono replica o protótipo: cabeçalho Descartar / Salvar cena; palco editável à esquerda; painel ~296px com **Layout da cena** (miniaturas) e **No banco** (chips arrastáveis ou toque em dois passos no estreito); tipografia e copy de apoio do protótipo. Diálogos **Criar servidor** e **Criar canal** alinham estrutura, raios e densidade ao protótipo **para os passos e campos que o produto já tem**.

**Why this priority**: Fecha a cunha visual do mestre; diálogos são a primeira impressão de “criar mesa”.

**Independent Test**: Editar cena lado a lado com o protótipo; abrir criar servidor/canal e comparar chrome.

**Acceptance Scenarios**:

1. **Given** dono no editor, **When** escolhe layout e atribui pessoas, **Then** a geometria e o painel coincidem com o protótipo (empilhado em viewport estreita se já definido nas fases anteriores).
2. **Given** rascunho sujo, **When** Descartar ou Salvar, **Then** o comportamento de produto actual (rascunho local → persistir só ao Salvar) mantém-se; só a apresentação muda se necessário — e o Salvar cumpre a US3 (sem travar câmaras).
3. **Given** criar servidor, **When** o diálogo abre, **Then** o chrome segue o protótipo; campos diferidos (ex. diretório público) omitidos.
4. **Given** criar canal de voz/vídeo, **When** o diálogo abre, **Then** inclui o bloco de custódia da chave (G5) como no protótipo; criar canal de texto não exige esse bloco.

---

### User Story 6 - Matriz de desvios e adaptações (Priority: P2)

A equipa mantém uma lista explícita do que no protótipo **não** pode ser pixel-igual (vídeo real vs placeholders, dados vivos vs mock, gestos de drag nativo vs toque, etc.) e documenta a adaptação mais próxima aceite. Capacidades de produto ausentes ficam em [`docs/backlog-prototype-v2-gaps.md`](../../docs/backlog-prototype-v2-gaps.md), sem implementação improvisada nesta feature.

**Why this priority**: Evita “quase igual” subjectivo e impede scope creep de produto sob o disfarce de UI.

**Independent Test**: Revisor preenche checklist de fidelidade (≥90% dos itens aplicáveis) e confirma que itens “sem produto” estão marcados como deferidos, não como bugs.

**Acceptance Scenarios**:

1. **Given** diferença técnica inevitável, **When** se implementa, **Then** a adaptação está documentada e é a mais próxima visualmente possível.
2. **Given** capacidade só no protótipo sem suporte de produto, **When** se revê o âmbito, **Then** não entra nesta entrega; aparece no inventário de clarificação.

---

### Edge Cases

- Protótipo usa dados mock (nomes, “5 de 6”, roles); a SPA mostra dados reais — a estrutura visual mantém-se, os textos dinâmicos adaptam-se.
- Preferência Composição/Grade e tema já persistem no dispositivo — não regressar.
- E2EE pode estar activa ou desligada (gravação); o estado MUST ser óbvio para todos no canal.
- Falha ao iniciar gravação / desligar E2EE: o utilizador vê erro claro; o canal **MUST NOT** ficar num estado ambiguo (ex. faixa “desligada” sem E2EE realmente off).
- Egress indisponível: Gravar falha com mensagem clara; não entra em modo “gravando / E2EE off” a falso.
- Canais de voz **legados** (pré-G5, sem chave de canal): **Gravar cena…** e **Religar E2EE** desabilitados até o canal ser recriado com custódia.
- Apagar o único Servidor do utilizador: após confirmação, rail/lista vazios ou estado “criar servidor” — sem crash.
- Tentativa de apagar o único canal do Servidor: bloqueada com feedback; Servidor intacto.
- Apagar canal enquanto outros estão nele: membros perdem acesso de imediato e a UI redirecciona / mostra indisponível.
- Viewport estreita: editor empilhado e alvos tocáveis ≥40px prevalecem sobre largura fixa de painel do desktop do protótipo.
- Interacções de arrastar do protótipo: no telemóvel, caminho de toque em dois passos já adoptado permanece se o drag não for fiável.
- Actualização de cena enquanto alguém está a ligar/desligar câmara: o mapa actualiza-se; feeds que existam reinserem-se nos slots sem exigir reentrada na sala.
- Proporções extremas de slot (muito alto ou muito largo): o recorte centrado pode cortar mais topo/fundo ou laterais — aceitável; o centro do frame permanece visível.
- Pessoa sem câmara (só áudio): o tile pode mostrar placeholder/avatar; a regra de preenchimento aplica-se quando há faixa de vídeo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A SPA autenticada MUST alinhar barra superior, coluna de canais, modo palco e tema claro/escuro à densidade do protótipo v2, **e** MUST apresentar um **rail vertical de ícones de Servidor** ao lado da lista de canais para troca rápida (desvio documentado do protótipo de sidebar única).
- **FR-002**: Canal de texto MUST alinhar cabeçalho, lista de mensagens e composer ao protótipo v2 (incluindo limite de largura de leitura e chip E2EE).
- **FR-003**: Canal de voz/vídeo MUST alinhar cabeçalho, alternador Composição/Grade, palco (tiles), controlos de chamada (incluindo **Gravar cena…**), linha de estado e banco ao protótipo v2; MUST NOT mostrar chat de texto nem UI de co-diretor nesse ecrã.
- **FR-004**: Editor de cena MUST alinhar cabeçalho Salvar/Descartar, palco editável, painel de layouts e banco ao protótipo v2.
- **FR-005**: Diálogos de criar servidor e criar canal MUST alinhar chrome e hierarquia ao protótipo v2 nos campos do âmbito (incl. custódia G5 em voz); campos do backlog diferido omitidos.
- **FR-006**: Onde a igualdade exacta for tecnicamente inviável, a implementação MUST adoptar a adaptação documentada mais próxima (sem inventar comportamento de produto fora do âmbito).
- **FR-007**: Capacidades ainda diferidas MUST permanecer em `docs/backlog-prototype-v2-gaps.md` e MUST NOT aparecer como UI morta; **G1/G2/G5 estão no âmbito da 006**.
- **FR-008**: Auth, convite e ecrãs já Nocturne MUST permanecer coerentes com os mesmos tokens/escala do protótipo (sem regressão de tipografia/alvos).
- **FR-009**: MUST preservar cenas, layouts nomeados, owner-only editar/activar cena, e ausência de chat/co-diretor no ecrã de voz — alinhado ao protótipo v2.
- **FR-010**: Após o diretor **Salvar** (ou qualquer propagação do mapa da cena activa / grade a todos os clientes), cada participante MUST continuar a ver e ouvir os feeds activos **sem** ser obrigado a sair da chamada e voltar; os feeds MUST reinscrever-se nos slots correctos da nova composição.
- **FR-011**: Cada feed de vídeo activo MUST preencher a área útil do seu slot/tile (cobrir o rectângulo, com recorte se a proporção diferir) e MUST ficar **centrado** no tile, em Composição e em Grade.
- **FR-012**: “Diretor” nesta feature significa quem já pode editar/guardar cena e quem o produto autorizar a gravar/desligar E2EE (por omissão o dono do Servidor); MUST NOT introduzir UI de co-diretor.
- **FR-013**: Contagens, badges de canal, estado de convite no rodapé e papéis nos chips dos tiles MUST aparecer na 006 **apenas** quando houver dados reais do produto; MUST NOT inventar valores estáticos ou mock para imitar o protótipo (G8/G9 diferidos). Copy estático de procedência já aceite (ex. “self-hosted · sem federação”) MAY permanecer.
- **FR-014**: O sistema MUST permitir desligar E2EE no canal de voz/vídeo no fluxo **Gravar cena…** (com confirmação explícita como no protótipo), MUST mostrar a faixa de E2EE desligada a todos, MUST permitir **Religar E2EE** mediante a **chave do canal**, e MUST criar/estender backend e persistência se necessário para estado, auditoria visível e gravação. UX + estado E2EE são obrigatórios; quando o egress estiver disponível MUST produzir artefacto de gravação utilizável; se o egress não estiver disponível MUST falhar com mensagem clara e MUST NOT deixar privacidade ambígua (reverter ou não entrar em “gravando” conforme o erro).
- **FR-015**: Enquanto E2EE estiver desligada, a UI MUST deixar isso inequívoco (faixa + copy); MUST NOT fingir E2EE activa.
- **FR-016**: Ao criar canal de voz/vídeo, o sistema MUST gerar/apresentar a chave de E2EE do canal, MUST exigir confirmação explícita de custódia (“Salvei a chave…”) antes de criar, e MUST NOT armazenar essa chave no servidor de forma que anule a custódia do criador (alinhado ao protótipo/PRD).
- **FR-017**: Canais de voz/vídeo existentes sem chave de canal (criados antes de G5) MUST ter **Gravar cena…** e **Religar E2EE** desabilitados até o canal ser recriado com o fluxo de custódia; MUST NOT usar o modelo de chave antigo como atalho para esses controlos.
- **FR-018**: O rail de Servidores MUST listar todos os Servidores de que o utilizador é membro; MUST destacar o actual; MUST trocar o contexto de canais ao activar outro ícone; MUST recolher-se com a coluna de canais em Modo palco; MUST ser o **único** controlo de troca de Servidor (o cabeçalho da coluna de canais MUST NOT oferecer troca de Servidor — só identificação do actual).
- **FR-019**: Clique direito (desktop) ou long-press (viewport estreita) sobre um **canal** MUST oferecer **Apagar** ao **dono do Servidor** ou ao **criador desse canal**; sobre um **Servidor** MUST oferecer **Apagar** **somente** ao **criador/dono do Servidor**; demais utilizadores MUST NOT conseguir apagar.
- **FR-020**: Apagar canal ou Servidor MUST exigir confirmação explícita, MUST **eliminar de forma permanente** o recurso e os dados dependentes (mensagens, cenas/slots, papéis, membresias desse âmbito, estado de gravação/E2EE do canal, etc.), MUST **desligar** participantes em chamada nesse canal (ou em qualquer canal do Servidor se o Servidor for apagado), e MUST deixar a UI num estado navegável se o item apagado era o actual. MUST NOT oferecer restauro nesta feature. MUST **recusar** apagar o **último canal** de um Servidor (o Servidor MUST manter pelo menos um canal); apagar o Servidor continua permitido ao dono e remove todos os canais.

### Inventário diferido (fora da 006, excepto o puxado)

Mapa canónico: [`docs/backlog-prototype-v2-gaps.md`](../../docs/backlog-prototype-v2-gaps.md).

- **No âmbito da 006**: G1/G2/G5 — Gravar + E2EE off/religar + custódia da chave do canal (+ backend).
- **Ainda diferidos**: G3, G4, G7–G9.

O protótipo v2 **não** define co-diretor nem chat no ecrã de voz; não há “lacuna” a repor aí.

### Key Entities

- **Protótipo v2 (referência)**: ecrãs shell, texto, vídeo, editor, diálogos — fonte visual.
- **Ecrã autenticado (SPA)**: superfície a alinhar.
- **Desvio documentado**: diferença inevitável + adaptação aceite (incl. rail de Servidores).
- **Criador do Servidor / canal**: dono do Servidor apaga o Servidor e qualquer canal nele; criador do canal apaga canais que criou; canal MUST ter criador persistido se ainda não existir.
- **Rail de Servidores**: lista vertical de ícones para troca de Servidor.
- **Item de clarificação / backlog**: capacidade ainda diferida (G3, G4, G7–G9).
- **Chave de E2EE do canal**: gerada na criação do canal de voz; custódia do criador; necessária para religar E2EE.
- **Estado E2EE do canal**: activa vs desligada (gravação); visível a todos.
- **Mapa da cena activa**: layout + atribuições de pessoas a slots; ao guardar, propaga-se a todos sem derrubar a chamada.
- **Feed de câmara no tile**: vídeo que deve cobrir e centrar-se no slot.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Numa revisão lado a lado (protótipo v2 vs SPA) à mesma largura, ≥90% dos itens de fidelidade **aplicáveis** passam; o rail de Servidores conta como desvio aceite (não como falha de fidelidade).
- **SC-002**: Um revisor não técnico identifica a SPA como “a mesma Mesa do protótipo” em ≤2 minutos nos ecrãs principais (aceitando o rail).
- **SC-003**: Itens ainda diferidos em `docs/backlog-prototype-v2-gaps.md` não aparecem improvisados na UI; G1/G2/G5 estão no âmbito desta feature.
- **SC-004**: Fluxos (login → texto → voz → editar/salvar cena → tema → modo palco → gravar/religar E2EE → trocar Servidor pelo rail → apagar canal/Servidor como criador) completam-se sem regressão nas capacidades já estáveis.
- **SC-005**: Em telemóvel (ou viewport estreita), modo palco e editor permanecem utilizáveis (vídeo visível; alvos tocáveis sem zoom).
- **SC-006**: Em teste com ≥2 participantes, após o diretor Salvar a cena activa **3 vezes seguidas** (mudança de layout e/ou atribuições), **0** participantes precisam de sair e voltar para recuperar vídeo; feeds visíveis nos slots correctos em ≤2 segundos após cada actualização chegar.
- **SC-007**: Em Composição e Grade, ≥95% dos tiles com vídeo activo cobrem a área do slot sem barras vazias internas dominantes; o centro do frame permanece no centro do tile (recorte simétrico nas margens quando a proporção difere).
- **SC-008**: Em teste com ≥2 participantes e egress disponível, após confirmar Gravar cena, **100%** vêem a faixa de E2EE desligada em ≤3 segundos; após Religar E2EE com a chave do canal, **0** ainda vêem essa faixa.
- **SC-015**: Com egress indisponível, iniciar Gravar falha com erro visível e **0** canais ficam com faixa “E2EE desligada” a falso.
- **SC-009**: Num fluxo de criar canal de voz, **Criar canal** permanece desabilitado até marcar custódia da chave; após criar, o criador consegue completar Religar E2EE usando essa chave após um ciclo de gravação.
- **SC-010**: Num canal de voz legado sem chave de canal, Gravar e Religar permanecem indisponíveis; após recriar o canal com custódia, o fluxo G1/G2/G5 funciona.
- **SC-011**: Com ≥2 Servidores, troca pelo rail reflecte a lista de canais correcta em ≤1 segundo após o clique.
- **SC-012**: Em teste autorizado vs não autorizado, **0** apagamentos bem-sucedidos por membros sem permissão; dono ou criador do canal apaga canal, e só o dono apaga Servidor, com confirmação em ≤3 passos de UI.
- **SC-013**: Após apagar um canal de voz com chamada activa, **100%** dos participantes dessa chamada deixam de estar ligados a esse canal em ≤5 segundos; o canal não reaparece após refresh.
- **SC-014**: Tentativas de apagar o último canal de um Servidor falham **100%** das vezes (UI + API); o canal permanece após refresh.

## Assumptions

- O cliente a alinhar é a **SPA web** do repositório (o utilizador disse “react” no sentido de UI web; a stack concreta é a já usada no projecto).
- Protótipo v2 Nocturne é a única fonte visual; v1 Modernist e wireframes não guiam esta entrega.
- Fases 004–005 são a base; 006 acrescenta fidelidade, continuidade/enquadramento, **Gravar ⇄ E2EE off**, **custódia da chave do canal** (G5), **rail de Servidores**, e **apagar** canal/Servidor (dono ou criador do canal).
- O rail é desvio consciente do protótipo/PRD (sidebar única); tokens Nocturne aplicam-se ao rail.
- O rail é o **único** mecanismo de troca de Servidor; o cabeçalho da coluna mostra o nome (sem selector de Servidor).
- Apagar canal: permitido ao **dono do Servidor** ou ao **criador do canal**. Apagar Servidor: só o **criador/dono do Servidor**. Persistência do criador do canal é obrigatória nesta feature se ainda não existir.
- Apagar = **hard delete** (sem soft-delete / restauro na 006); chamadas activas no âmbito são terminadas.
- Não é permitido apagar o **último canal** de um Servidor (≥1 canal); para remover tudo, apaga-se o Servidor.
- Contagens, badges e roles: na 006 só com dados reais; sem placeholders fake (clarificação 2026-09-04).
- Restantes lacunas (G3, G4, G7–G9) ficam em `docs/backlog-prototype-v2-gaps.md`.
- Protótipo v2 não inclui co-diretor nem texto no ecrã de voz — a SPA segue isso.
- Gravar cena (006): UX + estado E2EE obrigatórios; artefacto quando egress funciona; erro claro se não (sem privacidade ambígua).
- Canais de voz legados sem chave de canal: Gravar/Religar off até recriar (clarificação 2026-09-04).
- “Tecnicamente inviável” inclui: vídeo real vs placeholders do protótipo; gestos limitados pelo browser; dados dinâmicos vs mock; restrições de acessibilidade que obriguem alvos maiores que o mock.
- Idioma da UI permanece português, alinhado às strings do protótipo quando o produto as tiver.
- “Zoom” no enquadramento significa **escala para cobrir o slot com recorte**, não um controlo manual de zoom pelo utilizador.
- A continuidade após Salvar é obrigação do **cliente** face a actualizações de mapa já existentes; não se exige novo modelo de servidor nesta feature salvo se a clarificação/plan o pedirem.
