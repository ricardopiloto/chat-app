# Feature Specification: Fase 3 — Correções de UI (palco, editor, escala)

**Feature Branch**: `005-fase3-ui-corrections`

**Created**: 2026-09-04

**Status**: Draft

**Input**: User description: "SPEC 004, fase 3. Algumas correções. Remova a função de co-diretor por hora, vamos implementar ela futuramente, remova a opção de texto em canais de vídeo também. Modo Palco no celular, a tela fica vazia, a camera e o audio funcionam mas eu não vejo nada. O design não está de acordo com o protótipo, a edição de cena não está respeitando a proposta do design, não consigo alterar como o grid está disposto, nem os padrões criados no protótipo foram criados aqui, e como diretor eu não tenho como decidir aonde cada usuário será exibido. O tamanho das fontes e botões estão muito pequenos."

**Referências de design (fonte da verdade visual)**:
- `docs/design-ref/design-prd.md`
- `docs/design-ref/Mesa - Protótipo v2.dc.html` (layouts nomeados: Mestre em destaque, Painel 2×2, Faixa 5-up; editor com banco + arrastar para slots)
- `docs/design-ref/_ds/nocturne-*/` — tipografia e alvos de toque do DS
- Spec anterior: `specs/004-fase-3-design/` (redesign Nocturne) — esta feature **corrige e completa** o que ficou aquém

## Clarifications

### Session 2026-09-04

- Q: Como persistir layouts nomeados (Mestre / 2×2 / Faixa 5-up) face à grelha 2–4 uniforme? → A: Guardar no servidor o layout nomeado (`mestre` / `quad` / `faixa`) + atribuições; permitir até 5 slots com a geometria do catálogo do protótipo.
- Q: Quem aparece no banco do editor? → A: Só contas já na chamada (room).
- Q: Quem pode activar cenas sem UI de co-diretor? → A: Só o dono do Servidor activa e edita cenas nesta UI; a API deve recusar activação a não-donos nesta fase.
- Q: Editor de cena em ecrã estreito? → A: Ecrã completo empilhado — palco em cima, layouts e banco abaixo (scroll vertical).
- Q: Atribuir pessoa a slot no telemóvel? → A: Toque em dois passos (banco → slot; slot ocupado devolve ao banco); arrastar opcional no desktop.

## User Scenarios & Testing *(mandatory)*

A Fase 3 (004) entregou a shell Nocturne e fluxos básicos, mas o operador reportou: (1) **Modo palco no telemóvel** deixa o palco visualmente vazio apesar da mídia funcionar; (2) o **editor de cena** não segue o protótipo — faltam os padrões de disposição (não só “2/3/4 slots iguais”), e o diretor não consegue decidir **onde** cada pessoa aparece; (3) **tipografia e botões** estão demasiado pequenos face ao protótipo; (4) **co-diretor** e **chat de texto dentro do canal de vídeo** devem sair da UI por agora (voltar noutro momento).

**Definição de “done”:** no telemóvel, modo palco mostra tiles com vídeo; o diretor edita uma cena com os layouts do protótipo, arrasta pessoas do banco para slots e Salva; a UI lê-se confortável (tipo/botões alinhados ao v2); sem painel de co-diretor e sem composer de texto no canal de voz/vídeo.

### User Story 1 - Modo palco no telemóvel mostra o vídeo (Priority: P1)

Num telemóvel (ou viewport estreita), uma pessoa em chamada activa **Modo palco**. A sidebar/gaveta fecha e o **palco continua a ocupar a área principal** com os tiles da composição (ou grade), vídeo e chips visíveis — não um ecrã em branco. Áudio e câmara já ligados continuam ligados.

**Why this priority**: Sem ver a composição no telemóvel, o produto falha no cenário de jogo real (mesa híbrida).

**Independent Test**: Duas contas; uma no telemóvel; ligar câmara; activar Modo palco; confirmar tiles/vídeo visíveis; desactivar modo palco e confirmar que a gaveta pode voltar sem perder a chamada.

**Acceptance Scenarios**:

