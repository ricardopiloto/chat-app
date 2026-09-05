---
description: "Task list for Ir à mensagem a partir da pesquisa"
---

# Tasks: Ir à mensagem a partir da pesquisa

**Input**: Design documents from `/specs/017-search-jump-highlight/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD pedido na spec. Validação: `cd frontend && npx tsc --noEmit` + manual [quickstart.md](./quickstart.md). Preferir backend intocado (API `?before=` já existe).

**Organization**: Setup (toast + CSS) → Foundational (`data-message-id` + helpers) → US1 salto/centrar (P1, MVP) → US2 highlight 3 s (P1) → US3 seek+toast (P2) → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/components/SearchPanel.tsx`, `frontend/src/pages/Channel.tsx`, `frontend/src/ui/`, `frontend/src/shell/`, `frontend/src/styles/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Toast mínimo e estilos base para highlight/toast.

- [X] T001 Create `frontend/src/ui/toast.ts` (or `frontend/src/components/ToastHost.tsx` + small store module) with `showToast(message: string)` / readable signal for current notice and auto-dismiss ~4 s per [research.md](./research.md) and [data-model.md](./data-model.md)
- [X] T002 [P] Add CSS for `.msg-highlight` and toast/banner (`.app-toast` or equivalent) in `frontend/src/styles/mesa-theme.css` using Mesa tokens (readable light/dark) per [contracts/message-highlight.md](./contracts/message-highlight.md)

**Checkpoint**: Toast API importável; classes CSS existem (ainda sem wiring completo).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Identidade DOM das mensagens e host de toast — **bloqueia** scroll/highlight/falha visível.

**⚠️ CRITICAL**: US1–US3 MUST wait for `data-message-id` on message blocks and toast host mounted.

- [X] T003 Add stable `data-message-id={m.id}` on each message block in `frontend/src/pages/Channel.tsx` (`.msg-block` or wrapper) per [contracts/message-highlight.md](./contracts/message-highlight.md)
- [X] T004 Mount toast host in authenticated shell (`frontend/src/shell/AppShell.tsx` or root layout beside TopBar) rendering current toast from T001; ensure it sits above chat (z-index) without blocking clicks when empty

**Checkpoint**: Inspect DOM → messages have `data-message-id`; `showToast('teste')` aparece e some.

---

## Phase 3: User Story 1 - Abrir a mensagem exacta a partir do resultado (Priority: P1) 🎯 MVP

**Goal**: Clicar num hit navega com `?message=` e o chat **centra** essa mensagem (se já carregada); pesquisa recolhe.

**Independent Test**: [quickstart.md](./quickstart.md) §1 (scroll/centrar) e §2 (mesmo canal).

### Implementation for User Story 1

- [X] T005 [US1] Update `openHit` in `frontend/src/components/SearchPanel.tsx` to navigate to `/channels/{channelId}?server={serverId}&type={channelType}&message={messageId}` then `onCollapse()` per [contracts/search-hit-navigation.md](./contracts/search-hit-navigation.md)
- [X] T006 [US1] In `frontend/src/pages/Channel.tsx`, read `message` query param (Solid router `useSearchParams` or equivalent); after messages are loaded/decrypted, find element `[data-message-id="…"]` and `scrollIntoView({ block: "center", inline: "nearest" })`
- [X] T007 [US1] Ensure same-channel re-selection re-runs focus when `message` query changes (effect deps on channel id + message id + generation); ignore missing id for now (US3) — no crash if absent

**Checkpoint**: quickstart §1–§2 scroll/centrar; pesquisa fecha; 014 sintaxe intacta.

---

## Phase 4: User Story 2 - Destacar a mensagem encontrada no chat (Priority: P1)

**Goal**: Mensagem alvo com `.msg-highlight` ~**3 s**; novo salto substitui; sem clear por scroll/clique.

**Independent Test**: [quickstart.md](./quickstart.md) §1 passos 4–5.

### Implementation for User Story 2

- [X] T008 [US2] After successful center scroll in `frontend/src/pages/Channel.tsx`, apply `.msg-highlight` to the target message element; start 3000 ms timer to remove class per [contracts/message-highlight.md](./contracts/message-highlight.md)
- [X] T009 [US2] On new jump (new `message` / generation), cancel previous timer and move highlight to the new target only in `frontend/src/pages/Channel.tsx`
- [X] T010 [US2] Verify highlight CSS (T002) looks correct in light and dark themes in `frontend/src/styles/mesa-theme.css`; respect `prefers-reduced-motion` if animation used

**Checkpoint**: Destaque ~3 s; scroll/clique não removem; segundo hit move o destaque.

---

## Phase 5: User Story 3 - Mensagem indisponível ou inacessível (Priority: P2)

**Goal**: Seek até 5 páginas `?before=`; se falhar → toast não-modal, canal aberto, sem highlight fantasma.

**Independent Test**: [quickstart.md](./quickstart.md) §3.

### Implementation for User Story 3

- [X] T011 [US3] If target id missing after initial load in `frontend/src/pages/Channel.tsx`, loop up to **5** fetches `GET /api/channels/{id}/messages?before=<oldest created_at>`, decrypt/merge older rows into `messages`, re-check for id per [contracts/search-hit-navigation.md](./contracts/search-hit-navigation.md) and [research.md](./research.md)
- [X] T012 [US3] On seek exhaustion or empty page without finding id, call `showToast` (T001) with PT copy «Mensagem não encontrada» (or equivalent); do **not** apply `.msg-highlight`
- [X] T013 [US3] Guard races: only the latest jump generation may show toast or highlight after async seek in `frontend/src/pages/Channel.tsx`

**Checkpoint**: URL com `message=` inventado → toast, sem highlight; hit apagado comporta-se igual.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação, regressão 014, docs pós-implement.

- [X] T014 [P] Run `cd frontend && npx tsc --noEmit` and fix type errors
- [X] T015 Execute [quickstart.md](./quickstart.md) §1–§4 and fix gaps (incl. Ctrl+F / `#canal` regressão)
- [X] T016 [P] Confirm no accidental backend changes required; if touched, document why — prefer `git diff -- backend/` empty for this feature
- [X] T017 Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` after successful `/speckit-implement` (skip during tasks-only)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001–T002)** → **Foundational (T003–T004)** → **US1 (T005–T007)** → **US2 (T008–T010)** → **US3 (T011–T013)** → **Polish**
- US2 builds on US1 scroll target
- US3 extends US1 resolve path with seek + toast

### User Story Dependencies

```text
Foundational (data-message-id + toast host)
    ├── US1 Navigate + center (MVP)
    ├── US2 Highlight 3s — needs US1 find/scroll
    └── US3 Seek + toast — needs US1 resolve + T001 toast
