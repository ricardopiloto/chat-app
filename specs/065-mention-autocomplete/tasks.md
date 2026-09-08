---
description: "Task list for Autocomplete de menções @ (065)"
---

# Tasks: Autocomplete de menções @ no composer

**Input**: Design documents from `/specs/065-mention-autocomplete/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: [quickstart.md](./quickstart.md); `tsc --noEmit`; `cargo test --test contract` (mentions_replies + mentionables). Contract test for new endpoint included (plan).

**Organization**: Setup → Foundational (mentionables + parse helpers) → US1b resolve fix → US1 picker → US2 filter → US3 keyboard → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US1b], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/lib/mentionParse.ts`, `frontend/src/pages/Channel.tsx`, `frontend/src/api/client.ts`, `frontend/src/styles/mesa-theme.css`, `frontend/src/components/MentionPicker.tsx` (optional), `backend/src/api/channels.rs`, `backend/src/api/mod.rs`, `backend/tests/contract/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and 062 mention baseline.

- [X] T001 Confirm `.specify/feature.json` → `specs/065-mention-autocomplete` and skim `resolveMentionAccountIds` / composer send in `frontend/src/pages/Channel.tsx` + `frontend/src/lib/mentionParse.ts` and BE mention filter in `backend/src/api/messages.rs` against [research.md](./research.md) R1

**Checkpoint**: Understand silent `@handle` path (roster + parse) and missing picker.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Mentionable candidates API + pure helpers — **blocks** all stories.

**⚠️ CRITICAL**: No picker/resolve wiring until candidates + active-mention helpers exist.

- [X] T002 Implement `GET /api/channels/{channel_id}/mentionables` in `backend/src/api/channels.rs` (viewers only, exclude caller) per [contracts/mentionables-api.md](./contracts/mentionables-api.md); register route in `backend/src/api/mod.rs`
- [X] T003 [P] Contract tests for mentionables (auth, exclude self, private view filter) in `backend/tests/contract/` and register in `backend/tests/contract/mod.rs`
- [X] T004 [P] Add FE types + `listChannelMentionables(channelId)` (or equivalent) in `frontend/src/api/client.ts`
- [X] T005 Extend `frontend/src/lib/mentionParse.ts` with `findActiveMention(text, caretIndex)` and `filterMentionables(candidates, query)` per [data-model.md](./data-model.md); keep/align `extractMentionHandles` / `resolveMentionAccountIds` with product handle charset ([contracts/mention-resolution-fix.md](./contracts/mention-resolution-fix.md))

**Checkpoint**: API returns mentionables; pure helpers callable from Channel.

---

## Phase 3: User Story 1b - Menção @handle volta a funcionar (Priority: P1)

**Goal**: Valid `@handle` (typed or later via picker) produces 062 notification/highlight — no longer silent.

**Independent Test**: [quickstart.md](./quickstart.md) C.

### Implementation for User Story 1b

- [X] T006 [US1b] Load mentionables for the open channel in `frontend/src/pages/Channel.tsx` (on channel mount / refresh); keep signal usable by send + picker
- [X] T007 [US1b] Change send path in `frontend/src/pages/Channel.tsx` to resolve mentions via mentionables list (not stale/partial `handles()`-only map) per [contracts/mention-resolution-fix.md](./contracts/mention-resolution-fix.md)
- [X] T008 [P] [US1b] Re-run / spot-check `mentions_replies` contract + manual typed `@handle` still creates notification ([quickstart.md](./quickstart.md) C)

**Checkpoint**: Manual `@bob` notify works when bob is mentionable.

---

## Phase 4: User Story 1 - Abrir lista ao digitar @ (Priority: P1) 🎯 MVP UI

**Goal**: `@` opens picker of channel viewers (excluding self); select inserts `@handle`.

**Independent Test**: [quickstart.md](./quickstart.md) A.

### Implementation for User Story 1

- [X] T009 [US1] Wire composer `input` in `frontend/src/pages/Channel.tsx` to detect active mention (caret + `findActiveMention`) and show picker when open per [contracts/mention-composer-picker.md](./contracts/mention-composer-picker.md)
- [X] T010 [US1] Render mention suggestions UI (inline in Channel or `frontend/src/components/MentionPicker.tsx`) from mentionables excluding self; on select, replace `@`+query with `@handle` (+ space) and close picker
- [X] T011 [P] [US1] Style picker in `frontend/src/styles/mesa-theme.css` (list above composer, readable light/dark, touch-friendly)
- [X] T012 [US1] Cancel path: Escape / blur / leave mention context closes picker without sending in `frontend/src/pages/Channel.tsx`

**Checkpoint**: Pick member → draft has correct `@handle`; cancel safe.

---

## Phase 5: User Story 2 - Filtrar sugestões (Priority: P1)

**Goal**: Dynamic filter as user types after `@`; empty state when no matches.

**Independent Test**: [quickstart.md](./quickstart.md) B.

### Implementation for User Story 2

- [X] T013 [US2] Drive picker list from `filterMentionables(mentionables, activeQuery)` in `frontend/src/pages/Channel.tsx` / `MentionPicker.tsx` (case-insensitive substring on handle)
- [X] T014 [P] [US2] Empty-results UI in picker when filter matches nothing (`frontend/src/components/MentionPicker.tsx` or Channel + CSS)

**Checkpoint**: Typing narrows list; empty state clear; select still replaces fragment.

---

## Phase 6: User Story 3 - Teclado e vários @ (Priority: P2)

**Goal**: Arrow/Enter navigation; multiple mentions; no picker outside active mention.

**Independent Test**: [quickstart.md](./quickstart.md) E + second `@`.

### Implementation for User Story 3

- [X] T015 [US3] Keyboard: ArrowUp/Down moves highlight; Enter confirms selection without submitting the form in `frontend/src/pages/Channel.tsx` / `MentionPicker.tsx`
- [X] T016 [US3] After one inserted mention, a new `@` elsewhere reopens picker; typing without active mention keeps picker closed

**Checkpoint**: Keyboard select works; multi-mention OK.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Private channel check, validation, docs.

- [X] T017 Verify private-channel mentionables exclude non-viewers ([quickstart.md](./quickstart.md) D) via API/FE; self never in list; typed self-handle still no self-notification
- [X] T018 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and `cargo test --test contract` (filters: mentions + mentionable); complete quickstart A–E
- [X] T019 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup** → **Foundational** (blocks all)
- **US1b** after Foundational (pipeline fix; can precede UI)
- **US1** after Foundational (+ ideally after T006 load)
- **US2** after US1 (filter on open picker)
- **US3** after US1 (keyboard on same UI)
- **Polish** last

### User Story Dependencies

- **US1b**: Foundational API + helpers
- **US1**: Foundational + mentionables loaded
- **US2**: US1 picker shell
- **US3**: US1 picker shell

### Parallel Opportunities

- T003 ∥ T004 ∥ T005 after T002 shape known
- T008 ∥ T007 carefully
- T011 ∥ T010
- T014 ∥ T013
- T019 ∥ T018

### Parallel Example: After Foundational

```bash
Task: "Load mentionables + fix send resolve in Channel.tsx (US1b)"
Task: "Contract tests for GET mentionables"
```

---

## Implementation Strategy

### MVP First

1. Phase 1–2 mentionables + helpers  
2. Phase 3 US1b — typed `@handle` notifies again  
3. Phase 4 US1 — picker open/select  
4. **STOP** — quickstart A + C  
5. Then US2 → US3 → polish  

### Incremental Delivery

1. API mentionables  
2. Resolve fix  
3. Picker + CSS  
4. Filter + empty  
5. Keyboard + multi-@  
6. Docs  

---

## Notes

- No DB migration; reuse 062 notifications  
- Picker inserts plain `@handle` text (same as typing)  
- Enter in picker must not submit composer form  
- Date for daily: session calendar day
