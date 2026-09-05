---
description: "Task list for Topbar, tema e editor de cena"
---

# Tasks: Topbar, tema e editor de cena

**Input**: Design documents from `/specs/013-topbar-scene-ux/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD pedido na spec. Validação: `npx tsc --noEmit` + manual [quickstart.md](./quickstart.md). Sem alterações Rust — `backend/` intocado (FR-011).

**Organization**: Setup (CSS scaffolding) → Foundational (ícones sol/lua + remoção Definições) → US1 tema (P1, MVP) → US2 menu conta (P1) → US3 pesquisa inline (P1) → US4 editor cena (P2) → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3], [US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/components/icons/`, `frontend/src/components/`, `frontend/src/shell/`, `frontend/src/styles/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Classes CSS base para topbar expandível, menu de conta e editor full-pane, per contratos.

- [X] T001 [P] Add CSS scaffolding for `.topbar-search-expand`, `.topbar-search-field`, `.topbar-search-results` in `frontend/src/styles/mesa-theme.css` per [contracts/inline-search.md](./contracts/inline-search.md)
- [X] T002 [P] Add CSS scaffolding for `.account-menu` / `.account-menu-panel` (popover ancorado ao chip) in `frontend/src/styles/mesa-theme.css` per [contracts/topbar-account-theme.md](./contracts/topbar-account-theme.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ícones de tema e remoção do painel de Definições (012) — **bloqueia US1–US3**.

**⚠️ CRITICAL**: User stories MUST wait for this phase.

- [X] T003 [P] Implement `IconSun` in `frontend/src/components/icons/IconSun.tsx` using shared `Icon.tsx` props (`size`, `title`, `class`)
- [X] T004 [P] Implement `IconMoon` in `frontend/src/components/icons/IconMoon.tsx` using shared `Icon.tsx` props
- [X] T005 Remove `SettingsPanel` usage from `frontend/src/shell/TopBar.tsx` (ícone Definições + estado `settingsOpen`); delete `frontend/src/components/SettingsPanel.tsx`; remove `IconSettings` import; se `IconSettings.tsx` ficar órfão, apagar `frontend/src/components/icons/IconSettings.tsx` (FR-012)

**Checkpoint**: Sem Definições na topbar; `IconSun`/`IconMoon` existem; `tsc` limpo após remoção. Chip pode ficar sem menu até US2.

---

## Phase 3: User Story 1 - Alternar tema com um clique e ícone claro (Priority: P1) 🎯 MVP

**Goal**: Toggle único na topbar; ícone = tema **actual** (sol claro / lua escuro); persistência via `theme/theme.ts`.

**Independent Test**: [quickstart.md](./quickstart.md) §1 — clicar toggle → tema + ícone mudam; F5 mantém preferência.

### Implementation for User Story 1

- [X] T006 [US1] Add theme toggle button to `frontend/src/shell/TopBar.tsx`: estado local a partir de `resolveTheme()`; clique chama `writeTheme` + `applyTheme` alternando `light`/`dark`; renderiza `IconSun` ou `IconMoon` conforme tema actual; `aria-label` reflecte estado actual per [contracts/topbar-account-theme.md](./contracts/topbar-account-theme.md)
- [X] T007 [US1] Style `.topbar-icon-btn` theme toggle (se necessário) in `frontend/src/styles/mesa-theme.css` para alinhamento com outros ícones da topbar

**Checkpoint**: [quickstart.md](./quickstart.md) §1 passa; sem `theme-seg` Escuro/Claro.

---

## Phase 4: User Story 2 - Terminar sessão a partir do nome do utilizador (Priority: P1)

**Goal**: Clique no chip abre menu flutuante com handle só leitura + Terminar sessão; confirmação via Dialog antes de `onLogout`.

**Independent Test**: [quickstart.md](./quickstart.md) §2–3.

### Implementation for User Story 2

- [X] T008 [P] [US2] Create `frontend/src/components/AccountMenu.tsx`: props `open`, `onClose`, `me: Account`, `onLogout`; painel com handle só leitura + item «Terminar sessão»; Escape/clique fora fecha sem logout; ao escolher logout abre confirmação (`Dialog`) e só confirma chama `onLogout` per [contracts/topbar-account-theme.md](./contracts/topbar-account-theme.md) e [data-model.md](./data-model.md)
- [X] T009 [US2] Wire `user-chip` in `frontend/src/shell/TopBar.tsx` to open/close `AccountMenu` (T008); `aria-expanded` / labels adequados; aplicar classes de T002
- [X] T010 [US2] Ensure logout confirmation copy and cancel path in `AccountMenu.tsx` (ou Dialog dedicado) — cancelar mantém sessão; confirmar encerra (FR-013)

**Checkpoint**: [quickstart.md](./quickstart.md) §2–3 passam.

---

## Phase 5: User Story 3 - Pesquisar no próprio campo da topbar (Priority: P1)

**Goal**: Ícone → campo **inline** na topbar; resultados anexados; **sem** Dialog modal só para digitar; algoritmo 012 intacto.

**Independent Test**: [quickstart.md](./quickstart.md) §4.

### Implementation for User Story 3

- [X] T011 [US3] Refactor `frontend/src/components/SearchPanel.tsx`: remover contentor `Dialog` para digitação; aceitar props de expansão (`expanded`/`onCollapse` ou equivalente); renderizar `<input>` + lista de resultados para montagem inline; manter `runSearch` (≥2 chars, debounce 250 ms, âmbito servidores) per [contracts/inline-search.md](./contracts/inline-search.md)
- [X] T012 [US3] Rework search UX in `frontend/src/shell/TopBar.tsx`: em repouso `IconSearch`; clique expande campo (classes T001), foca input; Escape/fora recolhe e limpa; montar resultados anexados; navegação ao escolher hit inalterada em espírito
- [X] T013 [US3] Polish expand/collapse CSS (largura, foco, popover de resultados) in `frontend/src/styles/mesa-theme.css` for narrow topbar

**Checkpoint**: [quickstart.md](./quickstart.md) §4 passa — sem modal de pesquisa para digitar.

---

## Phase 6: User Story 4 - Editor de cena a ocupar o ecrã como no protótipo (Priority: P2)

**Goal**: Layout full-pane: toolbar + corpo `1fr` / `296px` (stack em narrow), per Protótipo v2.

**Independent Test**: [quickstart.md](./quickstart.md) §5.

### Implementation for User Story 4

- [X] T014 [US4] Restructure markup in `frontend/src/components/SceneEditor.tsx`: toolbar + `scene-editor-body` wrapping `editor-stage` e `scene-editor-side` (deixar de empilhar stage/side como cartão solto)
- [X] T015 [US4] Update `.scene-editor` / `.scene-editor-body` / `.editor-stage` / `.scene-editor-side` in `frontend/src/styles/mesa-theme.css` to `flex:1; min-height:0` chain and `grid-template-columns: 1fr 296px` on desktop; stack + scroll below ~900px per [contracts/scene-editor-layout.md](./contracts/scene-editor-layout.md)
- [X] T016 [US4] Verify parent fill in `frontend/src/pages/VoiceChannel.tsx` (contentor do modo editar) so SceneEditor can grow to panel height without centered card margins

**Checkpoint**: [quickstart.md](./quickstart.md) §5 passa em ≥1200px e em viewport estreito.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validação transversal.

- [X] T017 [P] Run `cd frontend && npx tsc --noEmit` e corrigir erros de tipo
- [X] T018 Execute manual scenarios in [quickstart.md](./quickstart.md) (§1–§6) e corrigir lacunas
- [X] T019 [P] Confirm no remaining imports of `SettingsPanel` / `IconSettings` via repo search; greps limpos
- [X] T020 Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` only after implement succeeds (nota para `/speckit-implement`; skip se só tasks)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001–T002)**: sem deps
- **Foundational (T003–T005)**: após Setup (CSS opcional em paralelo com ícones)
- **US1 (T006–T007)**: após T003–T005
- **US2 (T008–T010)**: após Foundational; ideal após US1 (mesma TopBar)
- **US3 (T011–T013)**: após Foundational; pode seguir US1/US2 (TopBar)
- **US4 (T014–T016)**: independente de US1–US3 após Setup CSS; pode paralelizar com topbar se ficheiros distintos
- **Polish**: após stories pretendidas

