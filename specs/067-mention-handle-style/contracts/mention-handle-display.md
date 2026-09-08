# Contract: Mention handle display & activation

**Feature**: 067-mention-handle-style  
**Surface**: Text channel message body (`.msg-body` / MessageBody)

## Rendering

1. Input: decrypted plaintext + `meHandle` (session).
2. Tokenize with shared mention pattern (see `mentionParse`).
3. For each mention segment where `handle.toLowerCase() !== meHandle.toLowerCase()`:
   - Render chip `.msg-mention` with **background** + **bold** covering `@` + handle.
4. Reader’s own `@handle`: plain text (no `.msg-mention`).
5. Non-matching `@` (email, etc.): plain text.

## Activation

| Condition | Control | On activate |
|-----------|---------|-------------|
| Styled + `account_id` known in roster | `<button class="msg-mention">` (or equivalent) | Open members panel with `focusAccountId` |
| Styled + unknown roster | `<span class="msg-mention">` | No navigation |
| Unstyled (self / non-mention) | Text node | N/A |

## Members panel event (extension)

```ts
detail: {
  open?: boolean;
  toggle?: boolean;
  focusAccountId?: string; // optional; when opening, scroll/highlight this member
}
```

- Existing open/toggle behavior preserved.
- If `focusAccountId` set and panel opens: MembersPanel brings that row into view and applies a brief highlight; if id missing from list, ignore focus (panel may still open if `open: true` was requested — prefer only open when id known).

## Non-goals

- Composer draft highlighting
- Changing notification or POST mention APIs
- Replacing 062 personal message highlight
