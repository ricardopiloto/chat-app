---
description: "Task list for cantos arredondados no chrome da shell"
---

# Tasks: Cantos arredondados no chrome da shell

**Input**: Design documents from `/specs/045-shell-chrome-radius/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/shell-chrome-cards.md](./contracts/shell-chrome-cards.md), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal. Validação: `cd frontend && npx tsc --noEmit` + checklist [quickstart.md](./quickstart.md).

**Organization**: Setup (baseline layout) → Foundational (`--shell-gutter` + `.app` inset) → US1 (6 cartões) → US2 (gutters uniformes / remove borders) → US3 (stage/drawer) → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/styles/nocturne.css`, `frontend/src/styles/mesa-theme.css`  
(Prefer CSS-only; touch `AppShell.tsx` / `Sidebar.tsx` only if DOM blocks three sidebar cards.)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar estrutura DOM/CSS actual antes de gutters.

- [x] T001 Document current `.app` / `.topbar` / `.shell` / `.shell-nav` / `.sidebar` layout notes from `frontend/src/styles/mesa-theme.css` and `frontend/src/shell/AppShell.tsx` (grid columns, `display: contents`, full-bleed borders) for regression comparison
- [x] T002 [P] Confirm `--radius-lg` is `22px` in `frontend/src/styles/nocturne.css` (044) and will be reused for chrome cards per [contracts/shell-chrome-cards.md](./contracts/shell-chrome-cards.md)

**Checkpoint**: Baseline chrome structure understood; radius-lg ready.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Token de gutter + moldura inset do `.app` — **blocks** all stories.

**⚠️ CRITICAL**: Do not style individual cards until `--shell-gutter` and `.app` padding exist.

- [x] T003 Add `--shell-gutter: 8px` next to radius tokens in `frontend/src/styles/nocturne.css` per [research.md](./research.md) R1
- [x] T004 Apply `.app` padding (and flex/gap so topbar ↔ `.shell` use `var(--shell-gutter)`) in `frontend/src/styles/mesa-theme.css` so content shares horizontal inset (FR-010 foundation)
- [x] T005 Set `.shell { gap: var(--shell-gutter); }` (and preserve members-open / stage grid variants absorbing gap via `1fr`) in `frontend/src/styles/mesa-theme.css` per [research.md](./research.md) R6

**Checkpoint**: Shell shows subtle outer inset and column gaps; cards still may look flush inside sidebar.

---

## Phase 3: User Story 1 — Chrome principal com cantos visíveis (Priority: P1) 🎯 MVP

**Goal**: Seis superfícies de chrome como cartões com `--radius-lg` e fundo distinto do `--color-bg`.

**Independent Test**: Desktop autenticado — topbar, rail, header, nav, user-panel, pane/home-empty todos com cantos redondos visíveis.

### Implementation for User Story 1

- [x] T006 [US1] Style `.topbar` as inset chrome card (`border-radius: var(--radius-lg)`, surface bg, no full-bleed to viewport edges) in `frontend/src/styles/mesa-theme.css` per FR-010 / R3
- [x] T007 [US1] Style `.server-rail` as card (`border-radius: var(--radius-lg)`, `overflow: hidden`; drop `border-right` in favor of shell gap) in `frontend/src/styles/mesa-theme.css` per R5
- [x] T008 [US1] Convert `.sidebar` to transparent stack (`gap: var(--shell-gutter)`; remove full-bleed column bg / `border-right`) in `frontend/src/styles/mesa-theme.css` per R4 / FR-008
- [x] T009 [US1] Style `.sidebar-header` / `.sidebar-header-static` as card (`var(--radius-lg)`, surface bg; remove bottom divider that fakes a single column) in `frontend/src/styles/mesa-theme.css`
- [x] T010 [US1] Style `.sidebar-nav` as card (`var(--radius-lg)`, surface bg, `overflow: auto/hidden` aligned to card) in `frontend/src/styles/mesa-theme.css`
- [x] T011 [US1] Style `.user-panel` as card (`var(--radius-lg)`, surface bg; remove `border-top` separator replaced by stack gap) in `frontend/src/styles/mesa-theme.css`
- [x] T012 [US1] Style `.pane` / `.home-empty` (main pane) as card with `var(--radius-lg)` and distinct surface in `frontend/src/styles/mesa-theme.css` per R5 / SC-001

**Checkpoint**: MVP — six chrome regions read as rounded cards on desktop dark theme.

