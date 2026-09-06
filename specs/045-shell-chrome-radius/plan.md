# Implementation Plan: Cantos arredondados no chrome da shell

**Branch**: `045-shell-chrome-radius` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/045-shell-chrome-radius/spec.md`

## Summary

Tornar **visíveis** os cantos das grandes superfícies da shell autenticada (follow-up a 044): topbar inset, server-rail, **três cartões** sidebar (header / nav / user-panel), e pane/`home-empty`, com **gutters subtis e uniformes** para o raio não ser clipado. Reutilizar `--radius-lg` (044) nas superfícies de chrome; sem sombras elaboradas; sem reabrir mapeamento de botões.

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9; CSS (`nocturne.css` + `mesa-theme.css`).

**Primary Dependencies**: Layout actual em `AppShell` (`.app` → `.topbar` + `.shell` grid); `display: contents` em `.shell-nav`; tokens `--radius-*` de 044.

**Storage**: N/A

**Testing**: `npx tsc --noEmit`; checklist visual [quickstart.md](./quickstart.md) (desktop + stage + drawer; claro/escuro).

**Target Platform**: Browser moderno (shell Mesa).

**Project Type**: Web app — só `frontend/` (CSS; markup só se gap exigir wrapper mínimo).

**Performance Goals**: Só CSS estático; sem custo runtime.

**Constraints**: Clarificações 2026-09-06 — 3 cartões sidebar; gutters subtis; topbar inset alinhada às colunas; FR-006 stage/drawer; Out of Scope sombras Discord-nitro e reabrir 044.

**Scale/Scope**: Chrome autenticado: topbar, rail, sidebar×3, pane; ajustes stage/drawer/media queries existentes.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart visual + tsc |
| Complexity Tracking | Vazio (layout CSS) |

**Gate: PASS**

### Re-check pós-Phase 1

Design: token de gutter + regras de cartão no tema + contrato UI. Sem BE. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/045-shell-chrome-radius/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── shell-chrome-cards.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/styles/nocturne.css      # --shell-gutter (+ opcional alias)
frontend/src/styles/mesa-theme.css    # .app padding/gap; .topbar; .shell gap;
                                      # .server-rail; .sidebar + 3 cards; .pane / .home-empty;
                                      # stage + drawer overrides
frontend/src/shell/AppShell.tsx       # só se markup exigir (preferir CSS-only)
frontend/src/shell/Sidebar.tsx        # só se estrutura DOM impedir 3 cartões (evitar se possível)
```

**Structure Decision**: Preferir **CSS-only** sobre o DOM actual. Se `.sidebar` for o flex pai, aplicar gap + card styles a `.sidebar-header`, `.sidebar-nav`, `.user-panel` e retirar fundo/borda full-bleed do pai. Topbar inset via padding do `.app` + radius no `.topbar` (alinhamento óptico com colunas que também usam o mesmo gutter).

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/shell-chrome-cards.md](./contracts/shell-chrome-cards.md)
- [quickstart.md](./quickstart.md)
