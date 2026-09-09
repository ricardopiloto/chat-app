# Research: 074-i18n-en-ptbr

## R1 — Library vs custom catalog

**Decision**: Custom `frontend/src/i18n/` with TS catalogs + Solid reactive locale (context or module signal). **No** i18next / `@solid-primitives/i18n` for MVP.

**Rationale**: Repo already uses small preference helpers (`localPrefs`, theme); full UI migration is the bulk of work, not ICU plural engines. Zero new dependency; typed keys can be enforced gradually (`as const` catalogs). Extensible: add `es.ts` + register locale.

**Alternatives considered**: `@solid-primitives/i18n` — good, but extra dep for needs we can cover. i18next — heavier than needed for two flat locales.

## R2 — Locale detection & preference precedence

**Decision**:

1. If `mesa.locale` set → use it (manual preference).
2. Else map `navigator.languages` / `navigator.language`: `en*` → `en`, `pt*` → `pt-BR`, else → `pt-BR`.
3. Auth screen uses this resolved locale (no language picker required on auth).
4. Account menu writes preference and updates live signal.

**Rationale**: Matches clarify Q1 + default assumptions.

**Alternatives considered**: Always pt-BR until login — rejected (auth must auto-detect). Server Accept-Language — deferred (local-only pref).

## R3 — Catalog shape & fallback

**Decision**: Nested objects by domain (`auth.*`, `shell.*`, `channel.*`, `roles.system.owner`, …) with `t("a.b.c", params?)` dotted path. Missing key: try **pt-BR** fallback, then show key string. Both catalogs shipped in the main bundle for MVP.

**Rationale**: FR-008; pt-BR is current source of truth for product copy.

**Alternatives considered**: Lazy-load `en.json` — unnecessary for two small catalogs. No fallback — fails SC on incomplete migrations.

## R4 — Where strings live today / migration strategy

**Decision**: Inventory by area (Auth, AppShell/TopBar/Sidebar/UserPanel, Channel, Voice, Settings/Roles/Members, toasts, dialogs). Replace literals with `t(...)` in the same PR/feature until product UI has no leftover PT-only chrome. Keep **user content** (message bodies, channel/server names, custom role names) as raw fields.

**Rationale**: Clarify = 100% product UI.

**Alternatives considered**: “Core only” MVP — rejected by clarify A.

## R5 — Dates, relatives, system roles

**Decision**:

- `daySeparators` / `notifFormat`: take active locale (or call `t("day.today")` etc.); English months/abbrevs for `en`.
- System role display: if `role.is_system` (and/or known owner system role), show `t("roles.system.owner")` (and any other system labels); else `role.name`.

**Rationale**: FR-009, FR-005a.

**Alternatives considered**: `Intl.RelativeTimeFormat` only — still need product words Hoje/Today in catalog for consistency with rest of UI.

## R6 — Account menu control UX

**Decision**: In `AccountMenu`, add a compact language control: two options **Português (Brasil)** / **English** (labels can be shown in their own language or via `t`). Changing calls `setLocale` + persist; menu can stay open or close — prefer stay open so user sees immediate chrome update.

**Rationale**: Clarify Q5.

**Alternatives considered**: Topbar next to theme — rejected. Settings shell — rejected as primary.

## R7 — Backend errors

**Decision**: FE maps known `ApiError` / common Portuguese server strings to catalog keys where already patterned; unmapped errors may remain as returned (document in quickstart). No BE Accept-Language pipeline in this feature.

**Rationale**: Spec assumption; avoids large BE scope for 0.6.0 i18n.

**Alternatives considered**: Full server-side i18n — deferred.
