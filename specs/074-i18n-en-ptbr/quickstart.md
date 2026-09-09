# Quickstart: 074-i18n-en-ptbr

**Contract**: [i18n-ui](./contracts/i18n-ui.md)

## Prerequisites

- App running (`npm run dev` + backend as usual).
- Ability to clear site data / tweak `localStorage` key `mesa.locale`.
- Browser language switch or DevTools sensor for detection tests.

## A — Detect EN on auth

1. Clear `mesa.locale` (and reload).
2. Set browser language preference to English.
3. Open auth (logged out).

**Expect**: Auth UI in **English** without using a language picker.

## B — Detect PT-BR on auth

1. Clear `mesa.locale`; browser language Portuguese; open auth.

**Expect**: Auth UI in **PT-BR**.

## C — Change in Account menu + persist

1. Log in; open **account / user menu**.
2. Switch to the other language.

**Expect**: Shell/chrome updates immediately; **no** logout/unlock. F5 keeps the choice. Selector shows **only** EN and PT-BR.

## D — Full chrome coverage (spot check)

1. With EN active, visit: auth (or stay logged in), servers, text channel, voice chrome, notifications panel, settings/roles/members as available.

**Expect**: Product labels in EN (no leftover PT chrome). Repeat sample in PT-BR.

## E — User content unchanged

1. Note a channel name and a chat message.
2. Toggle language.

**Expect**: Channel name and message text **unchanged**. System role «Dono» (if shown) **does** switch display label; a custom role name does **not**.

## F — Day / relative labels

1. Open a text channel with day separators and/or notif timestamps.
2. Toggle EN ↔ PT-BR.

**Expect**: «Hoje»/«Ontem» (and EN equivalents) follow UI locale.

## Validation commands

```bash
cd frontend && npx tsc --noEmit
```

Manual A–F. Optional: grep for obvious leftover Portuguese chrome in new code paths after migration (best-effort).
