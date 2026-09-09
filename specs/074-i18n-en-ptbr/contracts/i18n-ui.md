# Contract: i18n UI (client)

**Feature**: [074-i18n-en-ptbr](../spec.md)  
**Audience**: Frontend implementers

## Supported locales

| Code | UI label (example) |
|------|--------------------|
| `pt-BR` | Português (Brasil) |
| `en` | English |

Selector MUST list **only** these two in this phase.

## Resolution order

1. Valid stored `mesa.locale` (or agreed prefs key)
2. Else detect from `navigator.languages` / `navigator.language` (`en*` → `en`, `pt*` → `pt-BR`, else `pt-BR`) and **persist** so reload is stable
3. `t(key)` uses active locale; missing key → `pt-BR` → raw key

## Auth screen

- MUST render in the resolved locale.
- MUST NOT require a language picker to get a correct first-paint language.
- Manual change is **not** required on auth (Account menu after login).

## Authenticated: Account menu

- MUST expose language control with exactly two options.
- On change: update active locale immediately; persist; **no** logout / unlock.
- aria-label / accessible name required.

## What is translated

| Kind | Translate? |
|------|------------|
| Product chrome (buttons, nav, empty states, toasts of product, settings labels, auth copy) | Yes |
| Day / notif relative labels (Hoje/Today, …) | Yes |
| System role display names (e.g. Dono → Owner) | Yes |
| Chat message bodies | No |
| Channel / server names | No |
| Custom role names | No |
| User handles | No |
| Unmapped raw API errors | Optional / may stay as returned |

## Extensibility

Adding a locale = new catalog module + add to `SUPPORTED_LOCALES` + selector option — no per-screen redesign solely for string wiring.

## Validation

See [quickstart.md](../quickstart.md).
