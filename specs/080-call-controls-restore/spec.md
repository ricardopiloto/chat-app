# Feature Specification: Restaurar controlos de chamada (sair, câmara, blur)

**Feature Branch**: `080-call-controls-restore`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: "Algumas alterações de UI e uma correção…" — complementos: blur escondido atrás do cabeçalho; mic/ensurdecer com **bordas arredondadas** (não cápsula completa).

**Problem**: Após o reposicionamento dos controlos de chamada, um participante ligado a uma sala de vídeo/voz **deixa de ter um caminho claro para desligar da sala**. Separadamente, quem **entra sem câmara** não consegue **ligar a câmara depois** nem aceder aos **efeitos de blur** durante a chamada. Além disso, ao abrir blur a partir do **preview da câmara**, o menu de efeitos fica **tapado pelo cabeçalho** do painel de voz e deixa de ser utilizável. No painel do utilizador, os grupos de **microfone** e **ensurdecer** têm cantos demasiado **quadrados** (vivos); o produto deve usar **bordas arredondadas** (rectângulo com raio suave — **não** forma de cápsula/círculo completo).

## Clarifications

### Session 2026-09-08

- Q: Onde deve viver o «sair da chamada» em modo palco? → A: **Sempre** no painel do utilizador enquanto estiver em chamada (palco e fora do palco)
- Q: Onde ligar câmara / blur a meio da chamada? → A: Restaurar os **controlos anteriores na barra inferior do painel de voz** (`voice-pane`, fundo da área principal em modo palco) — não só no painel do utilizador
- Q: Hang-up também na barra inferior do voice-pane? → A: **Sim** — a barra inferior inclui hang-up também (duplicado com o painel do utilizador é OK)
- Q: Chevrons decorativos no mic/ensurdecer do painel? → A: **Remover** — mic e ensurdecer são botões simples (sem chevron inactivo)
- Q: Blur na barra quando a câmara está off? → A: **Esconder** o blur até a câmara estar ligada
- Q: Forma dos controlos mic/ensurdecer (`user-panel-ctrl-split`)? → A: **Bordas arredondadas** (raio suave) — **não** fazer redondos/cápsula completa
- Q: Mic e deafen fora de chamada? → A: **Devem funcionar** mesmo fora de chamada; ao **entrar** numa chamada, o estado da chamada **respeita** essas configurações (mic/deafen)
- Q: Persistência do estado mic/ensurdecer fora de chamada? → A: **Só nesta sessão do browser** (perde-se no reload / novo separador)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Desligar da sala a qualquer momento (Priority: P1)

Como participante numa chamada de voz/vídeo, quero **sempre conseguir sair / desligar da sala** enquanto estiver ligado, independentemente do layout dos controlos (modo palco, painel estreito, controlos reposicionados), para não ficar preso na chamada.

**Why this priority**: Bloqueia o uso seguro da sala — sem saída o utilizador fica preso.

**Independent Test**: Entrar numa sala de vídeo; em modo palco e fora dele, confirmar que existe pelo menos um controlo óbvio de «sair / desligar» e que ao usá-lo a chamada termina.

**Acceptance Scenarios**:

1. **Given** estou ligado a uma sala de voz/vídeo, **When** procuro desligar, **Then** vejo pelo menos um controlo explícito de sair/desligar acessível sem truques.
2. **Given** estou em **modo palco** (ou com a lista de canais recolhida / controlos no layout novo), **When** uso o controlo de sair/desligar no **painel do utilizador**, **Then** a chamada termina e deixo de estar «em chamada».
3. **Given** acabei de sair, **When** olho para o painel / estado da sessão, **Then** os controlos de chamada em curso desaparecem ou voltam ao estado «não em chamada».

---

### User Story 2 - Ligar a câmara depois de entrar sem ela (Priority: P1)

Como participante que **entrou na sala sem câmara**, quero poder **ligar a câmara mais tarde** durante a mesma chamada (se tiver permissão para publicar vídeo), sem ter de sair e voltar a entrar.

**Why this priority**: Relatado como regressão; fluxo habitual em produtos tipo Discord/Teams.

**Independent Test**: Entrar com opção «sem câmara»; durante a chamada, usar os controlos na **barra inferior do painel de voz** para activar câmara; o vídeo local passa a publicar (ou o produto pede permissão e, se concedida, publica).

**Acceptance Scenarios**:

