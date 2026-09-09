# Contract: Join welcome system message

**Feature**: 077-member-join-welcome  
**Event**: Prefer existing `message.new` with `kind: "system"` (clients ignore decrypt for system).

## Message DTO (system)

| Field | Value |
|-------|--------|
| `kind` | `"system"` |
| `content_plaintext` | Rendered welcome string |
| `content_ciphertext` | null / omitted |
| `sender_account_id` | null / omitted |
| `channel_id` | Resolved destination |
| `reply_to_message_id` | null |

## FE rendering

- Timeline row **centered**, muted/background (not `msg-group` author chrome).
- Do not run mention highlight / reply affordances as for user messages.
- Do not treat as the joining user’s authored message for personal unread/mention UX.

## Publish trigger

After successful invite-based membership (accept or register-via-invite), non-fatal.
