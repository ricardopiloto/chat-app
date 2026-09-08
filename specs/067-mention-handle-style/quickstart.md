# Quickstart: 067-mention-handle-style

**Contract**: [mention-handle-display](./contracts/mention-handle-display.md)

## Prerequisites

- Dev app running (text channel with ≥2 members).
- Ability to send messages containing `@handle` (065 picker or manual).

## A — Other’s handle is styled

1. As Alice, send `olá @bob` in a shared text channel.
2. Both Alice and Bob see `@bob` with background + bold in the message body.
3. Rest of the sentence is normal weight/background.

**Expect**: Token visually distinct; not the whole message bold.

## B — Self handle stays plain

1. As Bob, view a message that contains `@bob` (and optionally `@alice`).
2. `@bob` is **not** chip-styled; `@alice` is.

**Expect**: 062 row highlight for “mentioned me” may still apply; self token remains plain text.

## C — Multiple mentions

1. Send `@alice e @carol` (neither is the viewer, or viewer is a third person).
2. Both tokens styled independently.

## D — Non-handle @

1. Send a line containing an email-like `user@example.com` (if allowed by encrypt/send).
2. That `@` region is **not** a mention chip.

## E — Click available member

1. Click a styled `@bob` while Bob is still a server member.
2. Members panel opens; Bob’s row is focused/highlighted.

**Expect**: ≤3s feedback; panel usable.

## F — Click unavailable member

1. Message still shows `@exmember` styled (pattern), but they are no longer in the members list.
2. Click the chip.

**Expect**: No navigation error toast required; no crash; chip stays styled (no-op).

## Validation commands

```bash
cd frontend && npx tsc --noEmit
```

Manual A–F against running `npm run dev` + backend.