---

## Phase 4: User Story 2 — Cantos não cortados pelo layout (Priority: P1)

**Goal**: Gutters subtis uniformes; nenhum raio “fantasma” por colagem; sem sombras elaboradas.

**Independent Test**: Junções rail↔sidebar↔pane, topbar↔shell, header↔nav↔user-panel mostram folga subtil e cantos legíveis em claro e escuro.

### Implementation for User Story 2

- [x] T013 [US2] Audit and remove residual flush dividers (`border-right` / `border-top` / `border-bottom`) between chrome cards in `frontend/src/styles/mesa-theme.css` that defeat gutters (FR-003 / contract Gutters)
- [x] T014 [US2] Verify light theme: same `--shell-gutter` / radii (no theme-specific gutter overrides) in `frontend/src/styles/mesa-theme.css` / `nocturne.css` (FR-004 / SC-003)
- [x] T015 [US2] Spot-check no new elaborate `box-shadow` on chrome cards in `frontend/src/styles/mesa-theme.css` (Out of Scope); separation via bg contrast only (R8)

**Checkpoint**: Gutters read subtle/uniform; corners visible in light + dark.

---

## Phase 5: User Story 3 — Stage / drawer sem regressão (Priority: P2)

**Goal**: Stage collapse/expand e drawer narrow mantêm cartões utilizáveis sem clip grave.

**Independent Test**: Voice stage + viewport &lt; 900px drawer — FR-006 / SC-004.

### Implementation for User Story 3

- [x] T016 [US3] Adjust `.shell.stage-mode` / stage-channels-expanded rules in `frontend/src/styles/mesa-theme.css` so collapsed/expanded sidebar still respects card + gutter (expand strip may share card styling) per R7
- [x] T017 [US3] Adjust narrow/drawer media-query rules for `.shell-nav` / `.sidebar` / `.pane` in `frontend/src/styles/mesa-theme.css` so cards remain coherent without cutting labels (FR-006)
- [x] T018 [P] [US3] Optionally apply `var(--radius-lg)` + gutter coherence to members panel chrome beside pane in `frontend/src/styles/mesa-theme.css` (R7; not SC-001 but avoids sharp adjacent panel)

**Checkpoint**: Stage + drawer smoke pass without layout breakage.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação e docs de entrega.

- [x] T019 Confirm CSS-only sufficiency; only if three sidebar cards impossible, minimal markup tweak in `frontend/src/shell/Sidebar.tsx` / `AppShell.tsx` (document why)
- [x] T020 [P] Run `cd frontend && npx tsc --noEmit`
- [x] T021 Execute [quickstart.md](./quickstart.md) checklist (6 cards, gutters, light/dark, stage, drawer)
- [x] T022 [P] Update `docs/daily/2026-09-06.md` with Speckit implement subsection for [045-shell-chrome-radius](./spec.md)
- [x] T023 [P] Update `CHANGELOG.md` `[Unreleased]` (Changed) noting shell chrome cards + subtle gutters (045)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup** → **Foundational** (token + app/shell gap) → **US1** (cards) → **US2** (gutter polish) → **US3** (stage/drawer) → **Polish**
- US2 largely audits/refines US1 on the same CSS file — sequential after US1
- US3 depends on US1 card rules existing

### User Story Dependencies

- **US1**: After T003–T005
- **US2**: After US1 card styles
- **US3**: After US1 (and preferably US2)

### Parallel Opportunities

- T001 ∥ T002
- T018 ∥ T017 (careful same file — prefer sequential on mesa-theme)
- T020 ∥ T022 ∥ T023

### Parallel Example: Setup

```bash
Task: "Document current shell layout from mesa-theme + AppShell"
Task: "Confirm --radius-lg is 22px in nocturne.css"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1–2: `--shell-gutter` + `.app`/`.shell` gaps
2. Phase 3: six chrome cards
3. **STOP**: visual smoke desktop dark
4. Then US2 → US3 → Polish

### Incremental Delivery

1. Inset frame alone already softens full-bleed
2. US1 delivers SC-001 MVP
3. US2 locks SC-005 / FR-003
4. US3 locks FR-006
5. Daily + CHANGELOG

---

## Notes

- Prefer CSS-only; avoid JSX unless blocked
- Reuse `--radius-lg`; do not bump sm/md from 044
- No elaborate shadows
- Preserve `50%` / pill controls
- After implement: daily + CHANGELOG (T022–T023)
