# Implementation Plan: Painel de utilizador a atravessar a rail e borda do shell

**Branch**: `048-user-panel-span-rail` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/048-user-panel-span-rail/spec.md`

## Summary

Reestruturar a navegação esquerda para o **user-panel** ser um cartão contínuo na base (largura rail + sidebar), com a **server-rail** a terminar acima com `--shell-gutter`. Adicionar **borda fina** + `--radius-lg` no contorno exterior de **todo o chrome** (`.app`: topbar + shell [+ membros]).

## Technical Context

**Language/Version**: TypeScript / SolidJS; CSS em `mesa-theme.css` / tokens `nocturne.css`.

**Primary Dependencies**: `frontend/src/shell/Sidebar.tsx`, `UserPanel.tsx`, `ServerRail.tsx`, `AppShell.tsx`; `frontend/src/styles/mesa-theme.css`; tokens `--shell-gutter`, `--radius-lg`, `--color-divider`.

**Storage**: N/A (chrome only).

**Testing**: Manual [quickstart.md](./quickstart.md); `tsc --noEmit`.

**Target Platform**: Desktop shell Mesa (≥1280×720 primary).

**Project Type**: Web app — frontend chrome.

**Performance Goals**: Sem regressão perceptível de layout; sem reflow loops.

**Constraints**: Clarificações 2026-09-06 — cartão-base contínuo + gutter; borda em todo o chrome; cantos arredondados. Preservar 045 cards/gutters; stage + members.

**Scale/Scope**: Layout CSS + pequeno move de DOM do `UserPanel` para irmão de rail/sidebar.

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

DOM mínimo (`shell-nav` real + `UserPanel` sibling); CSS grid/flex; border em `.app`. Sem backend. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/048-user-panel-span-rail/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── chrome-span-border.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/shell/Sidebar.tsx      # shell-nav layout; UserPanel fora do .sidebar
frontend/src/shell/UserPanel.tsx    # sem mudança funcional (classe intacta)
frontend/src/shell/AppShell.tsx     # só se necessário para wrapper (preferir CSS em .app)
frontend/src/styles/mesa-theme.css  # .shell-nav grid; rail height; .app border+radius
frontend/src/styles/nocturne.css    # token opcional --shell-chrome-border se útil
```

**Structure Decision**: `.shell-nav` deixa de ser `display: contents` e passa a célula única da grelha `.shell` (colunas esquerda), com grelha interna `rail | sidebar` + row do `user-panel` full-span. Borda exterior em `.app`.

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/chrome-span-border.md](./contracts/chrome-span-border.md)
- [quickstart.md](./quickstart.md)
