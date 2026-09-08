---
description: "Task list for Painel de utilizador a atravessar a rail e borda do shell"
---

# Tasks: Painel de utilizador a atravessar a rail e borda do shell

**Input**: Design documents from `/specs/048-user-panel-span-rail/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/chrome-span-border.md](./contracts/chrome-span-border.md), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal. Validação: [quickstart.md](./quickstart.md) + `cd frontend && ./node_modules/.bin/tsc --noEmit`.

**Organization**: Setup → Foundational (shell-nav real + move UserPanel) → US1 cartão contínuo → US2 rail encurtada → US3 borda chrome → Polish (stage/members/docs).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/shell/Sidebar.tsx`, `frontend/src/styles/mesa-theme.css`, `frontend/src/styles/nocturne.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar alvo Speckit e baseline DOM/CSS.

- [X] T001 Confirm `.specify/feature.json` points at `specs/048-user-panel-span-rail` and skim `.shell-nav` (`display: contents`), `.shell` columns, and `UserPanel` nesting in `frontend/src/shell/Sidebar.tsx` + `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Baseline understood; feature dir correcto.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DOM + grelha que permitem o cartão-base — **bloqueia** US1–US3.

**⚠️ CRITICAL**: Não estilizar borda exterior nem afirmar US1 até `UserPanel` ser irmão de rail/sidebar e `.shell-nav` deixar de ser `contents`.

- [X] T002 In `frontend/src/shell/Sidebar.tsx`, move `<UserPanel …>` out of `aside.sidebar` to a direct child of `.shell-nav` (sibling after `ServerRail` and `aside.sidebar`) per [research.md](./research.md) R1 / [contracts/chrome-span-border.md](./contracts/chrome-span-border.md)
- [X] T003 Replace `.shell-nav { display: contents }` with a real CSS grid (`grid-template-columns` rail+sidebar widths; `grid-template-rows: minmax(0,1fr) auto`; `gap: var(--shell-gutter)`) in `frontend/src/styles/mesa-theme.css` per R1
- [X] T004 Update `.shell` / `.shell.members-open` / stage column templates in `frontend/src/styles/mesa-theme.css` so the left track is the single `.shell-nav` (`auto 1fr` [+ members]) per [research.md](./research.md) R2; fix any narrow/drawer rules that assumed `display: contents`

**Checkpoint**: Layout compiles; panel may already span but polish in US1–US2; rail/sidebar still usable.

---

## Phase 3: User Story 1 - Painel de utilizador de ponta a ponta (Priority: P1) 🎯 MVP

**Goal**: Um único cartão `.user-panel` contínuo na base (largura rail + canais), controlos intactos.

**Independent Test**: [quickstart.md](./quickstart.md) A (+ C se em chamada).

### Implementation for User Story 1

- [X] T005 [US1] Place `.user-panel` on shell-nav row 2 spanning all columns (`grid-column: 1 / -1`) and keep `--radius-lg` card styling in `frontend/src/styles/mesa-theme.css` per FR-001 / SC-001
- [X] T006 [US1] Ensure `.sidebar` stack (header + nav only) no longer reserves bottom space for a nested panel; `margin-top: auto` / flex quirks cleaned in `frontend/src/styles/mesa-theme.css`
- [X] T007 [US1] Spot-check call controls layout in wide panel (no horizontal scroll required) via `frontend/src/shell/UserPanel.tsx` + CSS in `mesa-theme.css` (FR-003 / SC-003); adjust flex/min-width only if needed

**Checkpoint**: MVP — continuous base card; controls usable.

---

## Phase 4: User Story 2 - Rail encurtada verticalmente (Priority: P1)

**Goal**: Rail só na row 1; scroll sem ícones sob o painel; gutter entre rail e painel.

**Independent Test**: [quickstart.md](./quickstart.md) A/B.

### Implementation for User Story 2

- [X] T008 [US2] Constrain `.server-rail` to nav row 1 (`min-height: 0`, list `overflow-y: auto`) so it cannot grow beside the panel in `frontend/src/styles/mesa-theme.css` per FR-002 / SC-002
- [X] T009 [US2] Verify `--shell-gutter` gap between rail bottom and panel top is visible (no zero-gap overrides) in `frontend/src/styles/mesa-theme.css` per clarificação / SC-001

**Checkpoint**: Rail ends above panel; scroll safe.

---

## Phase 5: User Story 3 - Borda fina no chrome completo (Priority: P2)

**Goal**: Contorno 1px + `--radius-lg` em `.app` (topbar + shell [+ membros]).

**Independent Test**: [quickstart.md](./quickstart.md) D.

### Implementation for User Story 3

- [X] T010 [US3] Add `border: 1px solid var(--color-divider)` (or equivalent) and `border-radius: var(--radius-lg)` on `.app` in `frontend/src/styles/mesa-theme.css` per R4 / FR-004 / FR-005; avoid glow/box-shadow
- [X] T011 [P] [US3] Confirm light theme divider contrast remains legible (no theme override that removes the border) in `frontend/src/styles/mesa-theme.css` / `nocturne.css` per SC-004

**Checkpoint**: Outer rounded frame around full chrome.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Stage/members, types, docs de entrega.

- [X] T012 Adjust stage-mode / stage-channels-expanded **internal** nav column widths on `.shell-nav` (not parent `display: contents` paths) in `frontend/src/styles/mesa-theme.css` so panel stays full-span (FR-006 / quickstart E)
- [X] T013 [P] Verify members-open: outer `.app` border still encloses members column; left nav geometry unchanged in `frontend/src/styles/mesa-theme.css` (SC-005)
- [X] T014 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and smoke [quickstart.md](./quickstart.md) A–E
- [X] T015 After successful implement: append `docs/daily/yyyy-mm-dd.md` Speckit section and `[Unreleased]` in `CHANGELOG.md` for `048-user-panel-span-rail`

**Checkpoint**: Stage + members OK; docs updated.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: None
- **Foundational (Phase 2)**: Depends on Setup — **BLOCKS** US1–US3
- **US1 (Phase 3)**: After Foundational — MVP span card
- **US2 (Phase 4)**: After Foundational; usually after T005 grid placement
- **US3 (Phase 5)**: After Foundational; can parallel with US1/US2 (different CSS concerns on `.app`)
- **Polish (Phase 6)**: After desired stories

### User Story Dependencies

- **US1**: Needs T002–T004 (DOM + nav grid)
- **US2**: Needs same foundation; validates rail row constraint
- **US3**: Mostly independent CSS on `.app` once chrome still mounts

### Parallel Opportunities

- T010 ‖ T005 after foundational (`.app` border vs panel span)
- T011 ‖ T013 (theme / members checks)
- T012 after T003–T004 (stage column rules)

---

## Parallel Example: After Foundational

```bash
Task: "T005 [US1] user-panel grid-column span in mesa-theme.css"
Task: "T010 [US3] .app border + radius-lg in mesa-theme.css"
```

---

## Implementation Strategy

**MVP First (User Story 1)**

1. Phase 1–2 (move panel + real shell-nav)
2. Phase 3 US1 (span card)
3. **STOP**: quickstart A

### Incremental Delivery

1. + US2 → rail height / scroll
2. + US3 → outer border
3. + Polish → stage/members + daily/CHANGELOG

---

## Notes

- Prefer CSS + one DOM move in `Sidebar.tsx`; avoid `AppShell.tsx` unless drawer forces it
- Do not reintroduce `display: contents` on `.shell-nav`
- Preserve 045 card radii/gutters on header/nav/rail/panel
- Format: all tasks use `- [ ]`, Task ID, optional `[P]` / `[Story]`, and file paths
