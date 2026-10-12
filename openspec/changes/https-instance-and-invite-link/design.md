# Design

## Context

See proposal.md for why. `InviteDialog` builds the link with `location.origin`. In Electron that origin is `mesa://app` (`APP_ORIGIN` in `frontend/electron/main.ts`). `inviteUrl` already accepts an origin string and only appends `/invite/{code}` plus the hash; the tests pass `https://mesa.example`. `normalizeInstanceUrl` requires a scheme and allows `http:` and `https:`. The same function serves the first-launch screen and "Trocar de instância".

## Goals / Non-Goals

**Goals:**

- Copied invite links open on the instance the client is using.
- A host typed without a scheme is stored as an HTTPS origin after `/health` succeeds.

**Non-Goals:**

- Changing `mesa://app` as the window origin, or the invite hash format.
- Letting a local `http://` instance through. The spec refuses it.
- Changing how the web build finds its own origin.

## Decisions

1. **Invite origin.** On the web, keep `location.origin`. In the native client, use `currentInstance().baseUrl`. If that URL is missing, the dialog shows the existing error and does not build a `mesa://` link. Alternative considered: rewrite `mesa://app` inside `inviteUrl`. Rejected because that function does not know which instance is configured, and the contract tests call it with an explicit origin.

2. **Bare host.** `normalizeInstanceUrl` trims the input. If it has no `://`, prepend `https://` and then parse. A value that already has `https:` is parsed as today and stored as `url.origin`. `http:` throws a distinct error so the screen can say the instance must be HTTPS. Anything else (`mesa:`, `ftp:`) keeps the current invalid-protocol failure. A host with a port (`chat.exemplo.com:8443`) becomes `https://chat.exemplo.com:8443`. A path is dropped by `url.origin`, as it is today.

3. **Copy.** The placeholder becomes a host without a scheme (`chat.exemplo.com` / `chat.example.com`). The protocol message stops telling the person to type `http://` or `https://`.

## Risks / Trade-offs

- [A desktop dev server on `http://127.0.0.1` can no longer be entered] → That matches the requirement. A later change would have to allow it on purpose.
- [An invite copied on desktop points at the public site, not at the Electron window] → That is what lets the recipient create an account in a browser.

## Migration Plan

No stored invite links are rewritten. New copies use the instance origin. An instance already saved with `https://` is left as-is.

## Open Questions

None.
