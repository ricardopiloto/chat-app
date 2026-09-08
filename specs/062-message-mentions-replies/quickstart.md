# Quickstart: 062-message-mentions-replies

**Contracts**: [mentions-replies-api](./contracts/mentions-replies-api.md), [notifications-api](./contracts/notifications-api.md), [channel-chat-ux](./contracts/channel-chat-ux.md)

## Prerequisites

- Backend migrated through `0018_…`; two accounts on one text channel with E2EE keys synced.

## Mentions

1. A types `@bob …` and sends → B sees topbar Notificações item **Menção**.
2. B opens item → lands on message (or «Mensagem indisponível» if deleted).
3. Invalid `@nobody` → message sends; no ghost notification.
4. A `@alice` (self) → no self-notification.

## Replies

1. Hover B’s message → Responder → send → quote UI; B gets **Resposta** notification.
2. Reply to a reply → notifies immediate parent author only.

## Highlight & scroll

1. Unread mention/reply-to-me shows highlight until scrolled into view; then normal.
2. At bottom, new messages keep scroll pinned.
3. Scroll up; receive new message → floating chip appears (not flush to composer); click → latest.
4. Scroll up with no new messages → no chip.

## Automated

```bash
cd backend && cargo test --test contract
cd frontend && ./node_modules/.bin/tsc --noEmit
```
