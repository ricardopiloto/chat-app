# Implementation Plan: Controlos de chamada só no painel

**Branch**: `049-panel-only-call-controls` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/049-panel-only-call-controls/spec.md`

## Summary

Remover a barra `.call-controls` do palco (mesa de voz) e mostrar os controlos pessoais de chamada **sempre no painel** enquanto `voice.live()` — inclusive na mesa. Suspender a UI de **gravação de cena** (G1 → backlog). Religar E2EE / banner permanecem.

## Technical Context

**Language/Version**: TypeScript / SolidJS (frontend).

**Primary Dependencies**: `frontend/src/shell/UserPanel.tsx` (`showCallGroup`); `frontend/src/pages/VoiceChannel.tsx` (`.call-controls`, Gravar/Parar, diálogo); `useVoiceSession` / `viewingActiveVoiceStage`; CSS `.call-controls` em `mesa-theme.css`.

**Storage**: N/A (UI only; APIs egress/E2EE no backend **não** removidas).

**Testing**: Manual [quickstart.md](./quickstart.md); `cd frontend && ./node_modules/.bin/tsc --noEmit`.

**Target Platform**: Desktop shell Mesa (stage + panel).

**Project Type**: Web app — frontend voice chrome.

**Performance Goals**: Sem regressão; palco ganha altura da barra removida.

**Constraints**: Clarificação 2026-09-06 — gravação UI off (backlog G1). Supersede 042/043 «ocultar painel na mesa». Não duplicar mic/sair no palco.

**Scale/Scope**: Predicado de visibilidade no painel + remoção de bloco JSX (+ limpeza de código morto de Gravar); sem migração DB.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Validação visual quickstart |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Mudança mínima: predicado `showCallGroup = voice.live()`; remover markup/handlers de call-controls + Gravar na mesa; contrato de visibilidade actualizado. Backend intacto. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/049-panel-only-call-controls/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── panel-only-call-controls.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/shell/UserPanel.tsx       # showCallGroup: live only (drop !onStage)
frontend/src/pages/VoiceChannel.tsx    # remove .call-controls + Gravar UI/dialog/handlers
frontend/src/styles/mesa-theme.css     # optional: leave or trim unused .call-controls rules
frontend/src/voice/VoiceSession.tsx    # viewingActiveVoiceStage may stay for other callers
docs/backlog-prototype-v2-gaps.md      # G1 already marked backlog (clarify)
```

**Structure Decision**: Frontend-only. Single visibility predicate in `UserPanel`; stage ceases to host personal call chrome and recording entry points. E2EE banner + Religar stay in `VoiceChannel`.

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/panel-only-call-controls.md](./contracts/panel-only-call-controls.md)
- [quickstart.md](./quickstart.md)
