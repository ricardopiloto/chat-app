# Feature Specification: Câmara no painel + blur no cabeçalho

**Feature Branch**: `081-panel-cam-header-blur`

**Created**: 2026-09-08

**Status**: Draft

**Input**: User description: Mover o controlo de câmara on/off para o painel do utilizador (ao lado de ensurdecer, antes de definições), no mesmo modelo visual dos botões de microfone e ensurdecer, **sem** blur nesse botão. Em chamada, mover o blur para o cabeçalho do painel de voz como select (nenhum / leve / forte). Remover a barra inferior `voice-in-call-bar`. Remover também o botão «Modo palco».

## Clarifications

### Session 2026-09-08

- Q: Layout sem o botão «Modo palco»? → A: **Sempre fora do modo palco** (o produto não entra / não permanece em modo palco)
- Q: Câmara no painel fora de chamada? → A: **Preferência de sessão** (como mic); o JOIN **respeita** esse estado
- Q: Opt-in de câmara no ecrã de pré-entrada? → A: **Remover** o opt-in de câmara (e blur associado) do pré-entrada; só JOIN (+ secundários que não sejam câmara)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Câmara no painel do utilizador (Priority: P1)

Como participante, quero ligar/desligar a **câmara** no **painel do utilizador** (entre ensurdecer e definições), com o mesmo aspeto dos botões de microfone e ensurdecer, **sem** menu ou opções de blur nesse controlo.

**Why this priority**: Substitui o controlo de câmara da barra inferior que será removida; precisa de um sítio óbvio e estável.

**Independent Test**: Em chamada (e conforme regras de permissão), usar só o painel para ligar/desligar câmara; confirmar que não há blur associado a esse botão.

**Acceptance Scenarios**:

1. **Given** estou autenticado e o painel do utilizador está visível, **When** olho para a fila de controlos, **Then** vejo microfone, ensurdecer, **câmara**, depois definições (câmara imediatamente antes de definições).
2. **Given** estou numa chamada e tenho permissão para publicar vídeo, **When** activo/desactivo a câmara no painel, **Then** o vídeo local liga/desliga sem precisar da barra inferior.
3. **Given** o botão de câmara no painel, **When** interajo com ele, **Then** **não** aparece menu nem atalho de blur nesse botão.
4. **Given** não tenho permissão para publicar vídeo (só ouvir), **When** estou em chamada, **Then** a câmara no painel está indisponível de forma clara (desactivada ou equivalente) — sem prometer vídeo.
5. **Given** não estou em chamada, **When** activo/desactivo a câmara no painel, **Then** o estado fica como preferência de sessão (como o microfone).
6. **Given** configurei a câmara no painel fora de chamada, **When** faço JOIN, **Then** a entrada respeita essa preferência (entro com câmara on/off conforme o painel).
7. **Given** estou no ecrã de pré-entrada da sala de voz, **When** olho para os controlos, **Then** **não** vejo opt-in de câmara nem blur de pré-entrada — apenas JOIN (e secundários que não sejam câmara, se existirem).

---

### User Story 2 - Blur no cabeçalho como select (Priority: P1)

Como participante **em chamada** no painel de voz, quero escolher o efeito de fundo num **select do cabeçalho** com três opções: nenhum efeito, blur leve, blur forte.

**Why this priority**: Blur deixa de viver na barra inferior / no botão de câmara; o cabeçalho é o novo sítio único em chamada.

**Independent Test**: Em chamada com câmara ligada, mudar o select do cabeçalho entre as três opções e ver o efeito (ou indicação clara se indisponível no dispositivo).

**Acceptance Scenarios**:

1. **Given** estou em chamada no painel de voz, **When** olho para o cabeçalho, **Then** vejo um select de efeito de fundo com exactamente: nenhum efeito, blur leve, blur forte.
2. **Given** a câmara está ligada, **When** escolho blur leve ou forte, **Then** o vídeo reflecte a escolha (ou o produto indica que o efeito não está disponível neste dispositivo).
3. **Given** escolho «nenhum efeito», **When** a escolha aplica-se, **Then** o vídeo deixa de usar blur.
4. **Given** a câmara está desligada, **When** altero o select, **Then** a preferência fica guardada para quando a câmara ligar (ou o select fica claramente inactivo — comportamento coerente documentado nas Assumptions).

