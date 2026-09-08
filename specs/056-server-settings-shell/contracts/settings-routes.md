# Contract: Settings routes

**Feature**: 056-server-settings-shell

## Canonical paths

| Path | Page | Notes |
|------|------|--------|
| `/servers/:serverId/settings` | Settings home placeholder | FR-003 |
| `/servers/:serverId/settings/members` | Members manage | Existing page, new path |
| `/servers/:serverId/settings/roles` | Roles manage page | From RolesPanel body |
| `/servers/:serverId/settings/roles/:roleId/permissions` | Role permissions | Existing page, new path |
| `/servers/:serverId/settings/image` | Server image | Owner |
| `/servers/:serverId/settings/delete` | Delete confirm | Owner; success → leave server / home |

## Redirects (legacy)

| From | To |
|------|-----|
| `/servers/:serverId/members` | `/servers/:serverId/settings/members` (+ preserve query if useful) |
| `/servers/:serverId/roles/:roleId/permissions` | `/servers/:serverId/settings/roles/:roleId/permissions` |

Deep-link/refresh on canonical or redirected paths MUST show settings sidebar chrome.

## returnTo / Voltar

- TopBar **X** is the primary exit from settings mode (to channel view).
- In-page «Voltar» on members/permissions MAY navigate to parent settings item (e.g. permissions → roles list) or settings home — MUST NOT be required to leave settings mode (X does that).
- Prefer dropping `returnTo` pointing at channel chat as the *only* exit once settings chrome exists.

## Acceptance probes

1. Open `/servers/:id/settings` → placeholder + nav.
2. Open legacy `/servers/:id/members` → lands in settings chrome with members page.
3. Delete success clears membership and leaves settings coherently.
