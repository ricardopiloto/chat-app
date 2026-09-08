# Implementation Plan: Logo Mesa na topbar

**Branch**: `051-topbar-logo-image` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/051-topbar-logo-image/spec.md`

## Summary

Substituir o mark de cor sólido (`.topbar-mark`) pelo asset `imgs/logo.png` na topbar autenticada e no ecrã de auth, mantendo o texto «Mesa» e o nome acessível. Copiar o PNG para assets servidos pelo frontend.

## Technical Context

**Language/Version**: TypeScript / SolidJS; CSS em `mesa-theme.css`.

**Primary Dependencies**: `frontend/src/shell/TopBar.tsx`, `frontend/src/components/AuthShell.tsx`, `frontend/src/styles/mesa-theme.css`; Vite static assets (`frontend/public/` ou import).

**Storage**: Ficheiro de imagem estático (sem DB).

**Testing**: Manual [quickstart.md](./quickstart.md); `cd frontend && ./node_modules/.bin/tsc --noEmit`.

**Target Platform**: Desktop + narrow viewport shell Mesa.

**Project Type**: Web app — brand chrome.

**Performance Goals**: Logo otimizado o suficiente para topbar (~22–28px); evitar servir 1254×1254 sem resize no CSS (`object-fit` + width/height).

**Constraints**: Mesmo PNG claro/escuro; sem redesign da topbar; favicon fora de âmbito.

**Scale/Scope**: Copy asset + `<img>` (ou CSS background) no mark; estilos auth/topbar.

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

Asset estático + dois pontos de marca. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/051-topbar-logo-image/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── topbar-logo.md
└── spec.md
```

### Source Code (repository root)

```text
imgs/logo.png                           # source (repo root)
frontend/public/mesa-logo.png           # served asset (copy/optimize)
frontend/src/shell/TopBar.tsx           # <img> replaces empty .topbar-mark
frontend/src/components/AuthShell.tsx   # same mark
frontend/src/styles/mesa-theme.css      # size, radius, object-fit; drop solid bg mark
```

**Structure Decision**: Copy PNG into `frontend/public/` for stable URL `/mesa-logo.png`; replace `.topbar-mark` span with `<img class="topbar-mark" src="/mesa-logo.png" alt="" />` and keep adjacent «Mesa» text; brand container `aria-label="Mesa"` if needed.

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/topbar-logo.md](./contracts/topbar-logo.md)
- [quickstart.md](./quickstart.md)
