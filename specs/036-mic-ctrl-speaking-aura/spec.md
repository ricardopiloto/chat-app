# Feature Specification: Aura de «a falar» no botão de microfone dos controlos da chamada

**Feature Branch**: `036-mic-ctrl-speaking-aura`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "A aura que denota que a pessoa está falando tem que estar visivel também em [botão Microfone ligado dos call-controls na barra de controlos da chamada / voice pane]."

**Depends on**: indicador de «a falar» na lista do canal ([033-voice-speaking-indicator](../033-voice-speaking-indicator/)); controlos de chamada (microfone ligado/desligado) no ecrã da mesa / modo palco.

## Clarifications

### Session 2026-09-06

- Q: Acessibilidade — o rótulo do botão de mic muda enquanto a aura está activa? → A: Não — manter «Microfone ligado» / «Microfone desligado»; a aura é só visual
- Q: Onde se aplica a aura no controlo? → A: Em torno do **botão inteiro** de microfone (não só do ícone interior)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver a aura no meu microfone enquanto falo (Priority: P1)

Como participante **na chamada**, quando **eu estou a falar** com o microfone ligado, quero ver a **mesma aura** de «a falar» também no **botão de microfone** da barra de controlos da chamada (não só na lista de utilizadores), para ter feedback claro de que o meu áudio está activo.

**Why this priority**: Pedido explícito; fecha o buraco entre a lista (033) e o controlo local que o utilizador olha enquanto fala.

**Independent Test**: Entrar na chamada com mic ligado → falar → a aura aparece no botão «Microfone ligado» dos call-controls; parar de falar → a aura deixa de aparecer nesse botão.

**Acceptance Scenarios**:

1. **Given** estou na chamada com **microfone ligado** e **estou a falar**, **When** olho a barra de controlos da chamada, **Then** o **botão inteiro** de microfone mostra a **aura** de «a falar» (mesmo tipo de realce usado na lista para quem fala; não só um anel no ícone interior).
2. **Given** estou a falar com a aura no botão de mic, **When** paro de falar, **Then** a aura **deixa de** aparecer no botão (sem ficar presa).
3. **Given** o microfone está **ligado** mas **não** estou a falar, **When** olho o botão, **Then** **não** há aura de fala (só o estado normal «ligado»).

---

### User Story 2 - Mute / mic desligado sem aura (Priority: P1)

Como participante, se o microfone está **desligado**, quero que o botão **não** mostre aura de «a falar» (mesmo que haja ruído ambiente), alinhado à regra da lista.

**Why this priority**: Evita falso positivo e inconsistência com 033.

**Independent Test**: Com mic desligado, falar ou fazer ruído → botão sem aura; ligar mic e falar → aura aparece.

**Acceptance Scenarios**:

1. **Given** o microfone está **desligado**, **When** faço ruído / falo, **Then** o botão de microfone **não** mostra aura de «a falar».
2. **Given** estou a falar com aura no botão, **When** desligo o microfone, **Then** a aura **para** de imediato (ou em atraso curto razoável).

---

### User Story 3 - Consistência visual com a lista (Priority: P2)

Como utilizador, quero que a aura no botão de microfone seja **reconhecivelmente a mesma linguagem visual** da aura na lista de quem fala (mesma família de animação / realce), para não parecer outro tipo de aviso.

**Why this priority**: Coerência de produto; secundário ao facto de a aura existir no botão.

**Independent Test**: Comparar lado a lado (lista própria + botão de mic) enquanto falo — o realce é claramente o mesmo «a falar», não um estilo de erro/alerta diferente.

**Acceptance Scenarios**:

1. **Given** estou a falar e a minha linha na lista e o botão de mic estão visíveis, **When** comparo os dois, **Then** ambos usam a **mesma linguagem** de aura de «a falar» (não um efeito desconectado).
2. **Given** tema claro ou escuro, **When** a aura aparece no botão, **Then** continua legível e distinguível do botão em repouso.
3. **Given** a aura está activa no botão, **When** um leitor de ecrã ou tooltip consulta o controlo, **Then** o nome continua «Microfone ligado» ou «Microfone desligado» (sem «a falar» no rótulo).

---

### Edge Cases

- Fora da chamada / controlos não visíveis: sem requisito (não há botão).
- Câmera e outros controlos (blur, Sair): **fora de âmbito** — só o botão de **microfone** nesta feature.
- Barra persistente da chamada noutra vista (se existir mic separado): se o mesmo controlo de mic da chamada estiver visível, MUST ter a mesma aura; se não houver botão de mic nessa barra, não inventar um.
- Atraso curto ao começar/parar de falar: aceite, alinhado ao comportamento da lista (033).
- Duplo clique mute/unmute rápido: aura não deve ficar presa no estado errado.
- Acessibilidade: não alterar `aria-label` / título do botão por causa da aura (clarificação 2026-09-06).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Enquanto o utilizador está **na chamada**, com **microfone ligado**, e está **a falar**, o sistema MUST mostrar a **aura de «a falar»** **em torno do botão inteiro** de microfone dos controlos da chamada (não apenas em torno do ícone interior).
- **FR-002**: Quando o utilizador **deixa de falar** (ou o microfone passa a desligado), o sistema MUST **remover** a aura desse botão.
- **FR-003**: Com microfone **desligado**, o botão MUST NOT mostrar aura de «a falar».
- **FR-004**: A aura no botão MUST usar a **mesma linguagem visual** de «a falar» já usada na lista de participantes (033), adaptada à escala do botão se necessário, sem parecer outro tipo de aviso.
- **FR-005**: Esta feature MUST NOT alterar o comportamento de ligar/desligar o microfone — só acrescenta o realce visual de fala.
- **FR-006**: Esta feature MUST NOT exigir aura em botões de câmera, blur, ou Sair.
- **FR-007**: Os rótulos acessíveis do botão de microfone MUST permanecer «Microfone ligado» / «Microfone desligado» (sem acrescentar «a falar»); a aura é feedback **visual** apenas.

### Key Entities

- **Call mic control**: Botão dos controlos da chamada que liga/desliga o microfone local («Microfone ligado» / «Microfone desligado»).
- **Speaking aura**: Realce animado que indica actividade de fala (já presente na lista em 033).
- **Local speaking state**: Indicação de que **eu** estou a falar na chamada actual (mesma noção de «a falar» que a lista usa para participantes).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 5 de 5 testes manuais (mic ligado → falar), a aura aparece no botão de microfone dos call-controls em ≤1 s após o início perceptível da fala.
- **SC-002**: Em 5 de 5 testes, após parar de falar, a aura deixa o botão em ≤2 s.
- **SC-003**: Com mic desligado, em 5 de 5 tentativas com ruído, o botão **não** mostra aura.
- **SC-004**: Observadores/produto consideram a aura do botão **consistente** com a da lista (mesmo significado «a falar») em revisão lado a lado.
- **SC-005**: Aura legível em tema claro e escuro no botão de mic.

## Assumptions

- A detecção de «eu estou a falar» reutiliza a mesma noção já usada para a lista em 033 (sem novo conceito de negócio).
- O alvo é o **botão inteiro** de microfone da barra **call-controls** da mesa / voice pane (incluindo modo palco), identificado pelo rótulo «Microfone ligado» / «Microfone desligado».
- Não se pede aura no botão de câmera nem noutros controlos nesta entrega.
- Mute bloqueia aura, como na lista.
- Preferência visual: reutilizar a linguagem da aura da lista, não inventar um estilo paralelo.
- Rótulos do botão de mic não mudam com a fala (aura visual-only).
