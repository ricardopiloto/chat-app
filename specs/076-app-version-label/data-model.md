# Data Model: 076-app-version-label

## ProductVersion (presentation)

| Field | Type | Rules |
|-------|------|--------|
| `value` | string | Semver-like product release, e.g. `0.5.0`. Non-empty. Same value for public + authenticated UI. |
| `source` | metadata | Taken from `frontend/package.json` `version` at build/dev time. |

**Invariants**:
- Display string MUST equal the FE package version after alignment to product release.
- MUST NOT use git SHA / build id as the primary visible label (FR-005).
- `backend/Cargo.toml` `version` SHOULD match the same product release (repo policy / CHANGELOG), even though UI does not read it.

## Surfaces (not persisted entities)

| Surface | Placement | Markup intent |
|---------|-----------|---------------|
| Public AuthShell | Footer of brand pane | `.auth-brand-footer` → version element after instance note |
| Authenticated TopBar | Under app name | Brand text column: name then version |

No database tables, migrations, or API DTOs.
