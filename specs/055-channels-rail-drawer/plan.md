# Implementation Plan: Drawer de canais atrás do Server Rail

**Branch**: `055-channels-rail-drawer` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/055-channels-rail-drawer/spec.md`

## Summary

Generalizar «Ocultar / Mostrar canais» para layouts desktop com rail+lista (**também fora do palco**). Lista fechada = drawer **atrás** do Server Rail com **faixa peek** na aresta direita do rail (hover enlarge; clique só **abre**). Abrir = **reflow** à coluna 238px. Fechar só pelo controlo no cabeçalho da sidebar. Preferência local preservada; drawer mobile intacto.

## Technical Context

**Language/Version**: TypeScript / SolidJS; CSS em `mesa-theme.css`.

**Primary Dependencies**: `frontend/src/shell/AppShell.tsx`, `Sidebar.tsx`, `ServerRail.tsx`, `preferences/uiPrefs.ts`, `mesa-theme.css` (`.shell-nav`, `.stage-mode`, `.sidebar-stage-expand`).

**Storage**: Preferência local existente (`mesa.stageChannelsExpanded` ou chave generalizada com migração de leitura — ver research).

**Testing**: [quickstart.md](./quickstart.md); `cd frontend && ./node_modules/.bin/tsc --noEmit`.

**Target Platform**: Desktop shell Mesa (rail+lista); narrow/mobile fora do novo padrão (FR-009).

**Project Type**: Web UI chrome / layout.

**Performance Goals**: Animações leves (transform/width); respeitar `prefers-reduced-motion`.

**Constraints**: Sem overlay que bloqueie o rail; faixa não tapa ícones de servidor; sem fecho por clique fora; CSS de tema permitido (feature de UI).

**Scale/Scope**: Shell chrome + prefs + toggle UI; sem backend.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart visual |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

UI contract + estado drawer + prefs. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/055-channels-rail-drawer/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── channels-rail-drawer.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/shell/AppShell.tsx          # classes shell; state open/closed; expose toggle beyond stage
frontend/src/shell/Sidebar.tsx           # header toggle always on desktop; peek strip interaction
frontend/src/shell/ServerRail.tsx        # stacking / peek host if needed
frontend/src/preferences/uiPrefs.ts      # channels list expanded pref (generalize)
frontend/src/styles/mesa-theme.css       # drawer closed/open, peek, enlarge, reduced-motion
```

**Structure Decision**: Keep `.shell-nav` grid (rail | sidebar). Closed: sidebar column collapses to peek width (~10px) with content clipped **under** rail (z-index); peek hit-target on rail’s trailing edge opens via `setChannelsExpanded(true)`. Open: `68px 238px` reflow. Decouple visibility of toggle from `stage-mode` only.

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/channels-rail-drawer.md](./contracts/channels-rail-drawer.md)
- [quickstart.md](./quickstart.md)