```

### Within Each User Story

- Navigation URL before Channel resolve
- Scroll before highlight
- Seek before missing toast

### Parallel Opportunities

- T001 ∥ T002 (setup)
- T003 then T004 (same app shell area — prefer sequential if conflict)
- T014 ∥ T016 in Polish
- CSS polish T010 can overlap late US2

---

## Parallel Example: Setup

```bash
Task: "Create frontend/src/ui/toast.ts showToast API"
Task: "Add .msg-highlight and toast CSS in mesa-theme.css"
```

---

## Parallel Example: User Story 1

```bash
# After foundational:
Task: "SearchPanel openHit adds message= query"
Task: "Channel reads message param and scrollIntoView center"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup + Foundational
2. US1 T005–T007 — jump + center
3. **STOP and VALIDATE**: quickstart §1 scroll
4. Then US2 highlight → US3 seek/toast → Polish

### Incremental Delivery

1. Setup + Foundational → DOM ids + toast host
2. US1 → jump works (MVP)
3. US2 → highlight visible
4. US3 → deep seek + failure UX
5. Polish → tsc, quickstart, daily/CHANGELOG

### Parallel Team Strategy

- Dev A: toast + host + US3 toast path
- Dev B: SearchPanel URL + Channel scroll/highlight/seek

---

## Notes

- [P] = different files / no incomplete deps
- Limite de seek = **5** páginas (research); page size = API 200
- Não alterar parser/sintaxe 014
- Commit only if user requests
