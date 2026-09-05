---
description: "Task list for Pesquisa por canal e atalho Ctrl+F"
---

# Tasks: Pesquisa por canal e atalho Ctrl+F

**Input**: Design documents from `/specs/014-search-channel-scope/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD pedido na spec. Validação: `npx tsc --noEmit` + manual [quickstart.md](./quickstart.md). Backend intocado (FR-009).

**Organization**: Setup → Foundational (parser) → US1 atalho (P1, MVP) → US2 `#canal` scoped (P1) → US3 global texto clarificado (P1) → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/search/`, `frontend/src/components/`, `frontend/src/shell/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Módulo de pesquisa e tipos partilhados.

- [X] T001 Create directory `frontend/src/search/` for query parsing helpers per [plan.md](./plan.md)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Parser puro e tipos de empty-state — **bloqueia US2/US3**; US1 pode usar seed string sem parser completo, mas o parser deve existir antes de scoped search.

**⚠️ CRITICAL**: US2 e US3 MUST wait for parser + empty reasons.

- [X] T002 Implement `parseSearchQuery` in `frontend/src/search/parseSearchQuery.ts` returning `{ mode, channelName?, term, raw }` per [contracts/search-query-syntax.md](./contracts/search-query-syntax.md) and [data-model.md](./data-model.md)
- [X] T003 [P] Export `SearchEmptyReason` type (`channel_not_found` | `voice_only` | `no_results`) and PT copy helpers (or constants) in `frontend/src/search/searchEmpty.ts` (or same module as T002) per [data-model.md](./data-model.md)

**Checkpoint**: Parser handles `#geral hello`, `#geral`, `hello`; empty reason labels defined.

---

## Phase 3: User Story 1 - Abrir pesquisa com Ctrl+F (Priority: P1) 🎯 MVP

**Goal**: Ctrl+F / Cmd+F no shell expande/foca a pesquisa; em canal de texto substitui o campo por `#nome `; fora de texto só foca sem injectar `#`.

**Independent Test**: [quickstart.md](./quickstart.md) §1.

### Implementation for User Story 1

- [X] T004 [US1] Expose current text-channel name (or null) to `TopBar` from `frontend/src/shell/AppShell.tsx` (or via router params + channel list already in shell) so the shortcut knows whether to seed `#nome `
- [X] T005 [US1] Add Ctrl+F / Cmd+F `keydown` handler in `frontend/src/shell/TopBar.tsx`: `preventDefault`, expand search, if text channel → replace query with `#${name} `; else expand without `#` seed per [contracts/search-shortcut.md](./contracts/search-shortcut.md)
- [X] T006 [US1] Extend `frontend/src/components/SearchPanel.tsx` to accept optional controlled/seed query (`initialQuery` or `seedQuery` + effect) so TopBar can set `#nome ` and focus caret at end after expand

**Checkpoint**: [quickstart.md](./quickstart.md) §1 passa.

---

## Phase 4: User Story 2 - Pesquisar só num canal com `#nome` (Priority: P1)

**Goal**: `#canal termo` restringe a canais de texto com esse nome; empty states distintos (não encontrado / só voz / sem resultados); placeholder com sintaxe.

**Independent Test**: [quickstart.md](./quickstart.md) §2 (scoped cases).

### Implementation for User Story 2

- [X] T007 [US2] Wire `parseSearchQuery` (T002) into `frontend/src/components/SearchPanel.tsx` input → only run search when `term.length >= 2`; scoped mode resolves text channels by name (case-insensitive) among accessible servers
- [X] T008 [US2] In scoped search loop in `frontend/src/components/SearchPanel.tsx`, skip non-matching channels; if no text match but voice/video name match → set `emptyReason` to `voice_only`; if no channel name match → `channel_not_found`; if text match but zero hits → `no_results` per [contracts/search-query-syntax.md](./contracts/search-query-syntax.md)
- [X] T009 [US2] Render distinct empty messages in `frontend/src/components/SearchPanel.tsx` using T003 copy («Canal não encontrado» / «Só canais de texto» / «Sem resultados»)
- [X] T010 [US2] Set search input placeholder to cover global + `#canal termo` (e.g. `Pesquisar… ou #canal termo`) in `frontend/src/components/SearchPanel.tsx` (FR-011)

**Checkpoint**: quickstart §2 passos 4–7 passam.

---

## Phase 5: User Story 3 - Pesquisa global em todos os canais de texto (Priority: P1)

**Goal**: Sem `#`, pesquisar todos os canais de texto acessíveis; voz excluída; membership intacto.

**Independent Test**: [quickstart.md](./quickstart.md) §2 passos 3 + membership.

### Implementation for User Story 3

- [X] T011 [US3] Ensure global mode in `frontend/src/components/SearchPanel.tsx` only iterates `type === "text"` channels (explicit filter even if previously implicit)
- [X] T012 [US3] On global `done` with zero hits, show `no_results` («Sem resultados») in `frontend/src/components/SearchPanel.tsx` (not channel_not_found)
- [X] T013 [US3] Confirm scope still limited to `GET /api/servers` membership in `frontend/src/components/SearchPanel.tsx` (no extra servers); document in comment only if needed — no API changes

**Checkpoint**: quickstart §2 passo 3; SC-003 mental check.

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T014 [P] Run `cd frontend && npx tsc --noEmit` and fix type errors
- [X] T015 Execute [quickstart.md](./quickstart.md) §1–§2 and fix gaps
- [X] T016 [P] Grep to ensure no accidental backend changes under `backend/` for this feature
- [X] T017 Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` after successful `/speckit-implement` (skip during tasks-only)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T003)** → **US1 (T004–T006)** → **US2 (T007–T010)** → **US3 (T011–T013)** → **Polish**
- US1 can start after T001 if seed is raw string; prefer T002 done first for shared types
- US3 largely refines SearchPanel after US2 empty-state plumbing

### User Story Dependencies

```text
Foundational (parser + empty reasons)
    ├── US1 Shortcut (MVP) — needs TopBar + SearchPanel seed
    ├── US2 Scoped #canal — needs parser + empty states
    └── US3 Global text — needs same SearchPanel after US2
```

### Parallel Opportunities

- T002 ‖ T003 after T001
- T014 ‖ T016 in polish

### Independent Test Criteria

| Story | Test |
|-------|------|
| US1 | quickstart §1 |
| US2 | quickstart §2 (scoped / empty) |
| US3 | quickstart §2 (global) |

### Suggested MVP

**US1** (atalho + seed `#nome `) after Foundational parser stub if needed; then US2 → US3.

---

## Implementation Strategy

1. Parser + empty reason constants.
2. Ctrl/Cmd+F + seed from current text channel.
3. Scoped search + distinct empties + placeholder.
4. Harden global text-only + polish/`tsc`.

**Format validation**: All tasks use `- [ ]`, IDs T001–T017, `[P]`/`[USn]` where required, file paths included.