1. **Given** chamada activa em viewport estreita com vídeo a fluir, **When** activa Modo palco, **Then** o ecrã principal mostra o palco com pelo menos o próprio vídeo (e os slots/participantes esperados na vista actual) — **MUST NOT** ficar só chrome vazio.
2. **Given** Modo palco activo no telemóvel, **When** troca Composição ↔ Grade (se disponível), **Then** o conteúdo do palco continua visível e reage à troca.
3. **Given** Modo palco activo, **When** escolhe “Mostrar canais” / sai do modo palco, **Then** a navegação de canais volta a estar acessível e a chamada não termina só por essa acção.

---

### User Story 2 - Editor de cena fiel ao protótipo (layouts + quem vai aonde) (Priority: P1)

O **dono do Servidor** (diretor da mesa) abre **Editar cena** e vê o padrão do protótipo v2: palco escuro com slots na **geometria do layout escolhido**; painel (ou secção) com **layouts nomeados** — **Mestre em destaque**, **Painel 2×2** e **Faixa 5-up** — com miniaturas; secção **No banco** com pessoas **já na chamada**. Atribuição por arrastar (desktop) ou **dois toques** (telemóvel). **Salvar** persiste layout nomeado + atribuições; **Descartar** abandona o rascunho. Quem não é dono não edita nem activa.

**Why this priority**: É a cunha do produto (composição intencional); a entrega 004 ficou aquém e o diretor não consegue dirigir o quadro.

**Independent Test**: Dono escolhe “Mestre em destaque”, coloca a si no slot grande e outros nos pequenos, Salva, activa a cena; segundo participante vê a mesma disposição em Composição. Descartar após arrastar não altera o mapa guardado. Em viewport estreita, o editor empilha palco / layouts / banco e continua utilizável.

**Acceptance Scenarios**:

1. **Given** dono no canal de voz/vídeo, **When** abre o editor, **Then** vê palco + painel de layouts nomeados + banco no espírito do protótipo v2 (não apenas um select de “2/3/4 slots” em grelha uniforme).
2. **Given** editor aberto, **When** escolhe outro layout nomeado (ex. Painel 2×2 → Mestre em destaque), **Then** a geometria dos slots no palco muda de imediato no rascunho (ainda sem Salvar) e o identificador do layout fica no rascunho a persistir no Salvar.
3. **Given** pessoas na chamada ainda sem slot (banco), **When** o diretor atribui uma pessoa a um slot e Salva (cena activa), **Then** todos os clientes em Composição mostram essa pessoa nesse lugar.
4. **Given** rascunho dirty, **When** Descartar (ou confirmação ao sair), **Then** o mapa no servidor permanece o último Salvar.
6. **Given** viewport estreita, **When** o dono abre Editar cena, **Then** vê layout empilhado (palco acima; layouts nomeados e banco abaixo, com scroll vertical) — não o painel de 296px lado a lado do desktop.
7. **Given** editor no telemóvel com alguém no banco, **When** toca na pessoa e depois num slot vazio, **Then** a pessoa fica nesse slot no rascunho; **When** toca num slot ocupado, **Then** a pessoa volta ao banco.

---

### User Story 3 - Tipografia e controlos à escala do protótipo (Priority: P1)

Em toda a SPA autenticada (e auth se necessário para consistência), o texto corrido, rótulos e **botões/pílulas** ficam **visualmente próximos** do protótipo v2 e do Nocturne: alvos de toque confortáveis (controlos de chamada e acções principais no mínimo na ordem de ~40px de altura como no protótipo), hierarquia legível na barra, sidebar e cabeçalhos de canal — sem “UI de miniatura” difícil de ler no telemóvel.

**Why this priority**: Escala incorrecta faz o redesign parecer outro produto e prejudica uso táctil.

**Independent Test**: Comparar lado a lado barra, sidebar, botões de chamada e editor com o HTML do protótipo; num telemóvel, confirmar que botões principais se tocam sem zoom.

**Acceptance Scenarios**:

