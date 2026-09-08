---
description: "Task list for drawer de canais atrás do Server Rail (055)"
---

# Tasks: Drawer de canais atrás do Server Rail

**Input**: Design documents from `/specs/055-channels-rail-drawer/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/channels-rail-drawer.md](./contracts/channels-rail-drawer.md), [quickstart.md](./quickstart.md)

**Tests**: Quickstart visual + `tsc --noEmit` (sem TDD formal).

**Organization**: Setup → Foundational (prefs + shell classes) → US1 drawer fechado → US2 peek/hover/open → US3 header + persistência fora do palco → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/shell/`, `frontend/src/preferences/`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar feature dir e mapa do chrome actual.

- [x] T001 Confirm `.specify/feature.json` → `specs/055-channels-rail-drawer` and skim `AppShell.tsx`, `Sidebar.tsx`, `ServerRail.tsx`, `uiPrefs.ts`, and `.shell-nav` / `.stage-mode` rules in `mesa-theme.css` against [plan.md](./plan.md)

**Checkpoint**: Feature dir correcto; comportamento actual de `stageChannelsExpanded` entendido.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Preferência generalizada + classes de shell independentes do palco — **bloqueia** US1–US3.

**⚠️ CRITICAL**: Sem generalizar prefs/classes, o drawer fora do palco não cumpre FR-001a.

- [x] T002 Generalize channels-list expanded preference in `frontend/src/preferences/uiPrefs.ts` (`mesa.channelsListExpanded` with read fallback from `mesa.stageChannelsExpanded` per [research.md](./research.md) R2 / [data-model.md](./data-model.md))
- [x] T003 Wire AppShell state to the generalized pref in `frontend/src/shell/AppShell.tsx` (rename signals/helpers as needed; keep broadcast/events coherent)
- [x] T004 Add shell class for collapsed channels **without** requiring `.stage-mode` (e.g. `.shell.channels-collapsed`) in `frontend/src/shell/AppShell.tsx` + base rules in `frontend/src/styles/mesa-theme.css` per [contracts/channels-rail-drawer.md](./contracts/channels-rail-drawer.md)

**Checkpoint**: Pref + class disponíveis em qualquer desktop shell; mobile não partido.

---

## Phase 3: User Story 1 - Drawer fechado atrás do rail (Priority: P1) 🎯 MVP

**Goal**: Ocultar canais → lista atrás do Server Rail; só faixa fina; rail + main utilizáveis (também fora do palco).

**Independent Test**: [quickstart.md](./quickstart.md) A (+ D palco).

### Implementation for User Story 1

- [x] T005 [US1] Implement collapsed `.shell-nav` grid (rail ~68px + peek ~8–12px) in `frontend/src/styles/mesa-theme.css` when channels collapsed on desktop
- [x] T006 [US1] Stack Server Rail above collapsed sidebar body (z-index / overflow) in `mesa-theme.css` (+ `ServerRail.tsx` / `Sidebar.tsx` wrappers if needed) so drawer sits **behind** the rail (FR-001/006)
- [x] T007 [US1] Clip sidebar list content when collapsed so only peek affordance remains usable in `frontend/src/shell/Sidebar.tsx` + CSS
- [x] T008 [US1] Ensure collapsing works **outside** `stage-mode` on desktop rail+lista layouts in `AppShell.tsx` / CSS (FR-001a); do not break narrow `drawer-open` (FR-009)

**Checkpoint**: US1 / SC-001 — lista oculta = peek + rail clicável.

---

## Phase 4: User Story 2 - Peek enlarge + abrir (Priority: P1)

**Goal**: Hover enlarge na faixa; clique/teclado só **abre** (reflow); não fecha.

**Independent Test**: [quickstart.md](./quickstart.md) B–C.

### Implementation for User Story 2

- [x] T009 [US2] Add peek hit-target on the **right edge of the Server Rail** / peek column in `frontend/src/shell/Sidebar.tsx` and/or `ServerRail.tsx` (focusable, aria-label «Mostrar canais»)
- [x] T010 [US2] Peek activation sets expanded **true** only (never toggles closed) via AppShell setter / callback in `Sidebar.tsx` / `AppShell.tsx` (FR-004)
- [x] T011 [US2] CSS hover/focus-visible **enlarge** for peek in `mesa-theme.css`; respect `prefers-reduced-motion` (FR-003/008)
- [x] T012 [US2] Expanded state restores `68px 238px` (or current open widths) **reflow** in `mesa-theme.css` (not overlay) (FR-004 / Q4)

**Checkpoint**: US2 / SC-002–003 — enlarge + open; faixa não fecha.

---

## Phase 5: User Story 3 - Header toggle + persistência (Priority: P2)

**Goal**: Controlo «Ocultar / Mostrar» no cabeçalho da sidebar em palco **e** fora; prefs restauram estado.

**Independent Test**: [quickstart.md](./quickstart.md) A, E; header open/close.

### Implementation for User Story 3

- [x] T013 [US3] Show sidebar header expand/collapse control on desktop whenever rail+lista layout applies — remove `.stage-mode`-only visibility in `Sidebar.tsx` + `mesa-theme.css` (FR-007 / Q5)
- [x] T014 [US3] Header «Ocultar» sets collapsed; «Mostrar» sets expanded; `aria-expanded` reflects state in `Sidebar.tsx`
- [x] T015 [US3] Verify pref read/write round-trip on reload in `uiPrefs.ts` + AppShell boot (SC-004); keep legacy key fallback

**Checkpoint**: US3 / SC-004.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Tipagem, quickstart, changelog, daily.

- [x] T016 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`; fix regressions
- [x] T017 Execute [quickstart.md](./quickstart.md) A–G; note skips (esp. mobile F)
- [x] T018 [P] Update `CHANGELOG.md` `[Unreleased]` for `055-channels-rail-drawer`
- [x] T019 [P] Update `docs/daily/yyyy-mm-dd.md` Speckit implement section for 055

**Checkpoint**: Feature ready to demo.

---

## Dependencies & Execution Order

### Phase dependencies

- **Setup (T001)** → none
- **Foundational (T002–T004)** → after Setup; **blocks all stories**
- **US1 (T005–T008)** → after Foundational (MVP visual collapse)
- **US2 (T009–T012)** → after US1 (needs collapsed chrome)
- **US3 (T013–T015)** → after Foundational; can overlap late US1 if header already exists — prefer after T008
- **Polish** → after US1–US3

### User story dependencies

- **US1** — collapsed drawer behind rail (MVP)
- **US2** — peek interactions on top of US1
- **US3** — header availability + persistence polish

### Parallel opportunities

- T005 ∥ T006 after T004 (CSS vs stacking tweaks carefully)
- T011 ∥ T012 within US2 after peek exists
- T018 ∥ T019

### Parallel example: after Foundational

```text
T005 collapsed grid CSS
T003/T004 already done — then T008 verify non-stage path
```

### Implementation strategy

1. **MVP**: T001–T008 (ocultar = peek behind rail, fora do palco)
2. **Interact**: T009–T012 (enlarge + open-only peek)
3. **Discover/persist**: T013–T019

### Notes

- Peek **opens only**; header **closes** (and can open).
- Do not add click-outside-to-close.
- Do not break mobile hamburger drawer.
- Prefer CSS width/grid transitions; keep reduced-motion fallback.
