# Contract: Message mentions & replies API

**Feature**: 062-message-mentions-replies  
**Surfaces**: `POST/GET /api/channels/{id}/messages`, message delete side-effects

## POST body (extended)

```json
{
  "content_ciphertext": "<base64>",
  "attachment_ids": [],
  "mentioned_account_ids": ["uuid…"],
  "reply_to_message_id": "uuid…"
}
```

- `mentioned_account_ids` optional; default `[]`
- `reply_to_message_id` optional
- Auth: existing write gate + mute rules
- Server validates mentions/reply; never parses ciphertext
- Creates `user_notification` rows; WS `message.created` (extended payload) + `notification.created` to targets

## Message list / WS payload

Include `reply_to_message_id`, `mentioned_account_ids`, and when parent exists `reply_to_sender_account_id`.

## Errors

- Invalid reply parent (wrong channel / missing): `400`
- Oversized mention list: `400`
- Invalid mention ids: silently skipped (send still succeeds) per FR-003 spirit for unknown handles; explicit bad UUIDs may 400
