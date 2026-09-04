# Contract: Channels & Servers — create custody + delete

## Create voice channel (extends existing POST)

**Request** (voice_video):

```json
{
  "name": "mesa-principal",
  "type": "voice_video",
  "channel_key_sealed": "<base64 sealed blob for custodian>",
  "custody_ack": true
}
```

- `custody_ack` MUST be true; `channel_key_sealed` MUST be non-empty.
- Text channels omit these fields.

**Response**: channel object including `created_by_account_id`, `e2ee_enabled: true`, `has_channel_key: true`.

**Errors**: 400 if voice without ack/key; 403 if not member/owner rules existing.

## DELETE `/api/channels/{id}`

- Auth: session; caller is `created_by` **or** server owner.
- **409** if this is the only channel on the server (`code: last_channel`).
- **403** otherwise unauthorized.
- **204** on success. CASCADE DB; broadcast `channel.deleted` to server members.
- Clients in that voice room MUST disconnect.

## DELETE `/api/servers/{id}`

- Auth: session; caller is `owner_account_id`.
- **204** on success. CASCADE all channels/memberships/…
- Broadcast `server.deleted`. Clients leave any voice on that server.

## GET channel list item (extends)

Include: `created_by_account_id`, `e2ee_enabled`, `has_channel_key` (bool derived from ChannelKey row).
