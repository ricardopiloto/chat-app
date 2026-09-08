# Research: 062-message-mentions-replies

**Date**: 2026-09-08  
**Spec**: [spec.md](./spec.md)

## R1 — Mentions under E2EE (clarify Q1)

**Decision**: Client parses `@handle` from **plaintext before encrypt**, resolves to `account_id`s among server/channel-visible members, and POSTs `mentioned_account_ids: Uuid[]` with the message. Server validates each id (membership + can view channel), drops self and invalids, inserts notification rows, does **not** inspect ciphertext.

**Rationale**: Spec clarification; preserves E2EE; matches Discord-style “mention metadata” pattern.

**Alternatives considered**: Server plaintext parse (rejected); notifications-only client-side with no server (rejected — topbar across devices needs server).

---

## R2 — Reply parent (clarify Q4)

**Decision**: Optional `reply_to_message_id` on `message` (nullable FK → same channel). Reply to any message including another reply; single parent only; no thread UI.

**Rationale**: Clarify A; minimal schema; UI shows quote of parent (decrypt parent ciphertext client-side when loaded).

**Alternatives considered**: Top-level-only replies; nested thread table (rejected).

---

## R3 — Notification persistence & topbar

**Decision**: New table `user_notification` (mention | reply) persisted per account. Extend TopBar **Notificações** to list these items (kind, actor handle when known, channel name/id, deep-link `message_id`) **in addition to** existing session `unseen` channel activity (keep both; distinguish visually).

API:
- `GET /api/notifications` — recent unread (+ optional include read)
- `POST /api/notifications/{id}/read` or mark read on navigate
- WS event `notification.created` to the target account

**Rationale**: Spec requires topbar items that survive refresh; current `preferences/notifications.ts` is session-only channel unseen.

**Alternatives considered**: Session-only mention list (fails refresh); replace channel-unseen entirely (out of scope / regressive).

---

## R4 — Deep-link & missing message (clarify Q2)

**Decision**: Notification payload includes `channel_id` + `message_id`. FE navigates to `/channels/{id}?msg={messageId}` (or hash). Channel loads/scrolls to message; brief flash. If `GET` message missing → toast/banner «Mensagem indisponível».

**Rationale**: Clarify C.

---

## R5 — Personal highlight until viewed (clarify Q5)

**Decision**: FE highlights rows where (a) `mentioned_account_ids` includes me, or (b) `reply_to` author’s message is mine — until the row intersects the viewport (IntersectionObserver). Persist “seen highlight” ids in `localStorage` (`mesa.highlightSeen` map) so they don’t reappear after scroll-away.

Server may still expose `mentioned_account_ids` / `reply_to_message_id` + parent `sender_account_id` on message JSON for clients.

**Rationale**: Clarify B; no need for server round-trip per viewport tick.

**Alternatives considered**: Permanent highlight; highlight tied only to notification read (weaker for in-channel browsing).

---

## R6 — Jump-to-present chip (clarify Q3)

**Decision**: Pure FE in `Channel.tsx`: track `stickToBottom`; on scroll-up set false; when WS/new message arrives while `!stickToBottom`, set `pendingNewCount++` and show floating chip above composer (absolute/fixed with gap — not in document flow colliding with `.composer`). Click → scroll to end, clear pending, `stickToBottom=true`. No chip if scrolled up with zero new arrivals.

**Rationale**: Clarify B; no API.

---

## R7 — Migration id

**Decision**: `0018_message_mentions_replies.sql` (after `0017`).

---

## R8 — Autocomplete

**Decision**: v1 minimum = full `@handle` token match on send; optional typeahead in composer if cheap (member list already available). Spec treats autocomplete as nice-to-have.

**Rationale**: Spec Assumptions.
