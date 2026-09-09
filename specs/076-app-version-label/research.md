# Research: 076-app-version-label

## R1 — Source of the displayed product version

**Decision**: Inject **`frontend/package.json` → `version`** at Vite build/dev time into a shared FE constant (`APP_VERSION`). Align `frontend/package.json` and `backend/Cargo.toml` `version` fields to the **product release** in CHANGELOG (today **0.5.0** — both manifests currently say `0.1.0` and are stale).

**Rationale**: CHANGELOG states product versions align with those two manifests. Displaying from `package.json` keeps one FE source of truth without a new API. Syncing Cargo.toml preserves the documented alignment even though the UI does not read Rust.

**Alternatives considered**:
- Fetch version from backend `/api/...` — unnecessary latency and surface for MVP; reject.
- Hard-code `0.5.0` in components — drifts; reject.
- Read CHANGELOG at runtime — fragile; reject.
- Git commit hash as primary label — violates FR-005; reject (optional later as secondary).

## R2 — Injection mechanism

**Decision**: In `vite.config.ts`, `define` (or `envPrefix` + `loadEnv`) so UI reads something like `import.meta.env.VITE_APP_VERSION` **or** a compile-time `__APP_VERSION__` set from `JSON.parse(readFileSync('package.json')).version`. Prefer reading `package.json` in vite config so bumping the package version is enough for display. Export via `frontend/src/lib/appVersion.ts` as `export const APP_VERSION = ...` (typed string).

**Rationale**: Central module avoids duplicating env access in AuthShell and TopBar; easy to unit-smoke and keep SC-003 (same string).

**Alternatives considered**:
- Import `package.json` directly in components — works in Vite but noisier / JSON assert; helper + define is cleaner.
- Duplicate literals in AuthShell and TopBar — fails same-string guarantee over time.

## R3 — Public placement

**Decision**: Render version inside `.auth-brand-footer` (below or under the instance note), **not** under `.auth-brand-name` in the hero. Class e.g. `.app-version` / `.auth-app-version`, small muted type (~11–12px).

**Rationale**: Spec clarification: rodapé do `auth-pane-brand`. Auth/Invite already share `AuthShell`.

**Alternatives considered**: Under logo/name in hero — rejected by clarify.

## R4 — Authenticated placement

**Decision**: Restructure TopBar brand so logo stays left; right of logo a **column** with `.topbar-name` then `.app-version` (or `.topbar-version`) immediately below the name. Keep `aria-label` on brand sensible («Mesa» primary; version not conflating the product name).

**Rationale**: Spec clarification Q2 = below TopBar name. Current `.topbar-brand` is a single row; stacking name+version needs a small wrapper (e.g. `.topbar-brand-text`).

**Alternatives considered**: Beside name / account menu — rejected by clarify.

## R5 — Display format

**Decision**: Show bare semver **`X.Y.Z`** (e.g. `0.5.0`) **without** requiring a `v` prefix; optional accessible label «Versão 0.5.0» via `aria-label` / visually hidden text if useful. Same format both surfaces.

**Rationale**: Matches CHANGELOG section titles (`[0.5.0]`); assumptions allow optional `v` but consistency favors one choice.

**Alternatives considered**: `v0.5.0` — fine if consistent; prefer bare to match CHANGELOG heading style.

## R6 — i18n

**Decision**: Version digits are locale-invariant. If the project already localizes chrome (`t(...)`), do **not** translate the number; optional short prefix via i18n only if needed later. Auth instance note remains PT as today unless 074 lands first — out of scope to retranslate footer copy here.

**Rationale**: MVP is placement + correct product version string.