1. **Given** entrei na sala **sem** câmara activa e tenho permissão para vídeo, **When** activo o controlo de câmara na **barra inferior do painel de voz** durante a chamada, **Then** a câmara liga (ou o sistema pede permissão e, se aceite, liga).
2. **Given** a câmara acabou de ser ligada a meio da chamada, **When** outros participantes (ou eu no meu preview) olham para o estado, **Then** o vídeo local fica disponível conforme as regras da sala.
3. **Given** só tenho permissão de escuta (sem publicar vídeo), **When** estou na chamada, **Then** o produto não promete ligar câmara (controlo ausente ou claramente indisponível) — sem confundir com o caso «entrei sem câmara mas posso ligar».

---

### User Story 3 - Efeitos de blur após ligar / com câmara disponível (Priority: P1)

Como participante na chamada, quero aceder aos **efeitos de blur / fundo** quando a câmara está (ou passa a estar) disponível, incluindo o caso em que entrei sem câmara e a liguei depois.

**Why this priority**: Relatado em conjunto com a câmara; blur sem caminho de activação deixa a funcionalidade morta.

**Independent Test**: Entrar sem câmara → na barra inferior do painel de voz ligar câmara → abrir blur e escolher uma opção; ou entrar com câmara e confirmar blur acessível nessa barra.

**Acceptance Scenarios**:

1. **Given** a minha câmara está ligada na chamada (desde o início ou ligada depois), **When** abro o controlo de blur/fundo na **barra inferior do painel de voz** (ou fluxo equivalente restaurado), **Then** consigo escolher uma opção de efeito (ou desligar o blur).
2. **Given** entrei sem câmara e ainda não a liguei, **When** olho para a barra inferior do painel de voz, **Then** o controlo de blur **não está visível** (só aparece depois de ligar a câmara).
3. **Given** escolhi um efeito de blur com a câmara ligada, **When** o efeito é aplicado, **Then** o vídeo reflecte a escolha (ou o produto indica claramente se o efeito não é suportado neste dispositivo).

---

### User Story 4 - Menu de blur visível sobre o chrome da sala (Priority: P1)

Como participante com preview de câmara, quero que o **menu de efeitos de blur** aberto a partir do preview (ou controlos associados) fique **completamente visível e clicável**, sem ficar escondido atrás do cabeçalho do painel de voz (título do canal, composição, grade, editar cena, modo palco, estado E2EE, etc.).

**Why this priority**: Mesmo com blur «disponível», o menu inutilizável é uma regressão de UI reportada com o preview da câmara.

**Independent Test**: Em sala de vídeo com cabeçalho visível, abrir blur a partir do preview/controlos da câmara; confirmar que todas as opções do menu se vêem e se podem activar.

**Acceptance Scenarios**:

1. **Given** estou na sala de vídeo com o cabeçalho do painel visível e abro o menu de blur a partir do **preview da câmara** (ou do controlo de blur ligado a esse preview), **When** o menu aparece, **Then** o menu fica **por cima** do cabeçalho e de outro chrome da sala — nenhuma opção fica tapada ou só parcialmente legível.
2. **Given** o menu de blur está aberto sobre a área do cabeçalho, **When** escolho uma opção, **Then** o clique aplica o efeito (não é interceptado pelo cabeçalho por baixo).
3. **Given** fecho o menu (Escape, clique fora, ou escolha), **When** o menu desaparece, **Then** o cabeçalho e o resto da sala voltam a comportar-se normalmente.

---

### User Story 5 - Bordas arredondadas no microfone e ensurdecer (Priority: P2)

Como participante, quero que os controlos de **microfone** e **ensurdecer** no painel do utilizador tenham **bordas arredondadas** (cantos suaves), em vez de cantos vivos/quadrados — **sem** os transformar em cápsulas/círculos totalmente redondos.

**Why this priority**: Ajuste visual pedido; não bloqueia sair/câmara/blur, mas faz parte do polish do reposicionamento dos controlos.

**Independent Test**: Com a barra de chamada do painel visível, mic e ensurdecer mostram cantos claramente arredondados, mas a silhueta continua rectangular (não «pill» completa).

**Acceptance Scenarios**:

