# Contract: Delete text message API

## `DELETE /api/channels/{channel_id}/messages/{message_id}`

**Auth**: session cookie; MUST be member of the channel’s server.

**Channel**: MUST be type `text`. Otherwise **404** (or **400** with clear message — prefer **404** to avoid leaking).

### Authorization

Allow if any:

| Rule | Condition |
|------|-----------|
| Author | `message.sender_account_id == caller` |
| Channel creator | `channel.created_by_account_id == caller` |
| Server owner | `server.owner_account_id == caller` |

Else **403** — message unchanged.

### Success

- **204 No Content**
- Side effects: message row deleted; attachment rows gone; attachment files removed; WS broadcast:

```json
{
  "event": "message.deleted",
  "server_id": "<uuid>",
  "payload": {
    "id": "<message_uuid>",
    "channel_id": "<channel_uuid>"
  }
}
```

Sent via existing `send_to_server_members`.

### Errors

| Status | When |
|--------|------|
| 401 | Unauthenticated |
| 403 | Member but not author/creator/owner |
| 404 | Unknown message, wrong channel_id, non-text channel, or already deleted |
| 404 | Not a member (same pattern as other channel routes — follow existing `require_member` behaviour) |

### Attachments

After success, `GET /api/attachments/{id}` for former attachments → **404**.

## Client helpers (non-HTTP)

- `canDeleteMessage(me, message, channel, serverOwnerId): boolean` — mirror server rules for UI.
- On `message.deleted`, remove from local list when `payload.channel_id` matches open channel.
