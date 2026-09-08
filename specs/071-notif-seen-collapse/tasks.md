---
description: "Task list for Notificações — vista limpa, 5+, limpar e sino maior (071)"
---

# Tasks: Notificações — vista limpa, 5+, limpar e sino maior

**Input**: Design documents from `/specs/071-notif-seen-collapse/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) A–E + `cd frontend && ./node_modules/.bin/tsc --noEmit`; optional BE contract for mark-all. No formal TDD requested in spec.

**Organization**: Setup → Foundational (session store + stop enter-clear + sync event) → US1 viewport auto-read → US2 menções full + 5+ sessão → US3 Limpar → US4 navegação 5+/detalhe → US5 sino maior → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US5]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/preferences/notifications.ts`, `App.tsx`, `pages/ChannelRoute.tsx`, `pages/Channel.tsx`, `shell/TopBar.tsx`, `api/client.ts`, `styles/mesa-theme.css`, `backend/src/api/notifications.rs`, `backend/src/db/notification.rs`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and touch points.

- [x] T001 Confirm `.specify/feature.json` → `specs/071-notif-seen-collapse` and skim current TopBar durable/session sections, `preferences/notifications.ts` Set API, `ChannelRoute` `markSeen` on enter, and Channel highlight IO against [research.md](./research.md)

**Checkpoint**: Clear map of files to change; understand why Set-per-channel cannot do 5+.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Session unread model + stop clear-on-enter + cross-component sync — **blocks** all stories.

**⚠️ CRITICAL**: Complete before US1–US4 UI behavior.

- [x] T002 Rewrite `frontend/src/preferences/notifications.ts` to per-channel ordered session items `{ messageId, createdAt }` with `markUnseen(channelId, messageId, createdAt?)`, `clearMessage(channelId|messageId)`, `clearAllUnseen()`, `sessionItemsByChannel()` / helpers for count + oldest, reactive tick — per [data-model.md](./data-model.md)
- [x] T003 Update `frontend/src/App.tsx` `message.new` handler to call `markUnseen(channelId, messageId, …)` when channel not focused (extract `message_id` / `id` from payload); keep `removeChannel` on `channel.deleted`
- [x] T004 Remove `markSeen(id)` on channel enter in `frontend/src/pages/ChannelRoute.tsx` (session items clear only via viewport / Limpar) per [research.md](./research.md) R3
- [x] T005 [P] Add a small sync mechanism (window CustomEvent e.g. `mesa:notification-read` or shared signal) so TopBar can drop durable rows when Channel marks read — document event shape in comment near dispatcher

**Checkpoint**: Session store holds message-level items; opening a channel no longer wipes them; sync hook ready.

---

## Phase 3: User Story 1 - Notificação some ao ver a mensagem (Priority: P1) 🎯 MVP

**Goal**: Durable (and matching session) pending items clear when the target message enters the history viewport — not merely when the channel opens.

**Independent Test**: [quickstart.md](./quickstart.md) A.

### Implementation for User Story 1

- [x] T006 [US1] In `frontend/src/pages/Channel.tsx`, on message viewport intersection (reuse/extend highlight IO or observe message blocks for pending ids), call `markNotificationRead` for matching durable unread `message_id`, `clearMessage` for session item, and dispatch sync event from T005
- [x] T007 [US1] In `frontend/src/shell/TopBar.tsx`, subscribe to sync event / store and remove matching durable from `durableNotifs` (and rely on reactive session prefs for session rows) so the panel/dot update without full reload
- [x] T008 [US1] Ensure deep-link `?msg=` that brings the message into view triggers the same clear path (existing scroll-to-msg + IO)

**Checkpoint**: Open channel with target below fold keeps notif; scroll into view clears durable persistently.

---

## Phase 4: User Story 2 - Menções em detalhe; 5+ só para não lidas de canal (Priority: P1)

**Goal**: Durable mention/reply rows always full; session section aggregates per channel with detail ≤5 and a single **5+** row when count >5.

**Independent Test**: [quickstart.md](./quickstart.md) B.

### Implementation for User Story 2

- [x] T009 [US2] In `frontend/src/shell/TopBar.tsx`, keep «Menções e respostas» as a flat full list of durables (068 labels) — **never** collapse by channel/count per [contracts/notif-panel-seen-collapse.md](./contracts/notif-panel-seen-collapse.md)
- [x] T010 [US2] In `frontend/src/shell/TopBar.tsx`, render «Canais com mensagens novas» from session store: per channel, if count ≤5 list detail rows (channel name + optional when); if count >5 show **exactly one** 5+ summary row (no individual session lines for that channel)
- [x] T011 [P] [US2] Add PT copy/CSS for 5+ row if needed in `frontend/src/styles/mesa-theme.css` (reuse `.topbar-notif-*` patterns)

**Checkpoint**: 6+ session msgs → one 5+; 6+ durables → all listed.

---