1. **Given** a app e o protótipo v2 lado a lado no mesmo dispositivo, **When** um revisor compara chrome e controlos principais, **Then** tamanhos de tipo e botões não parecem “uma geração mais pequenos” (diferença grosseira de escala corrigida).
2. **Given** viewport estreita, **When** usa controlos de microfone/câmara/sair e acções Criar canal / Editar cena, **Then** os alvos são utilizáveis com o dedo sem precisar de zoom do browser.

---

### User Story 4 - Remover co-diretor e texto no canal de vídeo (por agora) (Priority: P2)

A UI **não oferece** gestão nem menção de **co-diretor**. No canal de **voz/vídeo**, **não há** lista/composer de mensagens de texto do canal (o chat de texto continua só nos canais de texto). Capacidades de servidor/API de co-diretor e mensagens no canal de voz podem permanecer no backend para não partir regressões, mas **não** estão expostas nesta UI até uma feature futura.

**Why this priority**: Reduz ruído e alinha o ecrã de voz ao protótipo (palco + controlos, sem thread de texto embutida); co-diretor adiado explicitamente pelo produto.

**Independent Test**: Abrir canal de vídeo como dono — sem painel “Co-diretores”; sem caixa de mensagem no fundo do palco. Abrir canal de texto — chat continua a funcionar.

**Acceptance Scenarios**:

1. **Given** dono no canal de voz/vídeo, **When** inspecciona a UI, **Then** não existe painel, lista ou acção de nomear/gerir co-diretores.
2. **Given** qualquer conta no canal de voz/vídeo, **When** usa o ecrã da chamada, **Then** não há composer nem histórico de mensagens de texto desse canal nesse ecrã.
3. **Given** canal de texto, **When** abre o canal, **Then** leitura e envio de mensagens continuam disponíveis como antes.
4. **Given** um não-dono (mesmo com papel co-diretor antigo nos dados), **When** tenta activar uma cena, **Then** a operação é recusada; só o dono activa.

---

### Edge Cases

- Modo palco no telemóvel com 0 slots ocupados: continua a mostrar o palco (slots vazios / estado vazio legível), não um contentor com altura zero.
- Mudança de layout no editor com mais pessoas atribuídas do que slots do novo layout: o excesso volta ao banco no rascunho; Salvar só depois da validação coerente.
- Telemóvel em rotação / teclado virtual: o palco em modo palco mantém área útil mínima para pelo menos um tile; no editor estreito, o empilhamento mantém Salvar/Descartar acessíveis.
- Utilizador só no banco: em Composição não ocupa slot; em Grade (se activa) continua a aparecer na grelha local.
- Dono sem ninguém na chamada: o banco do editor fica vazio até alguém entrar na room; o diretor pode ainda escolher o layout nomeado e Salvar a geometria/slots vazios.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Em viewport estreita, Modo palco MUST manter o palco (área de vídeo/tiles) visível e com altura útil; MUST NOT colapsar o conteúdo principal para vazio enquanto a chamada está activa.
- **FR-002**: O editor de cena MUST oferecer os layouts nomeados do protótipo v2 (Mestre em destaque, Painel 2×2, Faixa 5-up) com geometria distinta (não só contagem 2–4 em grelha uniforme).
- **FR-002a**: Cada cena (e a grade activa dela) MUST persistir no Servidor o **identificador do layout nomeado** (`mestre` | `quad` | `faixa`) além das atribuições slot↔conta; o sistema MUST aceitar até **5** slots quando o layout o exigir, com geometria definida pelo catálogo (não inferida só pela contagem).
- **FR-003**: O diretor (dono) MUST poder atribuir cada conta a um slot concreto do layout e devolver ao banco. Em telemóvel / toque, MUST haver fluxo de **dois toques** (seleccionar no banco → tocar no slot; tocar slot ocupado devolve ao banco). Arrastar pode existir no desktop como atalho, mas NÃO é o único método.
- **FR-003a**: No editor, o banco MUST listar **apenas** contas já presentes na chamada (room); MUST NOT listar todos os membros do Servidor só por serem membros.
- **FR-003b**: Em viewport estreita, o editor MUST usar disposição **empilhada** (palco → layouts → banco, scroll vertical), não o split desktop obrigatório.
- **FR-004**: Salvar / Descartar do rascunho de cena MUST continuar a comportar-se como na Fase 3 (persistir só ao Salvar; activa = efeito ao vivo).
- **FR-005**: Tipografia e botões principais MUST ser reescalados para aproximar o protótipo Nocturne v2 e alvos de toque confortáveis em telemóvel.
- **FR-006**: A UI MUST NOT expor funcionalidade de co-diretor nesta entrega.
- **FR-006a**: Activar cena e editar mapa MUST ser exclusivos do **dono do Servidor** nesta fase; o sistema MUST recusar activação (e edição de mapa) a não-donos, mesmo que existam papéis co-diretor antigos nos dados.
- **FR-007**: A UI do canal de voz/vídeo MUST NOT incluir chat de texto (lista + composer) nesse ecrã; canais de tipo texto mantêm o chat.
- **FR-008**: Comparação visual do editor e do palco MUST usar `docs/design-ref/Mesa - Protótipo v2.dc.html` como referência humana de disposição e chrome.
- **FR-009**: Remover co-diretor da UI MUST NOT impedir o dono de activar cenas e editar o mapa.

