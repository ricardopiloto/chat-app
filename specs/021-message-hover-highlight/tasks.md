---
description: "Task list for Destaque ao pairar na mensagem de texto"
---

# Tasks: Destaque ao pairar na mensagem de texto

**Input**: Design documents from `/specs/021-message-hover-highlight/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD pedido na spec. Validação: `cd frontend && npx tsc --noEmit` + manual [quickstart.md](./quickstart.md). Backend intocado. Preferir CSS-only.

**Organization**: Setup (caixa do `.msg-block`) → Foundational (DOM: bloco ≠ avatar) → US1 hover (P1, MVP) → US2 vs `.msg-highlight` (P2) → US3 `:focus-within` (P2) → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/styles/mesa-theme.css`, `frontend/src/pages/Channel.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: O bloco de mensagem tem caixa suficiente para um fundo cobrir texto + anexos.

- [X] T001 Ensure `.msg-block` in `frontend/src/styles/mesa-theme.css` has padding and `border-radius` so a background can paint the full message unit (not only `p.msg-body`) per [contracts/message-hover.md](./contracts/message-hover.md)

**Checkpoint**: Padding/raio no bloco; ainda sem hover.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Unidade DOM correcta — **bloqueia** hover/foco (avatar/nome fora do bloco).

**⚠️ CRITICAL**: US1–US3 assume `.msg-block` = texto + anexos + pré-visualizações + «Apagar»; avatar/meta **fora**.

- [X] T002 [P] Confirm in `frontend/src/pages/Channel.tsx` that `.msg-block` wraps body/attachments/previews/delete, keeps `tabindex={0}`, and does **not** wrap `.msg-avatar` / `.msg-meta` (clarification: hover on avatar/name highlights nothing)

**Checkpoint**: Hover no avatar não pode atingir `.msg-block`.

---

## Phase 3: User Story 1 - Ver claramente qual mensagem está sob o ponteiro (Priority: P1) 🎯 MVP

**Goal**: Pairar no bloco destaca essa mensagem completa; ao sair, some; vizinhas e grupo do autor não.

**Independent Test**: [quickstart.md](./quickstart.md) §1–§3.

### Implementation for User Story 1

- [X] T003 [US1] Add `.msg-block:hover` target chrome in `frontend/src/styles/mesa-theme.css` using `var(--hover)` (full block, `border-radius`); MUST NOT use the 017 accent inset ring per [research.md](./research.md)

**Checkpoint**: quickstart §1–§3; uma mensagem de cada vez.

---

## Phase 4: User Story 2 - O destaque de hover não se confunde com o da pesquisa (Priority: P2)

**Goal**: `.msg-highlight` continua mais marcado; hover noutra mensagem não apaga o salto.

**Independent Test**: [quickstart.md](./quickstart.md) §5.

### Implementation for User Story 2

- [X] T004 [US2] In `frontend/src/styles/mesa-theme.css`, keep `.msg-block.msg-highlight` more salient than hover (accent fill + inset ring unchanged; hover `--hover` weaker). Overlap on the same block: jump still recognizable per [contracts/message-hover.md](./contracts/message-hover.md)

**Checkpoint**: Salto 017 intacto (3 s, anel); hover distinto.

---

## Phase 5: User Story 3 - Teclado e foco alinhados ao hover (Priority: P2)

**Goal**: `:focus-within` no bloco (incl. «Apagar») usa o mesmo chrome de alvo; `prefers-reduced-motion` sem transição agressiva.

**Independent Test**: [quickstart.md](./quickstart.md) §4.

### Implementation for User Story 3

- [X] T005 [US3] Extend the target chrome in `frontend/src/styles/mesa-theme.css` to `.msg-block:focus-within` (same `--hover` as hover); add `prefers-reduced-motion` `transition: none` if a transition is used per [research.md](./research.md)

**Checkpoint**: Tab até ao bloco ou «Apagar» destaca a unidade; toque sem hover não deixa destaque permanente.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Temas, «Apagar» visível, docs pós-implement.

- [X] T006 [P] Run `cd frontend && npx tsc --noEmit` (expect no TS changes if CSS-only)
- [X] T007 Execute [quickstart.md](./quickstart.md) §1–§5 (claro/escuro; «Apagar» still visible on hover) and fix gaps in `frontend/src/styles/mesa-theme.css`
- [X] T008 [P] Confirm no backend changes; `git diff -- backend/` empty for this feature
- [X] T009 Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` after successful `/speckit-implement` (skip during tasks-only)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002)** → **US1 (T003)** → **US2 (T004)** → **US3 (T005)** → **Polish**
- T003–T005 share `mesa-theme.css` — **sequential**
- T002 ∥ T001 (Channel vs CSS)

### User Story Dependencies

```text
Foundational (.msg-block unit)
    ├── US1 :hover --hover (MVP)
    ├── US2 .msg-highlight stays stronger
    └── US3 :focus-within same chrome
```

### Parallel Opportunities

- T001 ∥ T002
- T006 ∥ T008 no Polish

---

## Parallel Example: Setup + Foundational

```bash
Task: "Pad .msg-block in mesa-theme.css"
Task: "Confirm Channel.tsx msg-block does not wrap avatar"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001–T003 — hover no bloco
2. **STOP and VALIDATE**: quickstart §1–§3
3. Then US2 stacking → US3 focus → Polish

### Incremental Delivery

1. Setup + Foundational → caixa DOM
2. US1 → hover visível (MVP)
3. US2 → distinção 017
4. US3 → teclado
5. Polish → tsc, quickstart, daily/CHANGELOG

---

## Notes

- [P] = different files / no incomplete deps
- Sem TDD; CSS-only salvo T002
- Commit only if user requests
