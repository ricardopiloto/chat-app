# Feature Specification: Zoom de imagens no chat

**Feature Branch**: `079-chat-image-zoom`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Vamos adicionar zoom para as imagens que são colocadas no chat, a ideia é ver as imagens o tamanho original quando clicar nelas, mesmo comportamento do teams/discord/slack"

## Clarifications

### Session 2026-09-08

- Q: Após abrir (fit no ecrã se grande), o utilizador pode zoom/pan adicional neste release? → A: Sim — fit ao abrir **mais** zoom in/out e pan (ou equivalente) neste release
- Q: Navegação entre várias imagens da mesma mensagem neste release? → A: **Must** incluir prev/next entre imagens da mesma mensagem neste release
- Q: Nos extremos da galeria da mensagem? → A: **Parar** no primeiro/último (controlo desactivado ou no-op; sem wrap)
- Q: Ao mudar de imagem na galeria, o nível de zoom? → A: **Reset** para a vista encaixada (fit) sempre que a imagem mostrada muda
- Q: Controlo de download/guardar no overlay neste release? → A: **Incluir** controlo explícito de download/guardar no visualizador

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir imagem em tamanho completo ao clicar (Priority: P1)

Como leitor de um canal de texto, quero **clicar numa imagem enviada no chat** e vê-la num visualizador em destaque (overlay), em tamanho grande / resolução completa (não o thumbnail pequeno da mensagem), como no Teams, Discord ou Slack.

**Why this priority**: Pedido principal — inspeccionar detalhes da imagem anexada.

**Independent Test**: Enviar ou abrir um canal com pelo menos uma imagem anexada; clicar na miniatura; confirmar overlay com a imagem a ocupar o espaço útil (resolução completa, limitada ao ecrã se necessário).

**Acceptance Scenarios**:

1. **Given** uma mensagem com uma imagem anexada visível no histórico, **When** clico na imagem, **Then** abre um visualizador sobre o chat mostrando essa imagem em tamanho grande (asset completo, não o thumbnail encolhido da linha).
2. **Given** o visualizador aberto, **When** a imagem é maior que o ecrã, **Then** a imagem é apresentada de forma legível (encaixa no ecrã sem cortar conteúdo essencial, mantendo nitidez do ficheiro original — não uma versão pixelada do thumb).
3. **Given** o visualizador aberto com uma imagem menor que o ecrã, **When** olho para a apresentação, **Then** a imagem aparece no seu tamanho natural (ou centrada sem ser artificialmente esticada para preencher o ecrã).
4. **Given** o visualizador aberto, **When** faço zoom in (e pan se a imagem ultrapassar a área útil), **Then** consigo inspeccionar detalhe até à resolução do ficheiro; **When** faço zoom out (ou reset), **Then** volto a uma vista encaixada / legível sem fechar o visualizador.

---

### User Story 2 - Fechar o visualizador de forma familiar (Priority: P1)

Como leitor, quero **sair do visualizador** com gestos habituais (fundo, tecla Escape, controlo de fecho), para voltar ao chat sem fricção.

**Why this priority**: Sem fecho claro, o overlay bloqueia o uso do chat.

**Independent Test**: Abrir o visualizador e fechar por cada método suportado; o chat fica utilizável de novo.

**Acceptance Scenarios**:

1. **Given** o visualizador aberto, **When** pressiono Escape, **Then** o visualizador fecha e o foco regressa ao contexto do chat.
2. **Given** o visualizador aberto, **When** clico no fundo escurecido (fora da imagem) ou num controlo explícito de fechar, **Then** o visualizador fecha.
3. **Given** o visualizador fechado, **When** continuo a usar o canal, **Then** o histórico e o compositor comportam-se como antes (sem overlay residual).

---

### User Story 3 - Várias imagens na mesma mensagem (Priority: P1)

Como leitor, quando uma mensagem tem **mais do que uma imagem**, quero poder passar à seguinte / anterior no visualizador sem voltar ao chat e clicar de novo, no espírito Discord/Slack.

