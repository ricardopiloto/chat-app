---
description: "Task list for apagar mensagens no canal de texto"
---

# Tasks: Apagar mensagens no canal de texto

**Input**: Design documents from `/specs/011-text-message-delete/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD formal na spec. Incluir contract tests Rust por [plan.md](./plan.md); `cargo test` + `npx tsc --noEmit` + manual [quickstart.md](./quickstart.md).

**Organization**: Setup (helper ACL + client) → Foundational (DB delete + limpeza anexos + rota) → US1 (autor + UI hover + WS) → US2 (criador canal) → US3 (dono servidor) → Polish. US2/US3 estendem a mesma ACL do DELETE; UI reutiliza `canDelete`.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`backend/src/`, `backend/tests/`, `frontend/src/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Helpers partilhados de permissão e API cliente.

- [X] T001 [P] Add `can_delete_text_message(sender_id, caller_id, channel_created_by, server_owner)` in `backend/src/domain/permissions.rs` (true if caller is author OR channel creator OR server owner)
- [X] T002 [P] Add `deleteMessage(channelId, messageId)` helper in `frontend/src/api/client.ts` (`DELETE /api/channels/{id}/messages/{messageId}`, treat 204 as success)
- [X] T003 [P] Add `canDeleteMessage(meId, senderId, channelCreatedBy, serverOwnerId)` mirror helper in `frontend/src/api/client.ts` (or `frontend/src/media/`-adjacent util — prefer `client.ts` or small `frontend/src/chat/permissions.ts`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Persistência hard-delete + ficheiros de anexo — **bloqueia** todas as stories.

**⚠️ CRITICAL**: US1–US3 dependem do DELETE funcional e limpeza de disco.

- [X] T004 Add `delete_by_id(pool, message_id, channel_id) -> Result<bool>` (or equivalent) in `backend/src/db/message.rs` — DELETE WHERE id AND channel_id; return whether a row was deleted
- [X] T005 [P] Add helpers in `backend/src/db/attachment.rs` to list attachment ids for a message and delete ciphertext files under `ATTACHMENTS_DIR` (reuse config path used by upload)
- [X] T006 Implement `DELETE` handler in `backend/src/api/messages.rs` per [contracts/message-delete-api.md](./contracts/message-delete-api.md): membership + text channel only; load message; ACL via T001; list/delete attachment files (T005); SQL delete message (T004); broadcast `message.deleted` `{ id, channel_id }` via `ws.send_to_server_members`; **204** / **403** / **404**
- [X] T007 Register `DELETE /api/channels/{channel_id}/messages/{message_id}` in `backend/src/api/mod.rs`

**Checkpoint**: Manual/curl DELETE as author returns 204; attachment file gone; second DELETE → 404.

---

## Phase 3: User Story 1 - Apagar a própria mensagem (Priority: P1) 🎯 MVP

**Goal**: Autor vê «Apagar» no hover/foco, confirma, mensagem some localmente e nos outros clientes via WS; não-autor sem poderes não vê controlo.

**Independent Test**: [quickstart.md](./quickstart.md) §1.

### Implementation for User Story 1

- [X] T008 [P] [US1] Contract test: author can delete own message (204); non-author member gets 403; already-deleted → 404 in `backend/tests/contract/` (new file e.g. `message_delete.rs` or extend `messages.rs`)
- [X] T009 [US1] Pass `serverOwnerAccountId` (or full `Server`) into `frontend/src/pages/Channel.tsx` from parent shell/`Servers` so UI can evaluate `canDeleteMessage` (wire props through existing channel render path)
- [X] T010 [US1] In `frontend/src/pages/Channel.tsx`: show «Apagar» on message hover/focus when caller is **author**; `window.confirm` then `deleteMessage`; optimistically remove from local `messages` (or wait for WS); handle API errors
- [X] T011 [US1] Handle WS `message.deleted` in `frontend/src/pages/Channel.tsx` `onWs` — if `payload.channel_id` matches, remove message `id` from local list
- [X] T012 [P] [US1] CSS for message action button visible on `.msg-block:hover` / `:focus-within` in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Two clients — author deletes own message; both UIs update ≤3 s; peer sees no Apagar on author's remaining messages they don't own.

---

## Phase 4: User Story 2 - Criador do canal apaga qualquer mensagem (Priority: P1)

**Goal**: Criador do canal apaga mensagens alheias nesse canal; noutro canal onde não é criador, sem poder (salvo dono/autor).

**Independent Test**: [quickstart.md](./quickstart.md) §2.

### Implementation for User Story 2

- [X] T013 [P] [US2] Contract test: channel creator deletes another member's message in that channel → 204; same user cannot delete others' messages in a different channel they did not create → 403 in `backend/tests/contract/`
- [X] T014 [US2] Extend `canDelete` UI in `frontend/src/pages/Channel.tsx` to treat `channel.created_by_account_id === me.id` as allowed (same Apagar control + confirm)

**Checkpoint**: Creator moderates own channel; cannot moderate sibling channel solely by being creator elsewhere.

---

## Phase 5: User Story 3 - Dono do servidor apaga em qualquer canal texto (Priority: P1)

**Goal**: Owner apaga em qualquer canal de texto do servidor; poderes não cruzam servidores.

**Independent Test**: [quickstart.md](./quickstart.md) §3–§4.

### Implementation for User Story 3

- [X] T015 [P] [US3] Contract test: server owner deletes message in member-created text channel → 204; outsider/non-member denied per existing patterns in `backend/tests/contract/`
- [X] T016 [US3] Extend UI `canDelete` in `frontend/src/pages/Channel.tsx` for `serverOwnerAccountId === me.id`; verify attachment message delete clears media (manual or assert GET attachment 404 in contract test)
- [X] T017 [P] [US3] Contract test: delete message with attachment → attachment GET 404 / file removed in `backend/tests/contract/`

**Checkpoint**: Owner moderates any text channel; attachments gone; S1 owner has no power on S2.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validação transversal e docs de processo.

- [X] T018 Run `cd backend && cargo test` and fix message-delete regressions
- [X] T019 [P] Run `cd frontend && npx tsc --noEmit` and fix Channel/client types
- [X] T020 Execute manual scenarios in [quickstart.md](./quickstart.md) (§1–§5) and fix gaps
- [X] T021 [P] Update `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` after successful implement (workspace rule)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **blocks US1–US3**
- **US1**: After Foundational — MVP
- **US2**: After US1 UI plumbing (same control; ACL already in T006) — tests + UI flag
- **US3**: After Foundational; can parallelize backend tests with US2 UI
- **Polish**: After desired stories

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — author path + UI + WS
- **US2 (P1)**: Backend ACL already in T006; needs UI `created_by` + contract test
- **US3 (P1)**: Backend ACL already in T006; needs UI owner + attachment test

### Parallel Opportunities

- T001, T002, T003 in Setup
- T005 parallel with T004
- T008 / T013 / T015 / T017 tests after T007 (different assertions, same file ok sequentially)
- T012 CSS parallel with T010
- T018 / T019 in polish

### Parallel Example: Setup

```bash
Task: "can_delete_text_message in backend/src/domain/permissions.rs"
Task: "deleteMessage in frontend/src/api/client.ts"
Task: "canDeleteMessage helper in frontend"
```

### Parallel Example: After Foundational

```bash
Task: "US1 author contract test"
Task: "CSS hover actions in mesa-theme.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 + Phase 2 (DELETE + files + WS broadcast)
2. Phase 3 US1 (author UI + confirm + WS client)
3. **STOP**: validate quickstart §1
4. Then US2 / US3 ACL UI + tests → Polish

### Incremental Delivery

1. API delete foundation → curl-ready  
2. Author UX → daily value  
3. Channel creator moderation  
4. Server owner + attachment cleanup proof  

---

## Notes

- No schema migration
- Soft-delete / tombstone out of scope
- Voice channels: DELETE must 404
- Format validation: all tasks use `- [X] Txxx …` with paths
