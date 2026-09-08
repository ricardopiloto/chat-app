# Implementation Plan: Painel de Notificações visível sobre o topbar

**Branch**: `066-topbar-notif-panel` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/066-topbar-notif-panel/spec.md`

**Depends on**: [062-message-mentions-replies](../062-message-mentions-replies/) (notif panel already in TopBar)

## Summary

Corrigir o painel `.topbar-notif-panel` que fica **cortado/escondido** porque `.topbar` usa `overflow: hidden` (cantos do chrome). Solução preferida: permitir overflow visível no eixo do dropdown (ex. `overflow: visible` no `.topbar`, ou só em `.topbar-actions` / `.topbar-notif`) mantendo o visual arredondado do painel; reforçar `z-index` se necessário. Sem mudanças de API, modelo de notificações ou TopBar.tsx para além do mínimo se CSS não bastar.

## Technical Context

**Language/Version**: CSS (+ TypeScript/Solid só se portal for necessário).

**Primary Dependencies**: `frontend/src/styles/mesa-theme.css` (`.topbar`, `.topbar-notif-panel`); `frontend/src/shell/TopBar.tsx` (markup existente).

**Storage**: N/A.

**Testing**: Manual [quickstart.md](./quickstart.md); `cd frontend && ./node_modules/.bin/tsc --noEmit`.

**Target Platform**: Browser (desktop + narrow viewport).

**Project Type**: Web UI chrome polish / bugfix.

**Performance Goals**: N/A (layout only).

**Constraints**: Não alterar semântica 062; não deixar overlay fantasma; não partir outros controlos do topbar; preferir CSS-only.

**Scale/Scope**: 1–2 ficheiros FE.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart visual + tsc |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Contrato UI + data-model layout + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/066-topbar-notif-panel/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── notif-panel-visibility.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/styles/mesa-theme.css   # overflow / stacking for topbar + notif panel
frontend/src/shell/TopBar.tsx        # only if portal/restructure needed (prefer avoid)
```

**Structure Decision**: CSS-first fix on existing TopBar markup. Portal/teleport only if overflow cannot be fixed without breaking topbar radius chrome.

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/notif-panel-visibility.md](./contracts/notif-panel-visibility.md)
- [quickstart.md](./quickstart.md)
