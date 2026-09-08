# Quickstart: 057-system-theme-preference

## Prerequisites

- Frontend `npm run dev` (auth + shell).
- Ability to change OS/browser color scheme (or DevTools → emulate `prefers-color-scheme`).
- DevTools → Application → Local Storage for origin (key `mesa.theme`).

## A — Follow system (no saved pref)

1. Delete `mesa.theme` if present.
2. Set OS/browser to **dark**. Reload login.
3. **Expect**: Login dark; no theme button on auth.
4. Sign in.
5. **Expect**: App dark; TopBar theme control labelled as **sistema** (or equivalent).
6. Switch OS to **light** without reload.
7. **Expect**: UI becomes light within ~2s; preference still sistema; key still absent **or** unchanged if never cycled.

## B — Override and persist

1. From authenticated app (OS dark), cycle until **claro**.
2. **Expect**: UI light; `mesa.theme=light`.
3. Reload app and open login in same origin.
4. **Expect**: Both light despite OS dark; login still has **no** theme button.

## C — Explicit system

1. Cycle until **sistema**.
2. **Expect**: `mesa.theme=system`; UI matches OS.
3. Change OS scheme.
4. **Expect**: UI follows; key remains `system`.

## D — Cross-tab

1. Open two authenticated tabs.
2. Cycle theme in tab 1.
3. **Expect**: Tab 2 theme + button state update within ~2s without reload.

## E — Legacy + hardcode regression

1. Manually set `mesa.theme=dark`, OS light → UI dark (legacy override kept).
2. Confirm AuthShell/AppShell do **not** force dark when preference/system is light.

## Validation commands

```bash
cd frontend && ./node_modules/.bin/tsc --noEmit
```

No backend tests.
