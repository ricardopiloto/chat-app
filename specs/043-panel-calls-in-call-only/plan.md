# Implementation Plan: Controlos de chamada no painel só em chamada

**Branch**: `043-panel-calls-in-call-only` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/043-panel-calls-in-call-only/spec.md`

## Summary

Confirmar e, se necessário, corrigir a regra do **UserPanel**: o grupo `.user-panel-calls` (mic, deafen, cam, sair) **só** existe no DOM quando há chamada activa (`voice.live()`) e o utilizador **não** está na mesa dessa chamada. Proibido o chrome idle `is-disabled` fora de chamada. A implementação de [042](../042-panel-call-stage-ui/) já aplica `showCallGroup = voice.live() && !onStage()`; esta feature é **verify + fix de regressão** (bundle stale, predicado, CSS residual).

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9; CSS `mesa-theme.css`.

**Primary Dependencies**: `UserPanel.tsx` (`Show` + `showCallGroup`); `useVoiceSession().live`; `viewingActiveVoiceStage(params.id, voice)`.

**Storage**: N/A.

**Testing**: `tsc --noEmit`; [quickstart.md](./quickstart.md) (inspecção DOM + fluxos join/leave/stage).

**Target Platform**: Browser SPA (shell autenticado).

**Project Type**: Web app — `frontend/` only.

**Performance Goals**: Toggle de visibilidade sem jank; sem contentor fantasma no layout quando `!live`.

**Constraints**: FR-001–005; não alterar hangup/PiP/API; manter sítio activo palco vs painel (039/042). Sem backend.

**Scale/Scope**: Um componente de painel; verificação + possível diff mínimo.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc |
| Complexity Tracking | Vazio (verify/fix) |

**Gate: PASS**

### Re-check pós-Phase 1

Diff esperado: zero ou predicado/`Show`/CSS residual em `UserPanel` + tema. Sem novos serviços. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/043-panel-calls-in-call-only/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── panel-calls-visibility.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/shell/UserPanel.tsx              # verify Show + showCallGroup; remove any is-disabled path
frontend/src/styles/mesa-theme.css            # remove leftover .user-panel-calls.is-disabled if present
frontend/src/voice/VoiceSession.tsx           # viewingActiveVoiceStage / live — only if predicado errado
```

**Structure Decision**: Preferir **sem alteração** se o código de 042 já cumprir o contrato; caso contrário, restaurar o predicado e garantir que `is-disabled` nunca volte a renderizar o grupo.

## Complexity Tracking

> Vazio — verify / regressão pontual.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
