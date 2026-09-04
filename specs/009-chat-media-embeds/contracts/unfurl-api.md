# Contract: Link unfurl API

## Semantics

- **Lazy**: client calls only after decrypting a message that contains http(s) URLs.
- **Not** invoked on message send by the server reading ciphertext.
- Up to **5** URLs per message (client responsibility).
- Failures → no card; plain link remains (FR-005).

## `POST /api/unfurl`

**Auth**: session required (any authenticated member; optionally require server membership if `server_id` passed — MVP: authenticated user is enough for public URL fetch, still rate-limited).

**Request**:
```json
{ "url": "https://example.com/page" }
```

**200** (success):
```json
{
  "url": "https://example.com/page",
  "kind": "link",
  "title": "Example",
  "description": "...",
  "image_url": "https://example.com/og.png",
  "site_name": "example.com"
}
```

`kind`:
- `image` — response was image/* or URL path looks like direct image and body is image
- `video` — OG type video / known video metadata
- `link` — default page card

**200** soft-fail (optional): `{ "url": "...", "kind": "link", "error": "unfurl_failed" }` without crashing UI — or **422/502** with body client ignores for card.

**400**: non-http(s), empty, overlong URL  
**401**: unauthenticated  
**429**: rate limit (recommended)

## Server safety

- Timeout (e.g. 5s); max response size for HTML/image probe.
- **SSRF**: block private, loopback, link-local, cloud metadata IPs; no `file:` / redirects to private.
- User-Agent identifiable; follow limited redirects.

## Client

- Extract URLs from decrypted text; request unfurl for first 5 unique.
- Render `LinkPreviewCard`; on failure show text link only.
- Do not send plaintext URLs to unfurl until message is decrypted for display.
