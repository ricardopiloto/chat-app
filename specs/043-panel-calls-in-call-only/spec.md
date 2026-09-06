# Feature Specification: Controlos de chamada no painel só em chamada

**Feature Branch**: `043-panel-calls-in-call-only`

**Created**: 2026-09-06

**Status**: Draft

**Input**: User description: "o botão de sair da chamada em … user-panel-calls is-disabled só deve aparecer se o usuário estiver em uma chamada de voz/vídeo."

**Depends on**: painel de utilizador ([039-floating-user-bar](../039-floating-user-bar/)); polish de visibilidade ([042-panel-call-stage-ui](../042-panel-call-stage-ui/)).

**Related**: [042](../042-panel-call-stage-ui/) já especifica e implementa ocultar o grupo fora de chamada; esta feature **confirma e reforça** o mesmo requisito de produto (sem chrome desabilitado) caso a UI ainda mostre `user-panel-calls is-disabled` fora de chamada.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sem chamada: sem controlos no painel (Priority: P1)

Como utilizador autenticado que **não** está em chamada de voz/vídeo, quero que o painel inferior **não** mostre microfone, ensurdecer, câmera nem sair (nem cinzentos/desabilitados), para não parecer que há uma chamada inactiva.

**Why this priority**: Pedido explícito; o estado `user-panel-calls is-disabled` fora de chamada é confuso e ocupa espaço.

**Independent Test**: Sessão sem voz → inspeccionar painel / DOM: ausência do grupo de controlos de chamada; nenhum botão «Sair da chamada» no painel.

**Acceptance Scenarios**:

1. **Given** não estou em nenhuma chamada de voz/vídeo, **When** olho o painel de utilizador no fundo da barra lateral, **Then** **não** vejo o grupo de controlos de chamada (incluindo sair) nem um contentor com aparência de controlos desabilitados.
2. **Given** a mesma situação, **When** inspecciono a interface (ou o DOM da área do painel), **Then** **não** existe o cromado equivalente a «controlos da chamada» desabilitados (ex. classe/estado `is-disabled` nesse grupo).

---

### User Story 2 - Em chamada fora da mesa: controlos visíveis (Priority: P1)

Como participante **em** chamada que abriu outro ecrã (ex. canal de texto), quero ver no painel os controlos de chamada (incluindo sair), para gerir a sessão sem voltar à mesa.

**Why this priority**: Completa a regra — ocultar só quando não há chamada; em chamada off-stage os controlos devem existir.

**Independent Test**: Entrar em voz → navegar para texto → grupo presente e utilizável; sair da chamada → grupo desaparece.

**Acceptance Scenarios**:

1. **Given** estou em chamada de voz/vídeo e **não** estou na vista da mesa dessa chamada, **When** olho o painel, **Then** o grupo de controlos (incl. sair) está **visível e utilizável** (não desabilitado).
2. **Given** encerro a chamada, **When** o estado deixa de ser «em chamada», **Then** o grupo desaparece de imediato do painel.

---

### User Story 3 - Na mesa da chamada: controlos no palco, não no painel (Priority: P2)

Como participante na **mesa** da chamada activa, quero que o painel **não** duplique o grupo de controlos (permanecem no palco), alinhado à regra de um sítio activo.

**Why this priority**: Consistência com 039/042; evita dois hangups activos.

**Independent Test**: Em chamada na mesa → painel sem grupo; call-controls do palco presentes.

**Acceptance Scenarios**:

1. **Given** estou em chamada e na vista da mesa dessa chamada, **When** olho o painel, **Then** o grupo de controlos de chamada do painel **não** aparece.

---

### Edge Cases

- Chamada activa noutro servidor com PiP: se a vista não é a mesa dessa chamada, o grupo no painel **pode** aparecer (está «em chamada»); se a especificação de 039/042 ocultar na mesa, manter essa regra.
- Transição rápida join/leave: nunca deixar o grupo desabilitado «fantasma» sem chamada.
- Recarregar a página sem sessão de voz: painel sem grupo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Fora de uma chamada de voz/vídeo activa, o painel de utilizador MUST NOT mostrar o grupo de controlos de chamada (microfone, ensurdecer, câmera, sair), incluindo estados desabilitados ou contentores vazios com esse propósito.
- **FR-002**: Em chamada activa e fora da vista da mesa dessa chamada, o painel MUST mostrar o grupo de controlos de chamada activo (incluindo sair).
- **FR-003**: Em chamada e na vista da mesa dessa chamada, o painel MUST NOT mostrar o grupo de controlos de chamada (sítio activo = palco).
- **FR-004**: A identidade / conta no painel MUST permanecer visível com ou sem chamada.
- **FR-005**: Se a implementação de [042](../042-panel-call-stage-ui/) já cumprir FR-001–003, esta feature MUST verificar o comportamento em runtime e corrigir qualquer regressão (ex. UI a servir bundle antigo ou predicado incorrecto).

### Key Entities

- **Grupo de controlos de chamada (painel)**: fila no painel inferior; só quando há chamada activa e não se está na mesa dessa chamada.
- **Chamada activa**: sessão de voz/vídeo em que o utilizador está ligado.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Em 10 verificações sem chamada, 10/10 vezes o grupo de controlos de chamada **não** está no painel (0 botões de mídia/sair nessa fila; sem estado «desabilitado» visível).
- **SC-002**: Em 10 sessões «em chamada + canal de texto», 10/10 vezes o grupo aparece e desaparece ao sair da chamada.
- **SC-003**: Utilizadores de teste deixam de reportar «botões de sair/mic cinzentos quando não estou em call».

## Assumptions

- «Chamada de voz/vídeo» = a mesma noção de sessão activa já usada pelo produto (painel / PiP).
- A regra «um sítio activo» (palco vs painel) de 039/042 mantém-se.
- Se o utilizador ainda vê `user-panel-calls is-disabled` após 042, trata-se de regressão, cache de frontend, ou predicado incorrecto — no âmbito de verificação/correção desta feature.
- Sem backend novo.
