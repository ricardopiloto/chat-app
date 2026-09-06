# Research: 043-panel-calls-in-call-only

**Date**: 2026-09-06  
**Spec**: [spec.md](./spec.md)

## R1 — Estado actual do código (042)

**Decision**: Tratar 043 como **verify-first**. Em `UserPanel.tsx` (pós-042):

- `showCallGroup = () => voice.live() && !onStage()`
- Grupo envolvido em `<Show when={showCallGroup()}>`
- Sem ramo `is-disabled` no TSX
- Grep em `frontend/`: sem `.is-disabled` ligado a `user-panel-calls`

**Rationale**: O relatório de DOM com `user-panel-calls is-disabled` corresponde ao comportamento **pré-042** (grupo sempre montado, desabilitado fora de chamada). Bundle HMR/cache ou tab antiga explica o sintoma sem regressão no source.

**Alternatives considered**: Reimplementar do zero (rejeitado — duplicaria 042); só documentação sem quickstart (rejeitado — FR-005 exige verificação runtime).

## R2 — Predicado «em chamada» e «na mesa»

**Decision**: Reutilizar exactamente:

| Conceito | Fonte |
|----------|--------|
| Em chamada | `voice.live()` |
| Na mesa da chamada activa | `viewingActiveVoiceStage(routeChannelId, voice)` → `live && channelId === route id` |

Grupo no painel: `live && !viewingActiveVoiceStage`.

**Rationale**: Alinhado a 039/042; evita dois hangups; PiP off-stage continua a coexistir com controlos no painel.

**Alternatives considered**: Ocultar o grupo sempre que PiP visível (rejeitado — spec permite controlos off-stage); usar só `channelId` sem `live` (inseguro).

## R3 — Chrome desabilitado

**Decision**: **MUST NOT** renderizar o grupo (nem contentor vazio) quando `!live`. Não restaurar classe `is-disabled` para «placeholder» de layout.

**Rationale**: Pedido explícito do utilizador; SC-001 / FR-001.

**Alternatives considered**: Grupo desabilitado para reserva de altura (rejeitado em 042 e nesta spec).

## R4 — Escopo de implementação

**Decision**:

1. Correr [quickstart.md](./quickstart.md) (hard refresh).
2. Se source + runtime cumprem contrato → diff mínimo ou só confirmação em tasks/changelog notes.
3. Se runtime falha com source correcto → troubleshooting frontend (rebuild/dev server).
4. Se source divergiu → restaurar predicado e eliminar qualquer path `is-disabled`.

**Rationale**: FR-005; YAGNI.

## R5 — Constitution / unknowns

Nenhum **NEEDS CLARIFICATION** no Technical Context. Constitution = template; gates N/A.
