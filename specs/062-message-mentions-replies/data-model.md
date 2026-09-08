# Data Model: 062-message-mentions-replies

**Feature**: Menções @ e respostas  
**Storage**: SQLite — migration `0018_message_mentions_replies.sql`

## Extended: `message`

| Column | Type | Notes |
|--------|------|-------|
| `reply_to_message_id` | TEXT NULL FK → `message(id)` ON DELETE SET NULL | Same channel enforced in app |

Existing columns unchanged (`content_ciphertext`, etc.).

## New: `message_mention`

| Column | Type | Notes |
|--------|------|-------|
| `message_id` | TEXT FK → message ON DELETE CASCADE | |
| `account_id` | TEXT FK → account | Mentioned member |
| PK | `(message_id, account_id)` | |

Populated only from validated POST metadata (not from ciphertext).

## New: `user_notification`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | UUID |
| `account_id` | TEXT FK | Recipient |
| `kind` | TEXT | `mention` \| `reply` |
| `channel_id` | TEXT FK | |
| `message_id` | TEXT FK NULL | Target message (SET NULL on delete) |
| `actor_account_id` | TEXT FK | Who sent |
| `created_at` | TEXT | RFC3339 |
| `read_at` | TEXT NULL | Null = unread |

Indexes: `(account_id, read_at, created_at DESC)`.

## Message JSON (API extended)

```json
{
  "id": "…",
  "channel_id": "…",
  "sender_account_id": "…",
  "content_ciphertext": "…",
  "created_at": "…",
  "attachment_ids": [],
  "reply_to_message_id": null,
  "mentioned_account_ids": ["…"],
  "reply_to_sender_account_id": null
}
```

`reply_to_sender_account_id` optional denormalized for highlight without extra fetch when parent deleted → null.

## Client-only (no DB)

| Concept | Storage |
|---------|---------|
| Highlight seen | `localStorage` key e.g. `mesa.highlightSeen` → `{ [messageId]: true }` |
| Stick-to-bottom / pending new | In-memory per Channel mount |
| Session channel unseen | Existing `preferences/notifications.ts` (unchanged role) |

## State transitions

| Event | Effect |
|-------|--------|
| POST message + mentions | Insert mentions; create `user_notification` per eligible mentioned ≠ sender |
| POST message + reply_to | Set FK; if parent.sender ≠ me → notification `reply` to parent.sender |
| DELETE message | Mentions cascade; notification.message_id SET NULL; reply children keep orphan parent null |
| Open notification / mark read | Set `read_at` |
| Message in viewport | Client marks highlight seen locally |

## Validation

- `mentioned_account_ids`: max reasonable (e.g. 20); must be members who can view channel; ignore self
- `reply_to_message_id`: must exist in same channel
- Voice channels: reject mention/reply fields or ignore (text-only feature)
