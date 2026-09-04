# Data Model: 009-chat-media-embeds

## Message (existing, extended)

| Field | Type | Notes |
|-------|------|--------|
| id | UUID | PK |
| channel_id | UUID | FK channel |
| sender_account_id | UUID | FK account |
| content_ciphertext | BLOB | AES-GCM packed (server key); may encrypt empty string if media-only |
| created_at | datetime | |

**API extension**: list/post include `attachment_ids: string[]` (ordered). Cleartext ids on the wire/DB are OK; pixels remain ciphertext on disk.

### Validation

- Text channel only for create attachments / attach to messages.
- Reject post if ciphertext empty **and** `attachment_ids` empty.
- `attachment_ids.length` ∈ 0..=10; all ids must exist, belong to same channel, uploaded by sender (or unlinked pending), not already bound to another message.

## MessageAttachment (new)

| Field | Type | Notes |
|-------|------|--------|
| id | UUID | PK; storage filename |
| channel_id | UUID | FK; ACL scope |
| message_id | UUID? | FK message; null = uploaded pending link |
| uploader_account_id | UUID | FK |
| content_type | TEXT | One of allowed MIME |
| size_bytes | INTEGER | Ciphertext size; ≤ 8 MiB |
| created_at | datetime | |

**File**: `{ATTACHMENTS_DIR}/{id}` — opaque ciphertext bytes (no clear image).

### Relationships

- Channel 1—* Attachment
- Message 1—* Attachment (0–10)
- Account (uploader) 1—* Attachment

### State

```
uploaded (message_id null) → linked (message_id set on message create)
message deleted → attachments deleted (cascade) + files removed
```

## LinkPreview (ephemeral / optional cache)

Not a durable domain entity required for MVP. Response DTO:

| Field | Type | Notes |
|-------|------|--------|
| url | string | Canonical requested URL |
| kind | `link` \| `image` \| `video` | |
| title | string? | |
| description | string? | |
| image_url | string? | Thumbnail / direct image |
| site_name | string? | Domain or OG site_name |

Client may keep session Map\<url, preview\>.

## URL extraction (client)

After decrypt: regex/http(s) URLs; take first **5** for unfurl; remainder render as plain links only.
