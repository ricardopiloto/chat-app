# Research: 009-chat-media-embeds

## 1. Client-side encryption for attachments

**Decision**: Encrypt attachment bytes with the existing **server key** (AES-GCM, same packing as `encryptMessage`: 12-byte IV ‖ ciphertext), before upload. Persist only opaque ciphertext on disk/DB metadata.

**Rationale**: Text already uses the server key for E2EE; reuse keeps one key-handoff model and satisfies FR-003/FR-008 (operator cannot read clear images from disk). Channel keys remain for voice E2EE only.

**Alternatives considered**: Per-attachment random keys sealed into message ciphertext (more complex, no product need yet); encrypt with channel key (wrong domain — text is server-key today).

## 2. Upload vs inline message body

**Decision**: Two-step — (1) `POST` encrypted blob → `attachment_id`; (2) `POST` message with `content_ciphertext` + `attachment_ids` (0–10). Download via `GET /api/attachments/{id}` (auth + membership); client decrypts.

**Rationale**: Avoids huge JSON base64 in message POST; allows size checks before message create; WS payload stays small (ids + metadata).

**Alternatives considered**: Multipart message+files in one request (harder WS/replay); store clear bytes (rejected by clarifications).

## 3. Size / MIME policy

**Decision**: Allowed MIME: `image/jpeg`, `image/png`, `image/webp`, `image/gif`. Max **8 MiB** per attachment (ciphertext body). Max **10** attachments per message. Reject 11th on client and server.

**Rationale**: Spec allows “few MB”; 8 MiB balances LAN UX and SQLite/disk; GIF included for animated memes.

**Alternatives considered**: 5 MiB (tighter); 10 MiB (heavier); sniff MIME from magic bytes after decrypt only (server cannot sniff clear — validate declared MIME + max size on ciphertext length).

## 4. Empty text + media-only messages

**Decision**: Allow `content_ciphertext` of encrypted empty string (or minimal ciphertext) when `attachment_ids.length ≥ 1`. Reject if both empty ciphertext **and** no attachments.

**Rationale**: FR / US3 — media-only messages valid; current API requires non-empty ciphertext alone.

## 5. Unfurl (lazy, server-side)

**Decision**: Authenticated `POST /api/unfurl` with `{ url }` after client decrypts. Server fetches URL with timeouts, SSRF guards (block private/link-local/metadata IPs), parses OG/Twitter meta or detects image Content-Type. No unfurl on message POST. Cap **5** URLs per message (client). Optional short in-memory/disk cache keyed by URL hash (not required for MVP).

**Rationale**: Matches clarifications (lazy view; URL visible to instance only on request; FR-009/FR-010).

**Alternatives considered**: Client-only unfurl (CORS/broken for many sites); unfurl at send time (rejected).

## 6. Video previews

**Decision**: No video file upload. Video = unfurl card (`kind: video`) from page metadata or known hosts when detectable; link remains clickable. No embedded player required in MVP.

**Rationale**: Spec out-of-scope for video files; SC-003 asks for useful cards.

## 7. Storage layout

**Decision**: Files under configurable dir (e.g. `ATTACHMENTS_DIR` default `./data/attachments/{attachment_id}`); SQLite row holds id, message_id (nullable until linked), channel_id, uploader, content_type, size_bytes, created_at. Orphan cleanup: delete unlinked uploads older than N hours (optional polish) or require link in same request window.

**Rationale**: Opaque blobs + membership ACL on GET; message delete can cascade attachments.

**Alternatives considered**: BLOBs in SQLite (worse for large GIFs).
