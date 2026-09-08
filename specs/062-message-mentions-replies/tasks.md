---
description: "Task list for Menções @ e resposta a mensagens"
---

# Tasks: Menções @ e resposta a mensagens

**Input**: Design documents from `/specs/062-message-mentions-replies/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Backend contract tests (mentions, replies, notifications, orphan message) per plan; FE `tsc --noEmit` + [quickstart.md](./quickstart.md).

**Organization**: Setup → Foundational (migration + domain/DB + notification module) → US1 mentions → US2 replies → US3 topbar notifications → US4 highlight → US5 scroll/jump → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US5]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/migrations/0018_message_mentions_replies.sql`, `backend/src/domain/{message,notification}.rs`, `backend/src/db/{message,notification}.rs`, `backend/src/api/{messages,notifications,mod}.rs`, `backend/tests/contract/`, `frontend/src/api/client.ts`, `frontend/src/lib/{mentionParse,highlightSeen}.ts`, `frontend/src/pages/{Channel,ChannelRoute}.tsx`, `frontend/src/shell/TopBar.tsx`, `frontend/src/preferences/notifications.ts`, `frontend/src/styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Pin feature and skim message/TopBar baseline.

- [X] T001 Confirm `.specify/feature.json` → `specs/062-message-mentions-replies` and skim `post_message` in `backend/src/api/messages.rs`, `Message` in `backend/src/domain/message.rs`, FE send/decrypt in `frontend/src/pages/Channel.tsx`, TopBar bell in `frontend/src/shell/TopBar.tsx`, session unseen in `frontend/src/preferences/notifications.ts`

**Checkpoint**: Baseline understood.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema + domain/DB for reply, mentions, notifications — **blocks** US1–US3.

**⚠️ CRITICAL**: No mention/reply/notification API work until migration + types exist.

- [X] T002 Add migration `backend/migrations/0018_message_mentions_replies.sql`: `message.reply_to_message_id`; tables `message_mention`, `user_notification` per [data-model.md](./data-model.md)
- [X] T003 Extend `Message` with `reply_to_message_id`, `mentioned_account_ids`, optional `reply_to_sender_account_id` in `backend/src/domain/message.rs`
- [X] T004 [P] Add `backend/src/domain/notification.rs` (`UserNotification`, kind `mention`|`reply`) and register in `backend/src/domain/mod.rs`
- [X] T005 Update insert/list mapping for reply + mentions in `backend/src/db/message.rs`
- [X] T006 [P] Add `backend/src/db/notification.rs` (insert, list_unread, mark_read) and register in `backend/src/db/mod.rs`
- [X] T007 [P] Extend FE `Message` / post body types in `frontend/src/api/client.ts` (`mentioned_account_ids`, `reply_to_message_id`, notification helpers stubs)

**Checkpoint**: Migrated DB; domain/DB round-trip ready for API wiring.

---

## Phase 3: User Story 1 - Mencionar com @handle (Priority: P1) 🎯 MVP

**Goal**: Client sends mention metadata; server notifies eligible members (not self); invalid handles don’t fail send.

**Independent Test**: [quickstart.md](./quickstart.md) Mentions; [contracts/mentions-replies-api.md](./contracts/mentions-replies-api.md).

### Tests for User Story 1

- [X] T008 [P] [US1] Add contract tests for POST with `mentioned_account_ids` (notify target, skip self, skip invalid/non-viewer) in `backend/tests/contract/` (e.g. `mentions.rs`); register in `backend/tests/contract/mod.rs`

### Implementation for User Story 1

- [X] T009 [US1] Extend `PostMessageBody` + `post_message` in `backend/src/api/messages.rs`: validate mentions (viewable members), persist `message_mention`, create notifications, emit WS; never parse ciphertext
- [X] T010 [US1] Include `mentioned_account_ids` on list/WS message payloads from `backend/src/db/message.rs` / `backend/src/api/messages.rs`
- [X] T011 [US1] Add `frontend/src/lib/mentionParse.ts` to extract `@handle` tokens and map to member `account_id`s
- [X] T012 [US1] On send in `frontend/src/pages/Channel.tsx`, attach `mentioned_account_ids` from plaintext before encrypt

**Checkpoint**: Valid `@handle` notifies target; self/invalid don’t.

---

## Phase 4: User Story 2 - Responder a uma mensagem (Priority: P1)

**Goal**: Reply control + `reply_to_message_id`; quote UI; notify parent author.

**Independent Test**: [quickstart.md](./quickstart.md) Replies; [contracts/channel-chat-ux.md](./contracts/channel-chat-ux.md) reply section.

### Tests for User Story 2

- [X] T013 [P] [US2] Add contract tests for `reply_to_message_id` (same channel, notify parent author, no self-notify, reply-to-reply) in `backend/tests/contract/` (e.g. extend `mentions.rs` or `replies.rs`)

### Implementation for User Story 2

- [X] T014 [US2] Persist/validate `reply_to_message_id` and create `reply` notifications in `backend/src/api/messages.rs` / `backend/src/db/message.rs`
- [X] T015 [US2] Expose `reply_to_*` on message JSON/WS in `backend/src/api/messages.rs`
- [X] T016 [US2] Reply icon on hover/focus + composer preview/cancel in `frontend/src/pages/Channel.tsx`
- [X] T017 [US2] Render parent quote on replied messages in `frontend/src/pages/Channel.tsx`; style in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Reply sends with parent; author notified; quote visible.

---

## Phase 5: User Story 3 - Notificações no topbar (Priority: P1)

**Goal**: Persistent mention/reply items in TopBar; deep-link to message or «indisponível»; mark read.

**Independent Test**: [quickstart.md](./quickstart.md) + [contracts/notifications-api.md](./contracts/notifications-api.md).

### Tests for User Story 3

- [X] T018 [P] [US3] Add contract tests for `GET /api/notifications`, mark-read, and deleted-message orphan (`message_id` null) in `backend/tests/contract/` (e.g. `notifications.rs`); register in `backend/tests/contract/mod.rs`

### Implementation for User Story 3

- [X] T019 [US3] Implement `backend/src/api/notifications.rs` (list unread, mark read) + routes in `backend/src/api/mod.rs`; WS `notification.created`
- [X] T020 [US3] Client helpers `fetchNotifications` / `markNotificationRead` in `frontend/src/api/client.ts`
- [X] T021 [US3] Extend TopBar panel in `frontend/src/shell/TopBar.tsx` with Menção/Resposta rows + badge (alongside session channel unseen)
- [X] T022 [US3] Deep-link `?msg=` (or equivalent) in `frontend/src/pages/ChannelRoute.tsx` / `Channel.tsx`; show «Mensagem indisponível» when missing; mark notification read on navigate

**Checkpoint**: Topbar shows durable items; click jumps or shows unavailable.

---

## Phase 6: User Story 4 - Destacar menções e respostas a mim (Priority: P1)

**Goal**: Personal highlight until message viewed (viewport); then clear + persist seen.

**Independent Test**: [quickstart.md](./quickstart.md) Highlight; [contracts/channel-chat-ux.md](./contracts/channel-chat-ux.md).

### Implementation for User Story 4

- [X] T023 [US4] Add `frontend/src/lib/highlightSeen.ts` (localStorage `mesa.highlightSeen`)
- [X] T024 [US4] Apply `.msg-highlight-me` in `frontend/src/pages/Channel.tsx` for unread-highlight mentions/replies-to-me; IntersectionObserver clears + persists; CSS in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Highlight shows then clears after view; does not return on re-scroll.

---

## Phase 7: User Story 5 - Scroll no presente e salto (Priority: P1)

**Goal**: Stick-to-bottom; floating jump chip only when new messages arrive while scrolled up.

**Independent Test**: [quickstart.md](./quickstart.md) Highlight & scroll; [contracts/channel-chat-ux.md](./contracts/channel-chat-ux.md).

### Implementation for User Story 5

- [X] T025 [US5] Implement stick-to-bottom + pending-new counter in `frontend/src/pages/Channel.tsx`
- [X] T026 [US5] Floating «Saltar para o presente» / «Novas mensagens» chip above composer (gap, not flush) in `frontend/src/pages/Channel.tsx` + `frontend/src/styles/mesa-theme.css`; click scrolls to latest

**Checkpoint**: Auto-follow at bottom; chip only with pending news; click restores present.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validation, docs Speckit.

- [X] T027 Optional: lightweight `@` typeahead in `frontend/src/pages/Channel.tsx` if cheap (not required for Done)
- [X] T028 Run `cargo test --test contract` and `cd frontend && ./node_modules/.bin/tsc --noEmit`; smoke [quickstart.md](./quickstart.md)
- [X] T029 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** → **Phase 2** → **US1** → **US2** (shares post_message) → **US3** (needs notifications from US1/US2) → **US4** / **US5** (FE can parallelize after message payloads exist)
- **Practical**: Foundational → US1 → US2 → US3 → US4 ∥ US5 → Polish

### User Story Dependencies

- **US1**: T002–T007
- **US2**: US1 post path + reply columns
- **US3**: Notifications created by US1/US2
- **US4**: Message list includes mention/reply metadata (US1/US2)
- **US5**: Independent of mentions after Channel scroll baseline (can start after T001; integrate with live message stream)

### Parallel Opportunities

- After T002: T003∥T004∥T006∥T007
- US1: T008∥T011; then T009–T012
- US4∥US5 after US2 payloads stable
- T029 docs after green tests

### Parallel Example: Foundational

```bash
# After T002:
# T003 message domain
# T004 notification domain
# T006 notification db
# T007 FE types
```

### Parallel Example: Late UX

```bash
# After US2/US3 APIs:
# T023–T024 highlight
# T025–T026 jump chip
```

---

## Implementation Strategy

### MVP (User Story 1)

1. Phase 1–2  
2. US1 mention metadata + notify  
3. Validate with T008 + quickstart Mentions  

### Incremental Delivery

1. US1 mentions  
2. US2 replies  
3. US3 topbar deep-link  
4. US4 highlight + US5 scroll  
5. Polish  

### Suggested MVP Scope

**US1 only** (mentions + server notifications) — core social value; TopBar list can be minimal stub until US3.

---

## Task Summary

| Phase | Tasks | Count |
|-------|-------|-------|
| Setup | T001 | 1 |
| Foundational | T002–T007 | 6 |
| US1 Mentions | T008–T012 | 5 |
| US2 Replies | T013–T017 | 5 |
| US3 Topbar | T018–T022 | 5 |
| US4 Highlight | T023–T024 | 2 |
| US5 Scroll | T025–T026 | 2 |
| Polish | T027–T029 | 3 |
| **Total** | | **29** |

| Story | Task IDs | Count |
|-------|----------|-------|
| US1 | T008–T012 | 5 |
| US2 | T013–T017 | 5 |
| US3 | T018–T022 | 5 |
| US4 | T023–T024 | 2 |
| US5 | T025–T026 | 2 |

**Format validation**: All tasks use `- [ ]`, sequential `Tnnn`, optional `[P]`, story `[USn]` on story phases only, and include concrete file paths.

**Independent tests**: quickstart sections + contracts per story.

**Next**: `/speckit-implement`