## Phase 5: User Story 3 - Limpar notificações (Priority: P1)

**Goal**: Explicit **Limpar** clears all durable unread (persisted) and session items.

**Independent Test**: [quickstart.md](./quickstart.md) D.

### Implementation for User Story 3

- [x] T012 [P] [US3] Implement `mark_all_read_for_account` in `backend/src/db/notification.rs` and `POST /api/notifications/read-all` in `backend/src/api/notifications.rs` (+ route in `backend/src/api/mod.rs`) returning 204 per [contracts/notifications-mark-all-read.md](./contracts/notifications-mark-all-read.md)
- [x] T013 [P] [US3] Add `markAllNotificationsRead()` in `frontend/src/api/client.ts`
- [x] T014 [US3] Add **Limpar** control in `frontend/src/shell/TopBar.tsx` when durables or session items exist; on click call mark-all + `clearAllUnseen()` + clear local durable list; hide/disable when empty (no confirm dialog)

**Checkpoint**: Limpar empties panel; reload keeps durables cleared.

---

## Phase 6: User Story 4 - Clique / navegação (Priority: P2)

**Goal**: Detail and 5+ rows navigate correctly; 5+ goes to **oldest** unread message.

**Independent Test**: [quickstart.md](./quickstart.md) C.

### Implementation for User Story 4

- [x] T015 [US4] Wire session detail row `href` to `/channels/{id}?msg={messageId}` in `frontend/src/shell/TopBar.tsx`
- [x] T016 [US4] Wire 5+ row `href` to `/channels/{id}?msg={oldestMessageId}` using session store oldest helper; close panel on click
- [x] T017 [US4] Confirm durable click path still marks that notif read + navigates (regression check in `TopBar.tsx`)

**Checkpoint**: 5+ lands on oldest unread; detail/durable deep-links unchanged in spirit.

---

## Phase 7: User Story 5 - Sino um pouco maior (Priority: P2)

**Goal**: Bell icon modestly larger; binary dot unchanged.

**Independent Test**: [quickstart.md](./quickstart.md) E.

### Implementation for User Story 5

- [x] T018 [US5] Increase `IconBell` size from 20 → **24** in `frontend/src/shell/TopBar.tsx`; adjust `.topbar-notif-dot` positioning in `frontend/src/styles/mesa-theme.css` if needed so the dot stays legible
- [x] T019 [P] [US5] Confirm badge remains binary (dot only, no numeric count) in `TopBar.tsx` `showNotifBadge`

**Checkpoint**: Visual size bump; no number on badge.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validation and project docs.

- [x] T020 Run `cd frontend && ./node_modules/.bin/tsc --noEmit`
- [x] T021 [P] Optional: contract test for mark-all in `backend/tests/contract/` if easy; otherwise manual quickstart D is enough
- [x] T022 Walk [quickstart.md](./quickstart.md) A–E against running app
- [x] T023 Update `docs/daily/2026-09-08.md` with Speckit implement subsection for 071
- [x] T024 Update `CHANGELOG.md` `[Unreleased]` for 071

**Checkpoint**: Feature ready for review.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (T001)** → **Foundational (T002–T005)** → stories
- **US1** needs T002–T005
- **US2** needs T002–T003 (session items); can follow or parallel after foundation with US1 if careful on TopBar merge
- **US3** needs T002 (clearAll) + can parallel BE T012 with FE after foundation
- **US4** needs US2 row rendering (T010)
- **US5** independent after TopBar exists (parallel anytime post-setup)
- **Polish** after stories

### User Story Dependencies

```text
Foundation → US1 (viewport clear)
           → US2 (5+ UI) → US4 (hrefs)
           → US3 (Limpar) [BE parallel]
           → US5 (bell) [parallel]
```

### Parallel Opportunities

- T005 || early App/ChannelRoute after T002 API shape known
- T012 || T013 after foundation
- T011 || T010
- T018–T019 || US3/US4
- T021 || T022–T024 after code done

### Suggested MVP

**T001–T008 (Foundation + US1)** — auto-clear on viewport delivers the core “pending means unread” fix; then US2+US3 for list hygiene and Limpar.

---

## Implementation Strategy

1. Land session store + remove enter-clear (foundation).
2. MVP: viewport → mark durable read + TopBar sync.
3. Session 5+ UI + keep durables full.
4. mark-all + Limpar.
5. Oldest href + larger bell.
6. tsc, quickstart, daily, CHANGELOG.

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001 | 1 |
| Foundational | T002–T005 | 4 |
| US1 | T006–T008 | 3 |
| US2 | T009–T011 | 3 |
| US3 | T012–T014 | 3 |
| US4 | T015–T017 | 3 |
| US5 | T018–T019 | 2 |
| Polish | T020–T024 | 5 |
| **Total** | | **24** |

**Format validation**: All tasks use `- [ ]`, Task ID, optional `[P]` / `[USn]`, and file paths.