1. **Given** o painel do utilizador mostra os controlos de chamada, **When** olho para o **microfone**, **Then** vejo um botão com **bordas arredondadas** (raio suave), **sem** chevron decorativo inactivo e **sem** forma de cápsula/círculo completo.
2. **Given** o mesmo painel, **When** olho para o **ensurdecer**, **Then** o mesmo tratamento: rectângulo com cantos arredondados, alinhado ao microfone.
3. **Given** activo hover / foco / estado activo nesses controlos, **When** o visual muda, **Then** o arredondamento dos cantos mantém-se.

---

### User Story 6 - Mic e ensurdecer fora de chamada e na entrada (Priority: P1)

Como utilizador, quero poder **ligar/desligar o microfone e o ensurdecer no painel mesmo quando não estou numa chamada**, para preparar o estado antes de entrar; ao **entrar numa chamada**, esse estado MUST ser **respeitado** (ex.: se mutei o mic fora da chamada, entro com mic desligado).

**Why this priority**: Preferência de configuração pré-chamada; evita surpresa ao juntar-se (clarificado).

**Independent Test**: Fora de chamada, alternar mic e/ou ensurdecer no painel; entrar numa sala de voz; confirmar que a sessão inicia com o mesmo estado.

**Acceptance Scenarios**:

1. **Given** não estou em chamada, **When** activo/desactivo o **microfone** no painel do utilizador, **Then** o controlo muda de estado (não fica desactivado/inútil só por não haver chamada).
2. **Given** não estou em chamada, **When** activo/desactivo o **ensurdecer** no painel, **Then** o estado fica guardado como preferência **desta sessão do browser** e o visual reflecte-o.
3. **Given** configurei mic e/ou ensurdecer fora de chamada, **When** entro numa chamada **na mesma sessão**, **Then** a chamada **respeita** esses estados (não os reinicia para o default sem o utilizador o pedir).
4. **Given** estou em chamada, **When** altero mic/ensurdecer no painel, **Then** o efeito aplica-se à chamada em curso como hoje (sem regressão).
5. **Given** configurei mic/ensurdecer e **recarrego** a página (ou abro um novo separador), **When** volto ao painel, **Then** o estado **não** é obrigatório persistir — volta ao default da sessão nova.

---

### Edge Cases

