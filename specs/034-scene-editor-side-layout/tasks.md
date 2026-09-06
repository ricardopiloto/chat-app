---
description: "Task list for painel lateral do editor de cena — slots compactos no topo"
---

# Tasks: Painel lateral do editor de cena — slots compactos no topo

**Input**: Design documents from `/specs/034-scene-editor-side-layout/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/scene-editor-side-stack.md](./contracts/scene-editor-side-stack.md), [quickstart.md](./quickstart.md)

**Tests**: Manual/quickstart + `tsc --noEmit` (plano). Sem contract BE.

**Organization**: Setup → Foundational (wrappers + CSS base) → US1 slots compactos → US2 layout/banco stack + scroll → US3 regressão → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Inventariar CSS/markup actual do painel lateral.

- [x] T001 Audit `.scene-editor-side` / related rules in `frontend/src/styles/mesa-theme.css` and the side column markup in `frontend/src/components/SceneEditor.tsx` for any equal-height/`flex: 1`/`1fr` split among the three sections per [research.md](./research.md) R1

**Checkpoint**: Causa documentada; ainda sem mudança visual.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Wrappers semânticos das três secções — **blocks** US1–US2 CSS targeting.

**⚠️ CRITICAL**: Sem wrappers estáveis, `flex: none` por secção fica frágil.

- [x] T002 Wrap «Câmeras na cena» + slot select, «Layout da cena» + list, and «No banco» + bank in three distinct containers under `.scene-editor-side` in `frontend/src/components/SceneEditor.tsx` per [contracts/scene-editor-side-stack.md](./contracts/scene-editor-side-stack.md) / [data-model.md](./data-model.md)

**Checkpoint**: Markup com três blocos; estilos finais ainda pendentes.

---

## Phase 3: User Story 1 - Número de slots só no topo (Priority: P1) 🎯 MVP

**Goal**: Bloco de slots compacto no topo; não cresce com a altura da coluna (SC-001 ≤120px em painel ≥600px).

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — User Story 1.

### Implementation for User Story 1

- [x] T003 [US1] Style the slots block (`flex: none`, content height, top of column) in `frontend/src/styles/mesa-theme.css` so it does not absorb equal share of panel height ([contracts/scene-editor-side-stack.md](./contracts/scene-editor-side-stack.md) FR/SC-001)
- [x] T004 [US1] Ensure `.scene-editor-side` uses `justify-content: flex-start` (or equivalent) and children do not `flex-grow` to fill leftover space in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Em painel alto, slots ≈ rótulo+select; sem faixa vazia grande no bloco de slots.

---

## Phase 4: User Story 2 - Layout e banco usam o resto (Priority: P1)

**Goal**: Layout e banco empilham por conteúdo abaixo dos slots; scroll no painel inteiro se necessário.

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — User Story 2.

### Implementation for User Story 2

- [x] T005 [US2] Style layout and bank blocks as `flex: none` / content-sized stacked below slots (no 50/50 split of remaining height) in `frontend/src/styles/mesa-theme.css`
- [x] T006 [US2] Confirm `.scene-editor-side` keeps `overflow: auto` so the whole side panel scrolls when layout+bank exceed column height (desktop grid body `overflow: hidden` unchanged) in `frontend/src/styles/mesa-theme.css`
- [x] T007 [US2] Verify narrow viewport (&lt;901px stacked editor): slots stay compact at top of the side section in `frontend/src/styles/mesa-theme.css` + `frontend/src/components/SceneEditor.tsx` (SC-004)

**Checkpoint**: Layout e banco logo abaixo; scroll na coluna; sem terços iguais.

---

## Phase 5: User Story 3 - Sem regressão do editor (Priority: P2)

**Goal**: N, layout, banco↔slot, Guardar/Descartar/reduce-N intactos.

**Independent Test**: [quickstart.md](./quickstart.md) § Manual — User Story 3.

### Implementation for User Story 3

- [x] T008 [US3] Smoke-check editor flows still work after markup wrappers (change N, layout, drag bank→slot, save/discard) in `frontend/src/components/SceneEditor.tsx` — fix only if wrappers broke handlers/classes
- [x] T009 [US3] Confirm reduce-N banner/picker still usable with the new side stack in `frontend/src/components/SceneEditor.tsx`

**Checkpoint**: SC-003 smoke OK.

---

## Phase 6: Polish & Cross-Cutting

**Purpose**: Validação e limpeza.

- [x] T010 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`; fix any TS issues from markup changes
- [x] T011 Manual pass [quickstart.md](./quickstart.md) US1–US3 (DevTools height check SC-001); note if browser unavailable
- [x] T012 [P] Grep `frontend/src/styles/mesa-theme.css` for accidental `flex: 1` / equal `1fr` on side-panel section children; remove if found

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → no deps
- **Phase 2** → after audit; **blocks** US1–US2
- **Phase 3 (US1)** → after T002 — **MVP**
- **Phase 4 (US2)** → after US1 CSS base (same CSS file; sequential with T005–T007)
- **Phase 5 (US3)** → after wrappers + stack CSS
- **Phase 6** → after stories

### User Story Dependencies

- **US1**: Needs T002 wrappers
- **US2**: Needs US1 column rules (flex-start / no grow)
- **US3**: Regression after markup/CSS

### Parallel Opportunities

- T010 ∥ T012 after code changes
- Limited parallel elsewhere (same two files)

### Parallel example

```text
T002 (wrappers) → T003–T004 (US1) → T005–T007 (US2) → T008–T009 (US3)
T010 ∥ T012 in polish
```

---

## Implementation Strategy

### MVP (User Story 1)

1. T001–T004 — slots compactos no topo  
2. Stop: SC-001 visual check  

### Incremental delivery

1. MVP  
2. US2 scroll + layout/banco  
3. US3 smoke + polish  

### Notes

- FE-only; sem BE  
- Não alterar lógica 018 / thumbnails / limites N  

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001 | 1 |
| Foundational | T002 | 1 |
| US1 | T003–T004 | 2 |
| US2 | T005–T007 | 3 |
| US3 | T008–T009 | 2 |
| Polish | T010–T012 | 3 |
| **Total** | T001–T012 | **12** |

**Parallel opportunities**: tsc ∥ grep CSS.

**MVP scope**: Phase 2–3 (T002–T004) — slots compactos.

**Format validation**: All tasks use `- [ ]`, sequential IDs, optional `[P]`, story labels only on US phases, and concrete file paths.
