# Contract: Image lightbox UI (079)

**Feature**: [079-chat-image-zoom](../spec.md)  
**Scope**: Frontend lightbox for message attachment images. No HTTP API changes.  
**Related**: [009 attachments-api](../../009-chat-media-embeds/contracts/attachments-api.md) (existing fetch/decrypt).

## Entry

| Trigger | Behavior |
|---------|----------|
| Activate (click / keyboard) on a chat **message attachment** `<img>` | Open lightbox on that image’s message gallery at its index |
| Non-attachment images (avatar, server icon, link preview) | MUST NOT open this lightbox |

## Overlay chrome

| Control | MUST |
|---------|------|
| Dimmed backdrop | Present; click closes |
| Close (X) | Visible; closes |
| Escape | Closes |
| Image stage | Shows current attachment blob URL; initial **fit** (scale ≤ 1); no distort |
| Zoom in / out | Available after open (wheel and/or buttons); pan when overflowing |
| Reset / zoom out to fit | Possible without closing overlay |
| Previous / Next | When `items.length > 1`; disabled/no-op at ends; **no wrap**; reset fit on change |
| Download / save | Explicit control; downloads current plaintext blob; disabled on error/loading |

## Gallery scope

- Items = ordered successful image attachments of **one message** only.
- Changing image resets zoom/pan to fit.

## States

| State | UI |
|-------|-----|
| Ready | Image visible; download enabled |
| Error | Comprehensible message; close still works; download disabled |
| Closed | No residual overlay; chat interactive |

## Non-goals

- Channel-wide slideshow across messages  
- Editing / crop / annotations  
- New attachment upload or dual-resolution API  
- Opening ciphertext attachment URLs in a new tab as the download path  