**Why this priority**: Parte do comportamento esperado tipo Discord/Slack neste release (clarificado).

**Independent Test**: Mensagem com ≥2 imagens; abrir uma; navegar para a outra no overlay; fechar.

**Acceptance Scenarios**:

1. **Given** uma mensagem com várias imagens e o visualizador aberto numa delas, **When** uso o controlo «seguinte» / «anterior» (ou equivalente de teclado), **Then** vejo a imagem vizinha **dessa mensagem**.
2. **Given** estou na primeira imagem do conjunto, **When** tento ir à anterior, **Then** nada muda (controlo desactivado ou no-op); **Given** estou na última, **When** tento ir à seguinte, **Then** o mesmo — **sem** circular para o outro extremo.
3. **Given** o visualizador com zoom activo numa imagem, **When** avanço ou recuo para outra imagem da mensagem, **Then** a nova imagem abre na vista encaixada por omissão (zoom/pan resetados).

---

### User Story 4 - Guardar a imagem a partir do visualizador (Priority: P1)

Como leitor, quero um **controlo explícito de download/guardar** no visualizador para salvar a imagem que estou a ver (comportamento familiar tipo Discord).

**Why this priority**: Clarificado como parte deste release.

**Independent Test**: Abrir overlay numa imagem válida; activar download; confirmar que o ficheiro (ou o fluxo de guardar do browser) fica disponível ao utilizador.

**Acceptance Scenarios**:

1. **Given** o visualizador aberto com uma imagem carregada, **When** activo o controlo de download/guardar, **Then** o produto inicia a gravação / descarga da imagem actual (ou o equivalente suportado pelo browser).
2. **Given** a imagem ainda a carregar ou em erro, **When** o download não é possível, **Then** o controlo está desactivado ou comunica a falha sem fechar o overlay de forma inesperada.

---

### Edge Cases

- Imagem ainda a carregar ou falha de carregamento: o visualizador mostra estado de erro ou loading; o utilizador pode fechar.
- Imagem muito larga ou alta: não força scroll horizontal do chat ao abrir; o overlay gere o encaixe e o zoom/pan.
- Teclado / acessibilidade: o visualizador é utilizável com teclado (pelo menos Escape para fechar); a imagem no chat indica que é activável (ex. cursor / papel de botão).
- Fora de âmbito: avatares, logótipos de servidor, previews de links e UI chrome não entram neste zoom (só imagens **colocadas no chat** como anexos de mensagem).
- Canal E2EE: o mesmo fluxo aplica-se às imagens que o cliente já consegue mostrar no histórico (não se inventa um novo pipeline de descarga só para o zoom).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O produto MUST permitir abrir um visualizador em overlay ao activar (clique / activação equivalente) uma **imagem anexada a uma mensagem** no histórico do canal de texto.
- **FR-002**: O visualizador MUST mostrar a imagem a partir do **ficheiro / URL completo** disponível ao cliente (resolução original ou a melhor versão disponível), não apenas a miniatura encolhida da linha da mensagem.
- **FR-003**: Se a imagem exceder o ecrã, o visualizador MUST apresentá-la de forma a caber na área útil sem distorção (manter proporção); se for menor, MUST NOT esticá-la para preencher o ecrã.
- **FR-003a**: Após a vista inicial, o utilizador MUST poder **aproximar e afastar** (zoom in/out) e **deslocar** (pan) a imagem dentro do visualizador para inspeccionar detalhe até à resolução do ficheiro disponível; MUST existir forma clara de voltar à vista encaixada (ou equivalente) sem fechar o overlay.
- **FR-004**: O utilizador MUST poder fechar o visualizador com **Escape**, clique no **fundo** e um **controlo de fecho** visível.
- **FR-005**: Enquanto o visualizador estiver aberto, o resto da UI MUST ficar visualmente em segundo plano (fundo escurecido ou equivalente); ao fechar, o chat MUST voltar ao estado interactivo normal.
- **FR-006**: Imagens no histórico que suportam zoom MUST ser claramente activáveis (indicação visual de interacção).
- **FR-007**: Quando uma mensagem tiver **múltiplas** imagens, o visualizador MUST permitir navegar entre elas (anterior/seguinte) **sem fechar** o overlay; a navegação MUST limitar-se às imagens **dessa mensagem** (não a todo o canal). Nos extremos, a navegação MUST **parar** (sem wrap): controlo desactivado ou acção sem efeito. Ao mudar de imagem, o zoom/pan MUST **repor** a vista encaixada por omissão.
- **FR-008**: O zoom de imagens MUST aplicar-se apenas a **anexos de imagem em mensagens de chat**, não a avatares, ícones de servidor ou miniaturas de preview de links.
- **FR-009**: Falhas de carregamento no visualizador MUST ser comunicadas de forma compreensível e MUST permitir fechar o overlay.
- **FR-010**: O visualizador MUST expor um **controlo explícito de download/guardar** para a imagem actualmente mostrada; o utilizador MUST poder obter o ficheiro (ou o fluxo nativo de guardar do browser) sem sair do produto para «inspeccionar elemento».