- Saída disponível no **painel do utilizador** em **modo palco** e fora do palco; a **barra inferior do voice-pane** também oferece hang-up (duplicado OK).
- Permissão de microfone/câmara do sistema negada ao tentar ligar câmara a meio da chamada: mensagem compreensível; a chamada de áudio NÃO deve terminar só por causa disso.
- Utilizador «listen-only» / sem permissão de vídeo: não exige controlos de câmara/blur activos.
- Blur indisponível no dispositivo (com câmara ligada): o produto comunica indisponibilidade; não esconde a câmara.
- Câmara desligada: blur **escondido** na barra inferior até a câmara ligar.
- Mic/ensurdecer no painel: utilizáveis **fora de chamada**; ao entrar, o estado da chamada herda essas definições. Papel «só ouvir» MAY continuar a impedir publicar áudio mesmo que o toggle de mic esteja «ligado» visualmente — o produto MUST ser coerente (desactivar ou indicar sem permissão).
- Ensurdecer fora de chamada: preferência **só desta sessão do browser**; ao entrar, aplica-se aos streams remotos conforme o comportamento actual em chamada. Reload / novo separador: estado NÃO precisa sobreviver.
- Reposicionamento visual recente dos controlos NÃO pode remover a capacidade de sair nem de ligar câmara/blur para quem tem permissão.
- Menu de blur aberto perto do topo da área de voz: MUST permanecer utilizável mesmo quando o preview está sob o cabeçalho; MAY reposicionar o menu (ex. abrir para baixo/cima) desde que fique legível e clicável.
- Outros overlays da sala (diálogos, menus de composição) MUST NOT ficar permanentemente por baixo do cabeçalho da mesma forma se forem abertos no mesmo contexto — o requisito mínimo deste story é o **menu de blur do preview**.
- O arredondamento dos **cantos** aplica-se aos botões/contentores de microfone e ensurdecer no painel do utilizador; **sem** chevrons decorativos; **MUST NOT** usar silhueta de cápsula/círculo completo — só bordas arredondadas.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Enquanto o utilizador estiver **ligado a uma chamada** de voz/vídeo, o produto MUST oferecer um controlo explícito e utilizável de **sair / desligar** da sala no **painel do utilizador**.
- **FR-002**: O controlo de sair/desligar no painel do utilizador MUST permanecer visível e utilizável em **modo palco** e fora dele (e layouts estreitos associados), sem exigir sair do modo palco só para desligar.
- **FR-002a**: A **barra inferior do painel de voz** restaurada MUST também incluir **sair / desligar** (hang-up); a duplicação com o painel do utilizador é aceite e intencional.
- **FR-003**: Activar sair/desligar (em qualquer um dos sítios) MUST terminar a participação do utilizador na chamada (sessão deixa de estar «em chamada»).
- **FR-004**: Se o utilizador entrou **sem câmara** mas tem permissão para publicar vídeo, o produto MUST permitir **ligar a câmara durante a chamada** sem reentrar na sala, via a **barra de controlos inferior do painel de voz** (comportamento/controlos anteriores restaurados nessa zona).
- **FR-005**: Ligar a câmara a meio da chamada MUST pedir permissões do sistema quando necessário e MUST aplicar o resultado (ligado / negado com feedback) sem encerrar a chamada indevidamente.
- **FR-006**: Com a câmara ligada (ou quando o produto permite configurar blur antes/ao ligar, de forma explícita), o utilizador MUST poder aceder aos **efeitos de blur/fundo** a partir dos controlos restaurados na **barra inferior do painel de voz**, da mesma forma familiar que no fluxo anterior.
- **FR-006a**: Em chamada (modo palco / painel de voz activo), o produto MUST voltar a expor a **barra de controlos no fundo do painel de voz** (zona onde esses controlos existiam antes — tipicamente sob a área de cena / acima da margem inferior do `voice-pane`), incluindo **sair/desligar**, câmara e blur quando aplicável (e outros controlos de média que faziam parte dessa barra).
- **FR-007**: Enquanto a câmara estiver **desligada**, o controlo de blur/fundo na barra inferior do painel de voz MUST estar **oculto** (não meramente desactivado sem explicação). Ao ligar a câmara, o blur MUST tornar-se disponível conforme FR-006.
- **FR-008**: Utilizadores sem permissão de publicar vídeo MUST NOT depender destes controlos para sair: o sair/desligar (FR-001) aplica-se a todos os participantes em chamada.
- **FR-009**: Esta feature MUST NOT remover capacidades de microfone / ensurdecer já existentes em chamada; o foco inclui restaurar **sair**, **câmara a posteriori**, **blur**, e mic/deafen **também fora de chamada**.
- **FR-015**: No painel do utilizador, os controlos de **microfone** e **ensurdecer** MUST ser **operacionais mesmo fora de uma chamada** (o utilizador pode alterar o estado sem estar «ao vivo»).
- **FR-016**: Ao **entrar** numa chamada, o produto MUST **aplicar / respeitar** o estado actual de microfone e ensurdecer configurado no painel (não resetar silenciosamente para defaults que ignorem essa preferência).
- **FR-017**: O estado de microfone e ensurdecer fora de chamada MUST persistir **apenas nesta sessão do browser** (memória da app aberta). MUST NOT ser obrigatório sobreviver a reload completo da página nem a um novo separador.
- **FR-010**: O menu de efeitos de blur aberto a partir do **preview da câmara** (ou controlos associados nesse contexto) MUST aparecer **inteiramente visível e interactivo**, sem ficar coberto pelo cabeçalho do painel de voz nem por chrome equivalente da sala.
- **FR-011**: Enquanto o menu de blur estiver aberto sobre a área do cabeçalho, as acções do menu MUST receber o input do utilizador (cliques/activação) — o cabeçalho MUST NOT interceptar esses cliques.
- **FR-012**: No painel do utilizador, os controlos de **microfone** e **ensurdecer** (incl. contentores `user-panel-ctrl-split` equivalentes) MUST ter **bordas arredondadas** (cantos com raio suave). MUST NOT usar cantos vivos/quadrados; MUST NOT ser **redondos/cápsula** (pill completo).
- **FR-013**: Microfone e ensurdecer MUST partilhar o **mesmo** tratamento de bordas arredondadas entre si para a barra parecer uniforme.
- **FR-014**: Microfone e ensurdecer no painel do utilizador MUST NOT mostrar chevron/dropdown decorativo inactivo; são botões simples (o chevron real de blur permanece onde o blur existir na barra do voice-pane).

### Key Entities