---

### User Story 3 - Remover a barra inferior de chamada (Priority: P1)

Como participante, quero que a **barra inferior de controlos em chamada** (`voice-in-call-bar`) desapareça, porque câmara, blur e sair passam a viver noutros sítios (painel / cabeçalho / painel).

**Why this priority**: Evita controlos duplicados e limpa o layout pedido.

**Independent Test**: Em chamada no painel de voz, confirmar que a barra inferior de chamada não existe; sair continua possível pelo painel; câmara e blur nos novos sítios.

**Acceptance Scenarios**:

1. **Given** estou em chamada no painel de voz, **When** olho para a zona inferior do painel, **Then** **não** vejo a barra de controlos de chamada (hang-up / câmara / blur nessa faixa).
2. **Given** a barra foi removida, **When** quero sair da chamada, **Then** consigo sair pelo controlo de sair já presente no painel do utilizador.
3. **Given** a barra foi removida, **When** quero câmara ou blur, **Then** uso o painel (câmara) e o cabeçalho (blur), não a barra antiga.

---

### User Story 4 - Remover o botão «Modo palco» e viver sem modo palco (Priority: P1)

Como participante no painel de voz, **deixo de ver** o botão «Modo palco» e o produto **não usa modo palco** — o layout do shell permanece sempre **fora** do modo palco.

**Why this priority**: Pedido explícito de remoção do controlo; clarificado que o layout fixo é não-palco.

**Independent Test**: Abrir o painel de voz em chamada; sem botão «Modo palco»; shell sem estado/classe de modo palco.

**Acceptance Scenarios**:

1. **Given** estou no painel de voz (em chamada ou a preparar entrada), **When** olho para o cabeçalho, **Then** **não** vejo o botão «Modo palco».
2. **Given** entro ou estou numa chamada de voz/vídeo, **When** observo o layout do aplicativo, **Then** o shell **não** está em modo palco (sempre layout normal / fora do palco).
3. **Given** preferências antigas que activavam modo palco, **When** uso a app após esta feature, **Then** o modo palco **não** é aplicado (ignorado ou forçado a off).

---

### Edge Cases

- Utilizador só-ouvir: câmara no painel indisponível; blur no cabeçalho MAY ocultar-se ou ficar sem efeito útil.
- Permissão de câmara do sistema negada ao ligar pelo painel: feedback claro; a chamada de áudio não termina só por isso.
- Blur indisponível no dispositivo: select permanece utilizável para «nenhum»; opções de blur comunicam indisponibilidade.
- Saída da chamada: apenas pelo painel do utilizador (e PiP se existir) — sem hang-up na barra removida.
- Modo palco: botão ausente; produto **nunca** activa modo palco (incl. ao entrar em chamada).
- Pré-entrada (JOIN): **sem** opt-in de câmara nem blur no ecrã de entrada; a preferência de câmara do **painel** governa o JOIN.
- Câmara no painel fora de chamada: preferência de **sessão do browser** (como mic/ensurdecer em 080); não exige persistência após reload.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O painel do utilizador MUST incluir um controlo de **câmara on/off** posicionado **depois** de ensurdecer e **antes** de definições.
- **FR-002**: O controlo de câmara no painel MUST seguir o **mesmo modelo visual** dos botões de microfone e ensurdecer (botão simples com ícone; bordas arredondadas coerentes).
- **FR-003**: O controlo de câmara no painel MUST NOT incluir blur, menu de blur, nem chevron de efeitos.
- **FR-004**: Em chamada, com permissão de vídeo, activar/desactivar a câmara no painel MUST ligar/desligar a publicação de vídeo local sem reentrar na sala.
- **FR-004a**: Fora de chamada, o controlo de câmara no painel MUST actualizar uma **preferência de sessão** (mesmo espírito que mic/ensurdecer).
- **FR-004b**: Ao fazer JOIN, o produto MUST **respeitar** a preferência de câmara do painel (entrar com câmara ligada ou desligada conforme esse estado), salvo permissão só-ouvir / falha de dispositivo.
- **FR-004c**: O ecrã de pré-entrada MUST NOT mostrar opt-in de câmara nem controlos de blur de pré-entrada; MUST oferecer JOIN (e MAY manter secundários não relacionados com câmara, ex. teste de vídeo).
- **FR-005**: Enquanto o utilizador estiver em chamada no painel de voz, o **cabeçalho** MUST oferecer um **select** de efeito de fundo com exactamente três opções: nenhum efeito, blur leve, blur forte.
- **FR-006**: Escolher uma opção no select MUST actualizar o efeito aplicado ao vídeo da câmara quando a câmara estiver ligada (e persistir a preferência de efeito conforme o comportamento actual de preferência de blur do produto).
- **FR-007**: O produto MUST NOT mostrar a barra inferior de controlos em chamada (`voice-in-call-bar` / faixa equivalente com hang-up + câmara + blur).
- **FR-008**: O produto MUST NOT mostrar o botão «Modo palco» no cabeçalho do painel de voz (nem equivalente com o mesmo propósito).
- **FR-008a**: O produto MUST permanecer **sempre fora do modo palco** (não activar modo palco ao entrar em chamada nem por preferência legada).
- **FR-009**: Após remover a barra inferior, o utilizador MUST continuar a poder **sair da chamada** pelo painel do utilizador.
- **FR-010**: Utilizadores sem permissão de publicar vídeo MUST NOT depender do botão de câmara do painel para funcionalidade essencial (sair continua disponível).