### Key Entities

- **Anexo de imagem de mensagem**: ficheiro de imagem associado a uma mensagem no histórico, já apresentado como miniatura/inline no chat.
- **Visualizador de imagem (lightbox)**: superfície modal/overlay que mostra uma imagem seleccionada em tamanho grande, permite zoom/pan, fechar, navegar entre imagens da mesma mensagem e **guardar/descarregar** a imagem actual.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em revisão com utilizadores internos, ≥90% identifica o clique na imagem do chat como forma de ver a versão grande, sem instruções escritas.
- **SC-002**: Em 100% dos fluxos de teste com imagem válida, o visualizador mostra uma versão nítida maior (ou igual, se já pequena) do que a miniatura da linha — nunca um crop/blur óbvio do thumb.
- **SC-002a**: Em 100% dos testes com imagem grande o suficiente, o revisor consegue zoom in + pan e ver detalhe além da vista «fit»; consegue voltar à vista encaixada sem fechar o overlay.
- **SC-003**: Em 100% dos testes, Escape e clique no fundo fecham o visualizador e o chat fica utilizável de imediato.
- **SC-004**: Tempo percebido: após o clique, o overlay aparece em menos de ~1 segundo em condições normais (imagem já em cache ou rede local); se o carregamento demorar, há feedback de espera.
- **SC-005**: Nenhum regresso: enviar/receber anexos de imagem e ler o histórico continuam a funcionar como antes quando o visualizador está fechado.
- **SC-006**: Em 100% dos testes com mensagem de ≥2 imagens, o revisor consegue abrir uma e passar à outra no overlay sem fechar.
- **SC-007**: Em 100% dos testes com imagem carregada com sucesso, o revisor encontra e usa o controlo de download/guardar e obtém o ficheiro (ou o diálogo nativo de guardar).

## Assumptions

- Comportamento de referência: Teams / Discord / Slack — overlay escuro, imagem centrada, fecho por Escape/fundo/X; navegação multi-imagem **da mesma mensagem**; extremos **param**; zoom **repor** ao mudar; **download** no overlay.
- «Tamanho original» significa a resolução do ficheiro disponível ao cliente, apresentada sem upscale artificial além do zoom pedido pelo utilizador; ao abrir, se for maior que o ecrã, encaixa mantendo proporção; depois o utilizador pode zoom/pan.
- Âmbito: anexos de imagem em mensagens de texto; não redesenhar o fluxo de upload nem adicionar edição/recorte.
- Não é obrigatório neste release: partilha social, anotações, ou abrir a imagem noutro separador como substituto do download.
- Acessibilidade básica (Escape + activação por teclado onde o produto já o suporte) é suficiente para o MVP; controlos de zoom e download MUST ser utilizáveis pelo menos com rato/trackpad (e teclado se já houver padrão óbvio).
- Download usa o asset completo já disponível ao cliente (mesma resolução do visualizador); E2EE: só imagens que o cliente já consegue apresentar.
