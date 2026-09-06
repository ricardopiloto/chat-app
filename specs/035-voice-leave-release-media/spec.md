# Feature Specification: Libertar câmera e microfone ao sair da chamada

**Feature Branch**: `035-voice-leave-release-media`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Quando o usuário clicar em sair de uma chamada, nós temos que garantir que vamos deixar de utilizar a camera e microfone do usuário (liberar camera e microfone)."

**Depends on**: sair da chamada de voz/vídeo (controlo «Sair» / hangup); sessão de média local. Relacionado a limpeza de ligação ([025](../025-ws-disconnect-proxy/), [031](../031-voice-join-errors/)) — esta feature foca-se em **libertar o hardware de câmera e microfone** após Sair.

**Note**: Pedido referido junto a [031-voice-join-errors](../031-voice-join-errors/); o foco é libertar hardware no **fim de sessão** e também em **join falhado com captura parcial**. 031 continua a tratar «não aparecer conectado».

## Clarifications

### Session 2026-09-06

- Q: Perda de ligação / fecho de separador também liberta? → A: Qualquer fim de sessão de chamada (Sair, move, disconnect inesperado; fecho de separador quando o browser permitir)
- Q: Join falhado com captura já pedida — limpar nesta feature? → A: Sim — join falhado com captura parcial MUST libertar mic/câmera (mesmo caminho de limpeza que o leave)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sair liberta câmera e microfone (Priority: P1)

Como participante numa chamada, quando **saio** (ex. botão Sair), quero que a aplicação **deixe de usar** a minha câmera e o meu microfone — o sistema operativo / browser deixa de mostrar a chamada como a capturar esses dispositivos — para a privacidade e para eu poder usar a câmera noutra app.

**Why this priority**: Pedido explícito; hardware activo após «Sair» é falha grave de confiança.

**Independent Test**: Entrar na chamada com mic e/ou câmera activos (indicador do browser a mostrar captura) → Sair → o indicador de captura de mic/câmera para este sítio **desaparece** (ou equivalente: dispositivos libertados) sem refresh da página.

**Acceptance Scenarios**:

1. **Given** estou na chamada com **câmera** e **microfone** em uso, **When** clico em **Sair**, **Then** a aplicação deixa de utilizar câmera e microfone (captura libertada).
2. **Given** estou na chamada só com microfone (câmera off), **When** saio, **Then** o microfone é libertado.
3. **Given** estou na chamada só com câmera (ou câmera + mic), **When** saio, **Then** a câmera é libertada (e o microfone, se estava em uso).
4. **Given** já saí, **When** observo o estado da UI, **Then** **não** estou em chamada activa e **não** continuo a transmitir A/V dessa sessão.

---

### User Story 2 - Todos os fins de sessão libertam (Priority: P1)

Como utilizador, quero a **mesma garantia** sempre que a **sessão de chamada termina** — Sair, barra persistente, move de canal, **perda de ligação**, ou **fecho do separador** (quando o browser permitir limpeza) — para não ficar com dispositivos presos.

**Why this priority**: Um único caminho bem limpo e outros «esquecidos» reproduzem captura fantasma.

**Independent Test**: Repetir fim de sessão por Sair (palco e barra), move de canal de voz, e (quando testável) disconnect inesperado; em cada um, mic/câmera libertados.

**Acceptance Scenarios**:

1. **Given** estou na chamada fora do ecrã da mesa (barra persistente / chrome de chamada), **When** uso **Sair** aí, **Then** câmera e microfone são libertados como no Sair do palco.
2. **Given** mudo para **outro canal de voz** (move de mesa), **When** a mesa anterior é abandonada, **Then** a captura da sessão anterior não fica presa; a nova sessão só usa dispositivos se o novo join os pedir.
3. **Given** a ligação à chamada **cai** ou a sessão termina sem eu ter clicado Sair, **When** a app trata o fim de sessão, **Then** câmera e microfone são libertados.
4. **Given** fecho o separador / navego de forma que a página descarrega **enquanto** estou na chamada, **When** o browser permite handlers de unload, **Then** a captura é libertada na medida do suportado pelo browser.
5. **Given** saí com sucesso, **When** volto a entrar na mesma sala, **Then** posso obter de novo permissão/uso de mic/câmera no caminho feliz (dispositivos não ficaram «presos» de forma permanente).

---

### User Story 4 - Join falhado não deixa captura órfã (Priority: P1)

Como utilizador cuja tentativa de entrar falhou depois de o browser já ter pedido mic/câmera, quero que esses dispositivos sejam **libertados**, para não ficar «fora da chamada» com o indicador de captura ainda ligado.

**Why this priority**: Clarificação — o mesmo caminho de limpeza que o leave; fecha o buraco entre 031 e hardware.

**Independent Test**: Forçar falha de join após o browser já ter concedido mic/câmera; captura libertada; sem estado de «conectado».

**Acceptance Scenarios**:

1. **Given** o join falha após captura parcial de mic e/ou câmera, **When** o erro é tratado, **Then** a captura parcial é libertada.
2. **Given** essa falha, **When** verifico o indicador do browser, **Then** este sítio não continua a capturar por causa dessa tentativa.

---

### User Story 3 - Feedback se a saída falhar a meio (Priority: P2)

