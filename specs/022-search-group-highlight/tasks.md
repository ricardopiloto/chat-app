---
description: "Task list for Destaque do grupo na pesquisa"
---

# Tasks: Destaque do grupo na pesquisa

**Input**: Design documents from `/specs/022-search-group-highlight/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD na spec. Validação: `npx tsc --noEmit` + manual [quickstart.md](./quickstart.md) §1–§4.

**Organization**: Setup → Foundational (CSS group highlight) → US1 grupo → US2 multi-msg → US3 regressão 017 → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/pages/Channel.tsx`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirmar pontos de toque 017.

- [X] T001 Review `applyHighlight` / `focusMessage` / `.msg-block.msg-highlight` in `frontend/src/pages/Channel.tsx` and `frontend/src/styles/mesa-theme.css` against [contracts/search-group-highlight.md](./contracts/search-group-highlight.md) (no code yet)

**Checkpoint**: Clear that highlight currently targets `.msg-block`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: CSS do destaque no grupo — bloqueia verificação visual das stories.

- [X] T002 Move search-highlight styles from `.msg-block.msg-highlight` to `.msg-group.msg-highlight` in `frontend/src/styles/mesa-theme.css` (cover avatar+meta+blocks; light/dark contrast) per [research.md](./research.md) R2; remove obsolete `.msg-block.msg-highlight` rules used only for search

**Checkpoint**: CSS ready for class on `.msg-group`.

---

## Phase 3: User Story 1 - Destacar o grupo visual (Priority: P1) 🎯 MVP

**Goal**: Após salto, `msg-highlight` no `.msg-group`; scroll ainda na mensagem.

**Independent Test**: [quickstart.md](./quickstart.md) §1.

### Implementation for User Story 1

- [X] T003 [US1] Update `applyHighlight` in `frontend/src/pages/Channel.tsx` to resolve `el.closest(".msg-group")` and add/remove `msg-highlight` on the **group** only; if no group, do not highlight the `.msg-block` per [contracts/search-group-highlight.md](./contracts/search-group-highlight.md)
- [X] T004 [US1] Keep `scrollIntoView` on the message element in `focusMessage` in `frontend/src/pages/Channel.tsx` (FR-003); keep `HIGHLIGHT_MS` ~3000 and clear/replace behaviour

**Checkpoint**: §1 — single-message group shows full group highlight ~3 s.

---

## Phase 4: User Story 2 - Grupo com várias mensagens (Priority: P1)

**Goal**: Grupo multi-bolha todo destacado; sem ênfase extra no hit.

**Independent Test**: [quickstart.md](./quickstart.md) §2.

### Implementation for User Story 2

- [X] T005 [US2] Verify (and fix if needed) that `applyHighlight` never adds `msg-highlight` to `.msg-block` in `frontend/src/pages/Channel.tsx` when the hit is a non-first item in a multi-message group (FR-001a)
- [X] T006 [US2] Tune `.msg-group.msg-highlight` padding/radius in `frontend/src/styles/mesa-theme.css` so multi-message groups read as one unit without clipping avatar/meta

**Checkpoint**: §2 passa.

---

## Phase 5: User Story 3 - Paridade falhas / regressão 017 (Priority: P2)

**Goal**: Toast sem highlight fantasma; timer/substituição intactos.

**Independent Test**: [quickstart.md](./quickstart.md) §3–§4.

### Implementation for User Story 3

- [X] T007 [US3] Confirm failure path in `frontend/src/pages/Channel.tsx` (message not found) never calls `applyHighlight` / leaves no `.msg-group.msg-highlight`; toast path unchanged
- [X] T008 [US3] Confirm cleanup on unmount and on new jump still clears previous group class + timer in `frontend/src/pages/Channel.tsx`; scroll/click do not clear early

**Checkpoint**: §3–§4 passam.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T009 [P] Run `cd frontend && npx tsc --noEmit` and fix errors
- [X] T010 Execute [quickstart.md](./quickstart.md) §1–§4
- [X] T011 Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` after successful `/speckit-implement` (skip during tasks-only)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002)** → **US1 (T003–T004)** → **US2 (T005–T006)** → **US3 (T007–T008)** → **Polish**
- US2/US3 mostly verify/tune after US1 wiring

### User Story Dependencies

```text
Foundational (CSS on .msg-group)
    └── US1 applyHighlight → group (MVP)
            ├── US2 multi-message polish
            └── US3 failure / timer regression
```

### Parallel Opportunities

- After T003: T006 (CSS tune) can overlap carefully with T005
- T009 ∥ manual quickstart prep

---

## Parallel Example: After US1 wiring

```bash
Task: "Verify no msg-block highlight in Channel.tsx"
Task: "Tune .msg-group.msg-highlight in mesa-theme.css"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. CSS move + `applyHighlight` → group
2. **STOP**: quickstart §1
3. Then multi-msg polish + 017 regression checks

### Incremental Delivery

1. Group highlight works → multi-msg → regression → Polish (`tsc` + daily/CHANGELOG on implement)

---

## Notes

- [P] = different files / no incomplete deps
- Do not change SearchPanel / seek / toast logic except highlight target
- Do not implement 021 hover