### Key Entities

- **Painel do utilizador**: barra inferior do shell com identidade + controlos (mic, ensurdecer, câmara, definições) e sair quando em chamada.
- **Controlo de câmara (painel)**: toggle on/off sem blur.
- **Select de blur (cabeçalho)**: escolha nenhum / leve / forte em chamada no painel de voz.
- **Barra inferior de chamada**: faixa a **remover** (controlos em chamada no fundo do painel de voz).
- **Botão Modo palco**: controlo de layout a **remover** do cabeçalho.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 100% dos testes em chamada, o revisor liga/desliga a câmara só pelo painel do utilizador em menos de 10 segundos.
- **SC-001a**: Em 100% dos testes, fora de chamada o revisor altera a câmara no painel e o JOIN seguinte inicia com esse estado (on→vídeo / off→áudio-only conforme regras da sala).
- **SC-001b**: Em 100% dos testes no pré-entrada, **não** há opt-in de câmara nem blur de pré-entrada.
- **SC-002**: Em 100% dos testes em chamada com câmara ligada, o revisor altera o select do cabeçalho entre as três opções e confirma efeito ou mensagem clara de indisponibilidade.
- **SC-003**: Em 100% dos testes em chamada no painel de voz, a barra inferior de controlos de chamada **não está presente**.
- **SC-004**: Em 100% dos testes no painel de voz, o botão «Modo palco» **não está presente**.
- **SC-004a**: Em 100% dos testes em chamada, o layout do shell está **fora** do modo palco (não entra em modo palco).
- **SC-005**: Em 100% dos testes, após remover a barra, o revisor consegue sair da chamada pelo painel do utilizador.
- **SC-006**: Em revisão visual, o botão de câmara do painel alinha-se ao modelo mic/ensurdecer e **não** expõe blur.

## Assumptions

- Hang-up / sair permanece no **painel do utilizador** (e PiP flutuante se existir); não é necessário recriar hang-up no cabeçalho.
- O select de blur no cabeçalho aparece no contexto do **painel de voz em chamada**; fora de chamada / noutro canal de texto o select de blur da chamada não é obrigatório.
- Com câmara desligada em chamada: alterar o select **guarda a preferência** e aplica-se na próxima vez que a câmara ligar (select permanece visível e utilizável).
- Preferência de blur continua a ser a preferência de efeito já usada no produto (leve/forte/off), apenas com UI de select no cabeçalho em chamada.
- Pré-join: **sem** UI de opt-in de câmara/blur; JOIN usa a preferência do painel; secundários não-câmara (ex. teste) MAY permanecer.
- Preferência de câmara no painel: só **sessão do browser** (como mic/ensurdecer); reload volta ao default.
- Remover «Modo palco»: o produto fica **sempre fora do modo palco**; preferências/atalhos antigos de palco não reactivam o layout.
- i18n: rótulos do select e aria da câmara seguem o idioma da UI.
