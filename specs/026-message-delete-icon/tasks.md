---
description: "Task list for Ícone de lixeira no Apagar mensagem"
---

# Tasks: Ícone de lixeira no Apagar mensagem

**Input**: Design documents from `/specs/026-message-delete-icon/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD na spec. Validação: `cd frontend && npx tsc --noEmit` + manual [quickstart.md](./quickstart.md) §1–§3.

**Organization**: Setup → Foundational (IconTrash + soft-red CSS) → US1 icon → US2 tooltip/aria → US3 themes → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/components/icons/IconTrash.tsx`, `frontend/src/pages/Channel.tsx`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Localizar o controlo actual.

- [X] T001 Locate `.msg-delete` button markup in `frontend/src/pages/Channel.tsx` and existing `.msg-delete` rules in `frontend/src/styles/mesa-theme.css` against [contracts/message-delete-control.md](./contracts/message-delete-control.md) (no code change)

**Checkpoint**: Controlo 011 mapeado.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Ícone + estilo soft-red base — **blocks** stories.

- [X] T002 [P] Create trash SVG icon in `frontend/src/components/icons/IconTrash.tsx` using `Icon` shell (`currentColor`, viewBox 24) per [research.md](./research.md) R1
- [X] T003 [P] Restyle `.msg-delete` in `frontend/src/styles/mesa-theme.css` for soft light-red icon/background/border (`color-mix` with `--color-danger*`, not `.btn-danger`) and icon-button sizing; keep hover/focus reveal on `.msg-block` per [research.md](./research.md) R2 / R4

**Checkpoint**: CSS + ícone prontos para ligar no markup.

---

## Phase 3: User Story 1 - Ícone no lugar de «Apagar» (Priority: P1) 🎯 MVP

**Goal**: Controlo mostra lixeira soft-red sem texto «Apagar».

**Independent Test**: [quickstart.md](./quickstart.md) §1.

### Implementation for User Story 1

- [X] T004 [US1] Replace visible «Apagar» text with `<IconTrash />` on the message delete button in `frontend/src/pages/Channel.tsx`; drop `btn-ghost` in favour of classes that use the new `.msg-delete` soft-red styles (`btn msg-delete` or equivalent)
- [X] T005 [US1] Confirm delete confirm + `canDeleteMessage` / `requestDelete` behaviour unchanged in `frontend/src/pages/Channel.tsx` (no permission or confirm copy changes)

**Checkpoint**: §1 passa.

---

## Phase 4: User Story 2 - Tooltip e acessibilidade (Priority: P1)

**Goal**: `title="Apagar"`; `aria-label="Apagar mensagem"`; confirmação intacta.

**Independent Test**: [quickstart.md](./quickstart.md) §2.

### Implementation for User Story 2

- [X] T006 [US2] Set `title="Apagar"` on the delete button in `frontend/src/pages/Channel.tsx` while keeping `aria-label="Apagar mensagem"` per [research.md](./research.md) R3 and [contracts/message-delete-control.md](./contracts/message-delete-control.md)
- [X] T007 [US2] Verify IconTrash is decorative (`aria-hidden` via Icon shell without `title` prop) so the button name stays on the button in `frontend/src/pages/Channel.tsx` / `IconTrash.tsx`

**Checkpoint**: §2 passa.

---

## Phase 5: User Story 3 - Temas claro e escuro (Priority: P2)

**Goal**: Soft red legível em ambos os temas.

**Independent Test**: [quickstart.md](./quickstart.md) §3.

### Implementation for User Story 3

- [X] T008 [US3] Tune `.msg-delete` soft-red mixes under light and dark token scopes in `frontend/src/styles/mesa-theme.css` (and `nocturne.css` only if needed) so icon/background/border stay combined and readable
- [X] T009 [US3] Smoke-check that `.btn-danger` (Sair) and other «Apagar» UIs (Sidebar/SceneList) are unchanged — scope FR-006

**Checkpoint**: §3 passa; sem regressão noutros Apagar.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Typecheck, quickstart, changelog/daily on implement.

- [X] T010 Run `cd frontend && npx tsc --noEmit`
- [X] T011 [P] Run full [quickstart.md](./quickstart.md) §1–§3 against [contracts/message-delete-control.md](./contracts/message-delete-control.md)
- [X] T012 Mark completed tasks in `specs/026-message-delete-icon/tasks.md`; on successful implement, append `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` per project rules

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **BLOCKS** US1–US3
- **US1 (Phase 3)**: After Foundational — MVP
- **US2 (Phase 4)**: After US1 markup exists
- **US3 (Phase 5)**: After soft-red CSS (T003) + US1 wired
- **Polish (Phase 6)**: After desired stories

### User Story Dependencies

- **US1 (P1)**: After Phase 2
- **US2 (P1)**: Depends on US1 button in `Channel.tsx`
- **US3 (P2)**: Depends on `.msg-delete` styles from Phase 2 / US1

### Parallel Opportunities

- T002 ∥ T003 after T001
- Polish: T011 after T010

---

## Parallel Example: Foundational

```bash
Task: "Create IconTrash.tsx"
Task: "Restyle .msg-delete soft red in mesa-theme.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup + Foundational (icon + CSS)
2. Wire Channel.tsx → icon-only soft red
3. **STOP** and validate §1

### Incremental Delivery

1. US1 → icon replaces text  
2. US2 → title + aria  
3. US3 → theme polish  
4. Polish → `tsc` + quickstart

---

## Notes

- Do not use solid `.btn-danger` for message delete (020 Sair stays distinct).
- Do not change channel/server/scene «Apagar» labels.
- Commit only if the user asks.
