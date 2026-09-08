# Research: 057-system-theme-preference

## R1 — Preference vs effective theme

**Decision**: Split types:
- `ThemePreference = "system" | "light" | "dark"` (stored / cycle state)
- `Theme = "light" | "dark"` (effective; applied as `data-theme`)

`readThemePreference()`: `light`/`dark`/`system` from `mesa.theme`, else `null` (treat UI as Sistema).  
`resolveTheme()` / `resolveEffectiveTheme()`: if pref is `light`|`dark` → that; if `system`|`null` → `systemTheme()` via `matchMedia("(prefers-color-scheme: light)")`.  
`writeThemePreference(pref)`: always writes the chosen value including `system`.

**Rationale**: Matches FR-001/005/006 and clarify (explicit `system`).

**Alternatives considered**: Only clear key for system — rejected in clarify Q3.

## R2 — FOUC / early apply

**Decision**:
1. Keep `bootTheme` on App + Auth mount.
2. Add a **small inline script** in `frontend/index.html` (before paint) that reads `mesa.theme` and sets `document.documentElement` `data-theme` to effective light/dark (same rules as resolve). No module import — duplicate minimal logic in ~10 lines.
3. Remove hardcoded `data-theme="dark"` from `AuthShell` and `AppShell` markup (use resolved value or omit until boot).

**Rationale**: Spec requires minimize flash (edge case); AuthShell currently forces dark and contradicts SC-001/005.

**Alternatives considered**: Only post-hydration boot — more flash on slow JS; rejected as insufficient.

## R3 — System preference listener

**Decision**: When preference is `system` or absent, subscribe to `matchMedia("(prefers-color-scheme: dark)")` `change` (or light query) and re-`applyTheme(systemTheme())`. Unsubscribe / ignore when preference is fixed light/dark. Register once from `bootTheme` or a `startThemeListeners()` called at app root.

**Rationale**: FR-007 / SC-004.

## R4 — Cross-tab sync

**Decision**: Listen to `window` `storage` for key `mesa.theme`. On event, re-read preference, apply effective theme, and notify TopBar (custom event `mesa:theme-preference` or shared callback/signal). Same event can be dispatched after local `writeThemePreference` so one code path updates UI (storage does not fire in the writing tab).

**Rationale**: FR-009 / SC-006; clarify Q4.

**Alternatives considered**: BroadcastChannel — unnecessary; `storage` is enough for localStorage.

## R5 — TopBar cycle UX

**Decision**: Single button cycles preference: `system → light → dark → system`.  
- Absent key: treat as **system** for cycle start (first click → `light`, and writes `light`).  
- Icons: system → dedicated monitor/system icon (or sun+moon composite if adding asset is heavy — prefer simple new `IconSystem` / reuse settings-like glyph); light → `IconSun`; dark → `IconMoon`.  
- `aria-label` / `title` reflect **preference**: «Tema: sistema» / «Tema claro» / «Tema escuro» (not only effective when on system).

**Rationale**: Clarify Q2 / FR-006.

## R6 — Auth / login surfaces

**Decision**: `AuthShell` and auth routes call `bootTheme` (or inherit `html[data-theme]` from early script). **No** theme toggle on Auth. TopBar only exists when authenticated.

**Rationale**: Clarify Q1 / FR-002.

## R7 — Migration

**Decision**: Existing `mesa.theme=light|dark` remain overrides. Invalid values → treat as absent. Never rewrite absent → `system` on load.

**Rationale**: FR-008 / FR-005.

## R8 — Backend

**Decision**: No backend changes.

**Rationale**: Local preference only (assumptions).
