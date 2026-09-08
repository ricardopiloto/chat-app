# Implementation Plan: Menções @ e resposta a mensagens

**Branch**: `062-message-mentions-replies` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/062-message-mentions-replies/spec.md`

**Note**: `.specify/feature.json` → `specs/062-message-mentions-replies`. Clarifications 2026-09-08 integrated (E2EE metadata, deep-link, jump chip, single parent, highlight-until-viewed).

## Summary

Canais de texto: `@handle` via **metadados de menção no POST** (cliente resolve; servidor notifica sem ler ciphertext); **resposta** com `reply_to_message_id` (um pai); painel **Notificações** do topbar com itens persistentes menção/resposta e deep-link à mensagem (ou aviso indisponível); **destaque pessoal** até a mensagem ser vista; **auto-scroll** no presente + chip flutuante «saltar para o presente» só com mensagens novas fora do fundo.

## Technical Context

**Language/Version**: Rust 2021 (Axum/SQLx) + TypeScript / SolidJS.

**Primary Dependencies**: `backend/src/api/messages.rs`, `domain/message.rs`, `db/message.rs`, `ws`; FE `Channel.tsx`, `TopBar.tsx`, `preferences/notifications.ts`, `client.ts`, `mesa-theme.css`.

**Storage**: SQLite `0018_message_mentions_replies.sql` — `message.reply_to_message_id`, `message_mention`, `user_notification`.

**Testing**: `cargo test --test contract` (post mentions/replies, notifications, delete orphan); `tsc --noEmit`; [quickstart.md](./quickstart.md).

**Target Platform**: Mesa SPA + API (text channels only).

**Project Type**: Web app (`backend/` + `frontend/`).

**Performance Goals**: Notification insert O(mentions); list notifications O(unread) small; FE IntersectionObserver per highlighted row; jump chip O(1).

**Constraints**: FR-001–016 + clarifications; E2EE intact; no thread UI; voice out of scope; autocomplete optional.

**Scale/Scope**: One migration; message + notification APIs; TopBar + Channel UX (reply, highlight, scroll).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contract + quickstart |
| Complexity Tracking | Abaixo |

**Gate: PASS**

### Complexity Tracking

| Violation | Why needed | Simpler alternative rejected |
|-----------|------------|------------------------------|
| Persistent `user_notification` | Spec topbar across refresh | Session-only — rejected by refresh / multi-device need |
| Mention metadata table | Validate + list without ciphertext | Parse ciphertext — rejected E2EE |

### Re-check pós-Phase 1

Metadata mentions + reply FK + notifications API + FE UX contracts. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/062-message-mentions-replies/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── mentions-replies-api.md
│   ├── notifications-api.md
│   └── channel-chat-ux.md
└── spec.md
```

### Source Code (repository root)

```text
backend/migrations/0018_message_mentions_replies.sql
backend/src/domain/message.rs              # reply_to, mentions
backend/src/domain/notification.rs         # NEW
backend/src/db/message.rs                  # persist reply + mentions
backend/src/db/notification.rs             # NEW
backend/src/api/messages.rs                # POST body; notify
backend/src/api/notifications.rs           # NEW list/read
backend/src/api/mod.rs
backend/tests/contract/…                   # mentions, replies, notifications

frontend/src/api/client.ts
frontend/src/preferences/notifications.ts  # merge or parallel unread badge
frontend/src/lib/mentionParse.ts           # NEW @handle extract
frontend/src/lib/highlightSeen.ts          # NEW localStorage
frontend/src/pages/Channel.tsx             # reply UI, highlight, stick/jump
frontend/src/pages/ChannelRoute.tsx        # ?msg= deep-link
frontend/src/shell/TopBar.tsx              # notification items
frontend/src/styles/mesa-theme.css
```

**Structure Decision**: Server owns durable notifications + mention/reply metadata; client owns E2EE parse, highlight-seen, and scroll UX.

## Phase 0 / Phase 1 outputs

| Artifact | Path |
|----------|------|
| Research | [research.md](./research.md) |
| Data model | [data-model.md](./data-model.md) |
| Contracts | [contracts/](./contracts/) |
| Quickstart | [quickstart.md](./quickstart.md) |

**Next**: `/speckit-tasks`
