# Feature Specification: Indicador animado de «a falar» na lista do canal de voz

**Feature Branch**: `033-voice-speaking-indicator`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "Vamos adicionar uma animação em torno do ícone do microfone e do ícone do falante na lista de usuários no canal de voz para mostrar que ele está falando."

**Depends on**: lista de participantes no canal de voz ([028](../028-voice-call-roster/), [030](../030-voice-roster-avatars/)); estado de microfone na chamada; áudio em tempo real da mesa.

## Clarifications

### Session 2026-09-06

- Q: Como outros clientes sabem que alguém está a falar? → A: Cada cliente detecta actividade de voz no áudio remoto que já recebe (sem API nova de «speaking»)
- Q: O que é o «ícone de falante» na linha da lista? → A: Ícone de **saída de áudio** (auscultadores/altifalante: a ouvir vs ensurdecido), distinto do microfone; a animação/aura de «a falar» envolve mic e esse ícone.
- Q: Deafen nesta feature, se o produto ainda não tem ensurdecer? → A: Só ícone visual «a ouvir» por agora; sem controlo nem estado ensurdecido nesta entrega.
- Q: Quem não está na chamada vê a aura de «a falar» na lista? → A: Não — só participantes da mesma chamada; fora da chamada a lista mostra ícones sem animação de fala.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Ver quem está a falar na lista (Priority: P1)

Como membro a olhar a **lista de utilizadores do canal de voz**, quero uma **aura** em torno do **ícone de falante** e do **ícone de microfone** da pessoa que está a falar (mesmo efeito nos dois), para perceber de imediato quem está activo sem depender só do vídeo no palco.

**Why this priority**: Pedido principal; melhora legibilidade da mesa quando há várias pessoas.

**Independent Test**: Duas contas **na mesma chamada**; A fala com microfone ligado; B (também na chamada) vê na lista animação em torno dos ícones de mic/falante de A. A pára de falar → a animação pára (após um atraso curto razoável).

**Acceptance Scenarios**:

1. **Given** A e B estão **na mesma chamada**, A está na lista com microfone utilizável e **está a falar**, **When** B olha a lista, **Then** vê uma **aura** (realce animado em torno) no **ícone de microfone** e no **ícone de falante** de A — o mesmo tratamento visual em ambos.
2. **Given** A deixa de falar, **When** B observa a lista, **Then** a animação de «a falar» **deixa de** aparecer em A (sem ficar presa indefinidamente).
3. **Given** ninguém está a falar, **When** olho a lista, **Then** os ícones de mic/falante **não** mostram a animação de fala activa.

---

### User Story 2 - Ícones presentes e legíveis na lista (Priority: P1)

Como utilizador, quero que a lista do canal de voz mostre **ícones de microfone e de falante** por pessoa (além do identificador/avatar já existentes), para a animação de «a falar» ter um alvo claro e o estado de áudio ser compreensível.

**Why this priority**: Sem ícones estáveis, a animação «em torno» não tem âncora; a lista actual foca-se em handle/avatar.

**Independent Test**: Com ocupantes na lista aninhada (ou lista equivalente do canal de voz), cada linha mostra ícone de microfone e ícone de falante distinguíveis; a animação aplica-se a esses ícones quando há fala.

**Acceptance Scenarios**:

1. **Given** há pelo menos uma pessoa na lista do canal de voz, **When** vejo a linha dessa pessoa, **Then** vejo um **ícone de microfone** e um **ícone de saída de áudio** (falante/auscultadores) associados a ela.
2. **Given** a pessoa está muda (microfone desligado), **When** vejo a linha, **Then** o ícone de microfone reflecte estado mudo (e **não** anima como «a falar»).
3. **Given** tema claro ou escuro, **When** vejo ícones e animação, **Then** permanecem legíveis (contraste suficiente).

---

### User Story 3 - Eu próprio a falar (Priority: P2)

Como participante na chamada, quero ver o **mesmo indicador** na **minha** linha da lista quando estou a falar, para confirmar que o microfone está a captar voz.

**Why this priority**: Feedback local reduz «penso que estou a falar mas estou mudo».

**Independent Test**: Entrar na chamada, falar com mic ligado; a própria linha na lista anima; mutar → deixa de animar mesmo se houver ruído de fundo no ambiente.

**Acceptance Scenarios**:

1. **Given** estou na lista com mic ligado e falo, **When** olho a minha linha, **Then** vejo a animação de «a falar» nos meus ícones.
2. **Given** estou mudo, **When** faço som, **Then** a minha linha **não** anima como a falar.

---

### Edge Cases

