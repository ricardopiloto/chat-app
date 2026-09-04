# Contract: Encrypted attachments API

## Policy

| Rule | Value |
|------|--------|
| MIME | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |
| Max size | **8 MiB** ciphertext body per attachment |
| Max per message | **10** |
| Encryption | Client AES-GCM with **server key**; body = opaque bytes (IV‖CT packing same as messages) |
| Channels | **text** only |

## `POST /api/channels/{channel_id}/attachments`

**Auth**: session; must be server member; channel type `text`.

**Request**: raw body = ciphertext bytes  
**Headers**:
- `Content-Type: application/octet-stream`
- `X-Mesa-Media-Type: image/jpeg|image/png|image/webp|image/gif` (declared; validated allow-list)
- Optional `Content-Length`

**201**:
```json
{
  "id": "<uuid>",
  "channel_id": "<uuid>",
  "content_type": "image/png",
  "size_bytes": 12345,
  "created_at": "<iso8601>"
}
```

**400**: bad MIME, empty body, oversize  
**403/404**: not member / wrong channel type

## `GET /api/attachments/{attachment_id}`

**Auth**: session; must be member of attachment’s server; respect invite history rules if attachment’s message is filtered (same as message visibility — if message not listable, deny).

**200**: `application/octet-stream` body = ciphertext  
**Headers**: `X-Mesa-Media-Type: <content_type>`

**403/404**: non-member or missing

## `POST /api/channels/{channel_id}/messages` (extended)

```json
{
  "content_ciphertext": "<base64>",
  "attachment_ids": ["<uuid>", "..."]
}
```

- `attachment_ids` optional; default `[]`; max 10.
- If ciphertext decodes to empty **and** `attachment_ids` empty → 400.
- On success: bind attachments to message; include `attachment_ids` on Message JSON + `message.new` WS payload.

## `GET /api/channels/{channel_id}/messages`

Each message includes `attachment_ids: string[]` (ordered) and existing fields.
