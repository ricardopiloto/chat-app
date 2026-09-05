# Implementation Plan: Topbar, tema e editor de cena

**Branch**: `013-topbar-scene-ux` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-topbar-scene-ux/spec.md`

## Summary

Refinar a UX da topbar entregue na 012: **toggle de tema** de um clique com ícone = tema actual (sol/lua); **menu de conta** flutuante no chip (handle só leitura + Terminar sessão + diálogo de confirmação); **pesquisa** por ícone que expande para campo **inline** na topbar (sem modal Dialog); **remover** ícone/painel de Definições. Em paralelo, o **editor de cena** passa a layout full-pane como o Protótipo v2 (pré-visualização ampla + coluna ~296px). Frontend-only; backend intocado.

## Technical Context

**Language/Version**: TypeScript ~5.8 (SolidJS 1.9 SPA) — frontend apenas; backend Rust 2021 (Axum) não é tocado.

**Primary Dependencies**: `solid-js`, `@solidjs/router`, `theme/theme.ts` (preferência local), `SearchPanel` (lógica de pesquisa existente), `Dialog` (confirmação de logout), sistema de ícones SVG da 012. Novos ícones: `IconSun`, `IconMoon` (e opcionalmente reutilizar padrões de popover da notificação). Sem dependências npm novas.

**Storage**: Sem migração SQLite. Tema continua em `localStorage` (`mesa.theme`). Estado de pesquisa expandida / menu de conta / confirmação de logout: sinais SolidJS em memória.

**Testing**: `cd frontend && npx tsc --noEmit`; validação manual via [quickstart.md](./quickstart.md). Sem `cargo test`.

**Target Platform**: Browser desktop + narrow (<900px); temas claro/escuro existentes.

**Project Type**: Web app — mudanças em `frontend/`; `backend/` intocado (FR-011).

**Performance Goals**: Toggle de tema + troca de ícone ≤1 s (SC-001); pesquisa mantém debounce ~250 ms e ≥2 caracteres; expandir/recolher campo sem jank perceptível.

**Constraints**: Zero endpoints novos (FR-011); sem modal só para digitar pesquisa (FR-006); Definições removidas (FR-012); logout só após confirmação (FR-013); ícone tema = estado actual (FR-002); editor alinhado a `docs/design-ref/Mesa - Protótipo v2.dc.html` (grelha `1fr 296px`).

**Scale/Scope**: ~1 remoção (`SettingsPanel` + uso de `IconSettings`); ~2 ícones novos; refactor de `SearchPanel` (Dialog → inline); `AccountMenu` novo; CSS do `scene-editor`; ajustes pontuais em `TopBar.tsx` / `mesa-theme.css`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado (placeholders), como em 007–012.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A — constituição não ratificada |
| Test-first | N/A — convenção `tsc --noEmit` + quickstart |
| Complexity Tracking | Vazio — refinamentos de UI sobre APIs/estado já existentes |

**Gate: PASS**

### Re-check pós-Phase 1

Nenhum schema/endpoint novo; contratos cobrem topbar (tema/conta/pesquisa) e layout do editor sem estado persistido no servidor. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/013-topbar-scene-ux/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── topbar-account-theme.md
│   ├── inline-search.md
│   └── scene-editor-layout.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/
├── components/
│   ├── icons/
│   │   ├── IconSun.tsx              # NOVO
│   │   └── IconMoon.tsx             # NOVO
│   ├── AccountMenu.tsx              # NOVO — popover handle + Terminar sessão + ConfirmLogout
│   ├── SearchPanel.tsx              # ALTERAR — de Dialog modal → campo/resultados inline (controlado pela TopBar)
│   ├── SettingsPanel.tsx            # REMOVER (ou deixar de ser importado; ficheiro eliminado)
│   └── SceneEditor.tsx              # ALTERAR markup/classes para grelha full-pane
├── shell/
│   └── TopBar.tsx                   # toggle tema; AccountMenu; pesquisa expandível; sem Definições
└── styles/
    └── mesa-theme.css               # .topbar-search-expand, .account-menu, .scene-editor grelha 1fr 296px

backend/            # Intocado (FR-011)
```

**Structure Decision**: Frontend-only. Reutiliza `POST /api/auth/logout`, `theme.ts`, e a lógica de pesquisa client-side da 012; só muda *onde* e *como* a UI as apresenta.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md) — decisões: toggle tema, menu conta, pesquisa inline, remoção Definições, layout editor
- [data-model.md](./data-model.md) — estados UI client-side
- [contracts/](./contracts/) — topbar tema/conta, pesquisa inline, editor de cena
- [quickstart.md](./quickstart.md) — validação manual