Como utilizador, se a saída falhar parcialmente, quero que a app **ainda tente libertar** câmera e microfone e que eu não fique com o browser a indicar captura activa enquanto a UI diz que saí.

**Why this priority**: Evita o pior caso (UI «fora» + hardware ainda ligado).

**Independent Test**: Em falha simulada de rede no leave remoto, a captura local ainda cessa; se a UI mostrar fora da chamada, o hardware não continua activo.

**Acceptance Scenarios**:

1. **Given** o leave remoto falha ou demora, **When** a UI conclui a saída local, **Then** câmera e microfone locais **já** foram libertados (ou a libertação é tentada de forma fiável antes/durante o leave).
2. **Given** a UI mostra que saí, **When** verifico o indicador de captura do browser, **Then** este sítio **não** continua a capturar mic/câmera dessa chamada.

---

### Edge Cases

- Blur / processadores de vídeo activos: ao sair, a captura de câmera também é libertada (não deixar pipeline de vídeo a correr).
- Várias tracks (mic + cam + teste): todas as tracks de captura desta sessão de chamada são libertadas no leave.
- Duplo clique em Sair: libertação idempotente (não erro; dispositivos já livres).
- Separar de 031: falha de **join** que nunca chegou a «conectado» **também** MUST libertar captura parcial (FR-008); 031 define a regra de ocupação «não conectado»; esta feature garante o hardware.
- Fora de âmbito: pedir de novo permissões; mudar UI do botão Sair; silenciar logs do proxy Vite (025); regras de ocupação/roster (exceto o efeito colateral de limpar captura no join falhado).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Quando a **sessão de chamada termina** (Sair / hangup, move de mesa, disconnect inesperado, ou unload do separador quando o browser permitir), o sistema MUST **libertar** a **câmera** e o **microfone** usados por essa sessão (deixar de capturar esses dispositivos).
- **FR-002**: A libertação MUST aplicar-se a **todos** esses fins de sessão — não só ao botão Sair do palco.
- **FR-003**: Após um leave bem-sucedido do ponto de vista da UI («fora da chamada»), o browser MUST NOT continuar a mostrar captura activa de mic/câmera **desta** sessão para o sítio.
- **FR-004**: A libertação MUST incluir qualquer processamento local de vídeo ligado à captura (ex. efeitos de fundo) de forma que a câmera não fique em uso só por esse pipeline.
- **FR-005**: A libertação MUST ser segura se repetida (segundo Sair / já sem tracks).
- **FR-006**: Após libertar e sair, o utilizador MUST poder **voltar a entrar** e usar mic/câmera de novo no caminho feliz.
- **FR-007**: Mesmo que a notificação remota de leave falhe, o sistema MUST **priorizar** libertar a captura local de mic/câmera.
- **FR-008**: Se o **join falhar** depois de já ter sido pedida/obtida captura de câmera ou microfone, o sistema MUST **libertar** essa captura parcial (mesmo caminho de limpeza que o fim de sessão), alinhado a [031](../031-voice-join-errors/) («não conectado» + sem hardware órfão).

### Key Entities

- **Leave / Sair**: Acção do utilizador (ou move de mesa) que termina a participação na chamada actual.
- **Local capture (câmera / microfone)**: Uso dos dispositivos de média pelo browser nesta sessão de chamada.
- **Call session**: Sessão activa de voz/vídeo do utilizador até Sair ou perda de ligação tratada como saída.
- **Failed join with partial capture**: Tentativa de join que obteve mic/câmera mas não completou; exige a mesma libertação de hardware.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 5 de 5 testes manuais (mic+cam ligados → Sair no palco), o indicador de captura do browser para este sítio cessa em ≤2 s após Sair.
- **SC-002**: Em teste pela barra persistente de Sair (se aplicável), o mesmo critério SC-001 verifica-se.
- **SC-003**: Após Sair, uma nova entrada na mesma sala consegue activar mic/câmera de novo sem reinício do browser.
- **SC-004**: Em teste de move para outro canal de voz **ou** de fim de sessão por disconnect, a sessão anterior não deixa captura «fantasma» activa após o fim.
- **SC-005**: Nenhum teste de fim de sessão deixa a UI em «fora da chamada» com captura de mic/câmera ainda activa por >3 s.
- **SC-006**: Em fecho de separador com chamada activa, a captura cessa na medida do suportado pelo browser (best-effort documentado se o ambiente limitar handlers).
- **SC-007**: Em teste de join falhado após pedido de mic/câmera, a captura parcial é libertada em ≤3 s e o utilizador não fica com indicador de captura activo sem estar na chamada.

## Assumptions

- «Fim de sessão» inclui Sair/hangup, move de canal, disconnect inesperado e unload do separador (best-effort).
- «Liberar» = o sítio deixa de capturar; o SO/browser deixa de indicar uso activo desses dispositivos por esta página (critério observável).
- Relacionado a 031 (join) e 025 (disconnect), mas o sucesso desta feature mede-se pela **libertação de hardware** no fim de sessão, não só pela ocupação ou logs de proxy.
- Join falhado com captura parcial está **no âmbito** (FR-008); partilha o caminho de limpeza do leave.
- Não exige novo diálogo de confirmação de Sair.
