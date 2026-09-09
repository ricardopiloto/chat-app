# Contract: App version display

**Feature**: 076-app-version-label  
**Surfaces**: `AuthShell` (public), `TopBar` (authenticated)

## Constant

| Name | Source | Format |
|------|--------|--------|
| Product version | `frontend/package.json` → `version` (Vite inject → `appVersion` helper) | `X.Y.Z` (no required `v` prefix) |

Public and authenticated UI MUST render the **identical** string for a given build.

## Public (Auth / Invite)

| Rule | Requirement |
|------|-------------|
| Location | Inside `.auth-pane-brand` **footer** (`.auth-brand-footer`), not under hero `.auth-brand-name` |
| Size | Small / muted secondary type |
| Presence | Visible on login/register and invite (shared AuthShell) |

## Authenticated (TopBar)

| Rule | Requirement |
|------|-------------|
| Location | Immediately **below** `.topbar-name` within the brand cluster (logo + text column) |
| Size | Small / muted; smaller than `.topbar-name` |
| Presence | Whenever TopBar brand is shown |

## Non-goals

- About modal / click-through changelog
- Backend version API
- Showing version when TopBar brand is hidden