- Microfone ligado mas silêncio: sem animação (só actividade de voz real, não só `mic_on`).
- Ruído breve / picos: animação pode ter histerese curta para não «piscar» de forma irritante; não precisa de ser pixel-perfect com cada milissegundo.
- Várias pessoas a falar ao mesmo tempo: cada uma com animação independente na sua linha.
- Lista vazia / só a ouvir (mic e cam off): fora da lista aninhada 028 — esta feature não obriga a mostrar quem só ouve; aplica-se a quem já aparece na lista do canal de voz.
- Modo palco com coluna colapsada: se a lista não estiver visível, a animação não é exigida nesse momento; ao expandir canais, o comportamento aplica-se de novo.
- Observador **fora** da chamada (ex. em canal de texto a ver a lista aninhada): vê ícones de mic/falante se a linha existir; **sem** aura de «a falar» até entrar na chamada.
- Fora de âmbito: animação no tile de vídeo do palco (pode existir noutro momento); equalizer complexo; indicador de «anfitrião»; **deafen** (controlo ou estado ensurdecido); alterar quem entra na lista 028; API/evento de servidor só para «speaking».

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A lista de utilizadores do canal de voz MUST mostrar, por pessoa listada, um **ícone de microfone** (ligado/mudo) e um **ícone de saída de áudio** / «falante» (visual de auscultadores/altifalante), distintos entre si (**clarificação 2026-09-06**).
- **FR-002**: Quando uma pessoa listada está **a falar** (actividade de voz detectável com microfone não mudo), a UI MUST mostrar uma **aura** (realce animado em torno) no ícone de microfone **e** no ícone de saída de áudio dessa pessoa, com o **mesmo** tratamento visual em ambos.
- **FR-002a**: Nesta entrega o ícone de falante MUST aparecer no estado **«a ouvir»** (sem variante ensurdecida e **sem** controlo de deafen). Estado/controlo ensurdecido fica fora de âmbito (**clarificação 2026-09-06**).
- **FR-003**: Quando a pessoa **não** está a falar, esses ícones MUST NOT permanecer no estado animado de «a falar».
- **FR-004**: Com microfone **mudo**, a pessoa MUST NOT mostrar animação de «a falar», mesmo que exista som ambiente.
- **FR-005**: A animação MUST ser perceptível em ≤1 s após o início de fala sustentada e MUST cessar em ≤2 s após o fim da fala (histerese curta permitida).
- **FR-006**: O indicador MUST aplicar-se a **outros** participantes e ao **próprio** utilizador na lista.
- **FR-007**: Ícones e animação MUST permanecer legíveis em tema claro e escuro.
- **FR-008**: Esta feature MUST NOT alterar as regras de **quem** aparece na lista (continuar a depender de 028/030); só enriquece a apresentação de quem já está listado.
- **FR-009**: A detecção de «a falar» MUST basear-se na **actividade de áudio** que cada cliente já recebe da mesa (níveis/actividade de voz no cliente) — **sem** exigir uma nova API ou evento de servidor só para estado «speaking». O próprio utilizador MUST usar detecção local equivalente no seu microfone.
- **FR-010**: A aura de «a falar» MUST ser exigida apenas para clientes **participantes da mesma chamada**. Um membro que vê a lista aninhada **sem** estar na chamada MUST ver os ícones de mic/falante **sem** animação de fala (**clarificação 2026-09-06**).

### Key Entities

- **Voice channel user list**: Lista de participantes do canal de voz visível na coluna de canais (lista aninhada) — o alvo desta feature.
- **Microphone icon**: Ícone por linha que representa o estado de microfone (ligado/mudo).
- **Speaker / output icon** (ícone de falante): Ícone por linha de **saída de áudio** (visual «a ouvir» nesta entrega); recebe a **mesma aura** que o mic quando a pessoa fala; sem deafen nesta feature.
- **Speaking aura**: Realce animado em torno dos ícones de mic e falante enquanto há actividade de voz.
- **Speaking state**: Estado transitório «está a falar agora» baseado em actividade de voz, distinto de «microfone ligado».

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em teste com dois utilizadores, quando A fala com mic ligado, B identifica A como «a falar» pela **aura** nos ícones de mic e falante em ≤1 s na maioria das tentativas (≥4 de 5).
- **SC-002**: Após A parar de falar, a animação em A cessa em ≤2 s (sem ficar ligada >5 s).
- **SC-003**: Com A mudo, nenhum teste de «falar para o ar» faz a linha de A animar.
- **SC-004**: Cada linha listada mostra ícones de mic e falante reconhecíveis sem ler documentação.
- **SC-005**: Em tema claro e escuro, um revisor confirma contraste adequado dos ícones e da animação numa passagem rápida.

## Assumptions

- «Lista de usuários no canal de voz» = a **lista aninhada** sob o canal de voz na coluna de canais (028/030), não o painel Membros do servidor.
- Hoje a lista pode não ter ainda ícones de mic/falante; esta feature **inclui** adicioná-los se em falta, para a animação ter âncora.
- «A falar» = actividade de voz real (nível/energia de áudio), não apenas o flag `mic_on`.
- Animação «em torno» = **aura** contínua enquanto fala, aplicada **igual** ao ícone de saída de áudio e ao de microfone; não exige equalizer de barras.
- Ícone de falante = **saída de áudio** (visual auscultadores/altifalante), distinto do mic; nesta entrega só estado «a ouvir», **sem deafen** (**clarificação 2026-09-06**).
- Detecção: **no cliente**, a partir do áudio já recebido (remotos) / captura local (eu); sem API nova de speaking; aura só para quem está **na chamada**.
- Não exige persistir histórico de quem falou; só estado ao vivo.
- Compatível com avatares 030: animação nos ícones de mic/falante, não obrigatoriamente no avatar (salvo se o desenho unificar — default = ícones pedidos).