### User Story Dependencies

```text
Foundational (icons + remove Settings)
    ├── US1 Tema (MVP)
    ├── US2 Menu conta
    ├── US3 Pesquisa inline
    └── US4 Editor (pode paralelizar com topbar stories)
```

### Parallel Opportunities

- T001 ‖ T002; T003 ‖ T004
- T008 pode começar em ficheiro novo enquanto US1 edita TopBar (merge cuidadoso)
- US4 (SceneEditor + CSS) ‖ US1–US3 se ninguém tocar nos mesmos blocos CSS sem coordenação

### Independent Test Criteria

| Story | Test |
|-------|------|
| US1 | quickstart §1 |
| US2 | quickstart §2–3 |
| US3 | quickstart §4 |
| US4 | quickstart §5 |

### Suggested MVP

**US1 apenas** (toggle tema + remoção Definições já na foundational) — entrega valor imediato; depois US2 → US3 → US4.

---

## Implementation Strategy

1. Completar Foundational (ícones + apagar Definições).
2. Entregar US1 e validar §1.
3. US2 (logout seguro) → US3 (pesquisa) → US4 (editor).
4. Polish: `tsc` + quickstart completo.

**Format validation**: All tasks use `- [ ]`, Task IDs T001–T020, `[P]`/`[USn]` where required, and include file paths.
