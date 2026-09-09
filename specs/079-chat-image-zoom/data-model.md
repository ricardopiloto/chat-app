# Data Model: 079-chat-image-zoom

Client presentation model only. No new server entities.

## Entities

### Message image attachment (existing)

| Field | Notes |
|-------|--------|
| `id` | Attachment UUID |
| `url` | Object URL of decrypted plaintext blob (session-local) |
| `contentType` | `image/jpeg` \| `image/png` \| `image/webp` \| `image/gif` |

Produced today by `MessageAttachments` decode loop.

### Lightbox session (UI state)

| Field | Type | Rules |
|-------|------|--------|
| `open` | boolean | Overlay mounted when true |
| `items` | attachment[] | Ordered images **of one message** |
| `index` | number | `0 … items.length-1` |
| `scale` | number | Current zoom; reset to **fit** when `index` changes or on open |
| `translate` | `{ x, y }` | Pan offset; reset with scale on image change |
| `fitScale` | number | `min(1, vw/nw, vh/nh)` from natural dimensions |
| `status` | `ready` \| `error` | Per current image element load |

## State transitions

```text
[closed] --activate attach img--> [open, index=i, scale=fit, pan=0]
[open] --Escape|backdrop|X--> [closed]
[open] --next (index < n-1)--> [open, index+1, scale=fit, pan=0]
[open] --prev (index > 0)--> [open, index-1, scale=fit, pan=0]
[open] --next at end / prev at start--> no-op (controls disabled)
[open] --zoom/pan--> scale/translate update (same index)
[open] --download--> browser save of current blob (if ready)
```

## Validation

- Gallery must not include non-image UI assets (avatars, etc.).
- `index` always in range while open.
- Download only when current item `ready` and `url` present.
