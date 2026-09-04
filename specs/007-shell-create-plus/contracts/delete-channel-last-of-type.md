# Contract: Delete channel — last of type

Extends [006 channels-servers-delete](../../006-prototype-ui-parity/contracts/channels-servers-delete.md).

## DELETE `/api/channels/{id}`

**Additional rule**:

- Before delete, count channels on the same server with the **same `type`** as the target.
- If that count is `<= 1`, respond **409** with a stable code, e.g.:

```json
{
  "error": "cannot delete the last text channel on a server",
  "code": "last_channel_of_type"
}
```

(Message MAY vary by type: text vs voice_video.)

- The previous **409** `last_channel` (only channel on server) remains valid as a special case of the same invariant.

**Client**: Context menu delete MUST surface the error message; channel remains listed.

## Unchanged

- Auth: creator or server owner.
- Broadcast `channel.deleted` on success.
- Create channel custody contract from 006 unchanged for section «+» flows.