### Key Entities

- **Layout de cena (padrão nomeado)**: Identidade persistida (`mestre` | `quad` | `faixa`) com geometria fixa do catálogo (colunas/linhas/células) e número de slots (até 5).
- **Atribuição slot ↔ conta**: Quem aparece em cada posição do layout na cena; guardada com o layout nomeado no Servidor.
- **Banco**: Contas **já na chamada** sem slot na composição actual/rascunho (não o catálogo completo de membros do Servidor).
- **Modo palco (estado de shell)**: Sidebar/gaveta recolhida; área principal dedicada ao palco.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Num telemóvel real ou emulador estreito, um revisor em chamada com Modo palco vê vídeo/tiles em **menos de 30 segundos** após activar o modo (sem ecrã em branco).
- **SC-002**: Um diretor consegue, em **menos de 3 minutos**, escolher um layout nomeado do protótipo, colocar pelo menos duas pessoas em slots distintos, Salvar e verificar a disposição noutro cliente em Composição.
- **SC-003**: Checklist de fidelidade do editor + escala (layouts nomeados, banco/arrastar, tipografia/botões, palco no telemóvel) ≥ **90%** dos itens aplicáveis face ao protótipo v2.
- **SC-004**: 100% das sessões de revisão desta feature confirmam ausência de UI de co-diretor e ausência de chat de texto no ecrã de voz/vídeo.
- **SC-005**: Canais de texto continuam a permitir enviar e ler mensagens sem regressão perceptível para o operador.

## Assumptions

- Co-diretor volta numa feature futura; endpoints/dados de papel podem permanecer no servidor sem efeito de activação nesta entrega, desde que a UI não os ofereça.
- Mensagens já existentes num canal de voz (se a API permitir) não precisam de migrar; apenas deixam de ser mostradas/enviadas neste ecrã.
- “Diretor” = dono do Servidor para edição de mapa/cenas e activação; papéis co-diretor existentes nos dados ficam inertes nesta fase (sem UI e sem efeito de activação).
- Os três layouts do protótipo são o conjunto mínimo obrigatório; variantes adicionais do PRD ficam fora se não estiverem no v2.
- Preferência Composição/Grade, tema e E2EE-sempre-on da 004 mantêm-se; gravação / E2EE-off continuam fora de âmbito.
- Cenas/grades já existentes sem layout nomeado MUST receber um default estável na migração/leitura (ex. `quad` se 4 slots, ou mapeamento documentado no plano) para não partir instâncias em produção.
- Atribuição de pessoas a slots no editor exige presença na room; preparar geometria (layout + slots vazios) sem ninguém na chamada continua permitido.

## Out of Scope

- Reimplementar co-diretor (activação partilhada, painel de papéis).
- Chat de texto embutido de novo no canal de voz/vídeo.
- Novos fluxos de gravação, diretório público, ou rail de Servidores.
- Redesenhar auth do zero (só escala tipográfica se necessário para consistência).