- **Chamada / sala de voz-vídeo**: sessão em que o utilizador está ligado (ao vivo).
- **Controlo de sair/desligar**: acção explícita que termina a participação na chamada.
- **Controlo de câmara**: liga/desliga publicação de vídeo local durante a chamada.
- **Efeitos de blur/fundo**: opções de fundo aplicadas ao vídeo da câmara.
- **Preview da câmara**: superfície de pré-visualização local a partir da qual o utilizador pode abrir controlos (incl. blur).
- **Cabeçalho do painel de voz**: faixa superior da sala (nome do canal, composição, modo palco, estado E2EE, etc.) que não deve tapar o menu de blur.
- **Barra inferior do painel de voz**: faixa de controlos em chamada no fundo do `voice-pane` (localização anterior a restaurar) para câmara, blur e controlos de média associados.
- **Grupo de controlo do painel (mic / ensurdecer)**: botões/contentores de microfone e ensurdecer na barra do painel do utilizador (bordas arredondadas, sem chevron decorativo, sem silhueta pill).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos testes em modo palco e fora dele, um revisor consegue desligar da sala pelo **painel do utilizador** em menos de 10 segundos sem ajuda.
- **SC-001a**: Em 100% dos testes em painel de voz com a barra inferior restaurada, o revisor também consegue desligar pela **barra inferior** (hang-up duplicado).
- **SC-002**: Em 100% dos testes «entrar sem câmara» com permissão de vídeo, o revisor consegue ligar a câmara durante a chamada sem sair e voltar a entrar.
- **SC-003**: Em 100% dos testes após ligar a câmara a meio da chamada, o revisor consegue abrir e alterar blur (ou vê indicação clara de indisponibilidade no dispositivo) — não um estado em que blur «desapareceu».
- **SC-004**: Nenhuma regressão intencional: microfone e ensurdecer em chamada continuam utilizáveis para quem tem permissão.
- **SC-008**: Em 100% dos testes, fora de chamada o revisor consegue alternar mic e ensurdecer no painel; ao entrar numa chamada a seguir, o estado inicial da chamada coincide com essas definições.
- **SC-005**: Em revisão interna, ≥90% concorda que «sair da chamada» voltou a ser óbvio no layout actual dos controlos.
- **SC-006**: Em 100% dos testes a abrir blur a partir do preview da câmara com o cabeçalho da sala visível, o revisor vê o menu completo e consegue activar uma opção sem o cabeçalho tapar ou «roubar» o clique.
- **SC-007**: Em revisão visual, microfone e ensurdecer no painel do utilizador têm **cantos arredondados** (não cantos vivos) e **não** parecem cápsulas/círculos; ambos iguais; sem chevron decorativo.

## Assumptions

- O reposicionamento recente dos controlos (painel estilo Discord / alinhamentos) é a causa percebida da perda do caminho de saída e da câmara/blur a posteriori; esta feature restaura o comportamento esperado, não redesenha a sala inteira.
- «Sair / desligar» = terminar a chamada para mim (hang up), não apenas minimizar o palco ou ocultar canais.
- Quem entra sem câmara mantém a mesma sessão; ligar câmara é um toggle em chamada na **barra inferior do painel de voz** restaurada, não um novo «prejoin».
- Blur continua a ser um efeito sobre o vídeo da câmara; com câmara off, o controlo de blur na barra inferior fica **oculto** até ligar a câmara.
- PiP flutuante MAY existir em paralelo. **Sair** é obrigatório no **painel do utilizador** e também na **barra inferior do voice-pane** (duplicado aceite). Câmara/blur em chamada residem nessa barra inferior restaurada.
- Permissões de papel «só ouvir» mantêm-se: sem obrigação de oferecer câmara nesses casos.
- O defeito do menu de blur «atrás» do cabeçalho foi observado ao interagir com o **preview da câmara** na sala em modo palco / painel de voz; a correcção aplica-se a esse fluxo (e a qualquer abertura equivalente do mesmo menu nesse ecrã).
- «Bordas arredondadas» nos mic/deafen do painel = rectângulo com **raio de canto suave**, **não** pill/cápsula completa; **sem** chevron decorativo inactivo.
- Mic e ensurdecer no painel são preferências **só desta sessão do browser**, utilizáveis fora de chamada; a entrada na chamada **herda** esse estado; reload / novo separador NÃO exige persistência (clarificado).
- Este story de UI (US5) é polish P2; as correcções P1 (sair, câmara, blur, menu visível, barra voice-pane, mic/deafen pré-chamada) têm prioridade se houver conflito de esforço.
