# Implementation Plan: Painel de chamada e espaço do palco

**Branch**: `042-panel-call-stage-ui` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/042-panel-call-stage-ui/spec.md`

## Summary

Ajustar o **UserPanel** (039): o grupo de controlos de chamada só aparece quando `voice.live()` e fora da mesa (ocultar o estado `is-disabled` fora de chamada). Uniformizar o tamanho visual dos ícones mic/deafen/cam/sair no painel usando o **microfone do painel como base** (não o palco). Na mesa, ganhar ~40–80px de altura útil no `.stage` ao compactar margens do palco e chrome do cabeçalho/linha de privacidade.

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9; CSS `mesa-theme.css`.

**Primary Dependencies**: `UserPanel.tsx` (`showCallGroup` / `callEnabled`); `VoiceSession.live` + `viewingActiveVoiceStage`; ícones filled/stroke do painel; estilos `.stage`, `.voice-pane .pane-header`, `.privacy-line`.

**Storage**: N/A.

**Testing**: `tsc --noEmit`; [quickstart.md](./quickstart.md) manual.

**Target Platform**: Browser SPA (shell autenticado).

**Project Type**: Web app — `frontend/` only.

**Performance Goals**: Toggle de visibilidade do grupo sem jank; layout do palco reflow imediato em stage-mode.

**Constraints**: FR-001–008 + clarificações (ocultar idle; ícones = base mic painel; ~40–80px via margens+header/privacy). Não hangup/PiP/API. Manter sítio activo palco vs painel (039).

**Scale/Scope**: Um painel + uma vista de mesa; polish UI.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Diff FE localizado: predicado `Show`, CSS ícones, CSS stage/header. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/042-panel-call-stage-ui/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── user-panel-call-visibility.md
│   └── stage-vertical-space.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/shell/UserPanel.tsx          # showCallGroup = inCall && !onStage; drop disabled chrome
frontend/src/styles/mesa-theme.css        # ícones painel; .stage / pane-header / privacy-line
frontend/src/components/icons/…           # só se stroke vs filled causar drift visual (opcional)
```

**Structure Decision**: Predicado de visibilidade no `UserPanel`; uniformidade via `size` partilhado + CSS hit-box; altura do palco só CSS (sem mudar lógica LiveKit).

## Complexity Tracking

> Vazio — polish UI.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
