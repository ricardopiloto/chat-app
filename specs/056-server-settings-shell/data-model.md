# Data Model: 056-server-settings-shell

No new persisted entities. UI/route model only.

## ServerSettingsMode

| Field | Type | Notes |
|-------|------|--------|
| active | boolean | True when path matches `/servers/:serverId/settings` or child |
| serverId | string (UUID) | From route params |
| selectedItemId | string \| null | Derived from child path; `null` on settings home |

## SettingsNavGroup

| Field | Type | Notes |
|-------|------|--------|
| id | string | e.g. `people`, `roles`, `server` |
| label | string | Visible group heading |
| items | SettingsNavItem[] | Filtered by access |

## SettingsNavItem

| Field | Type | Notes |
|-------|------|--------|
| id | `members` \| `roles` \| `image` \| `delete` | Stable keys |
| label | string | Membros, Perfis, … |
| href | string | Absolute app path under settings prefix |
| visible | boolean | Computed from owner / `can_manage_roles` |

## Access rules (derived)

| Item | Visible when |
|------|----------------|
| members | `isOwner \|\| can_manage_roles` |
| roles | `isOwner \|\| can_manage_roles` |
| image | `isOwner` |
| delete | `isOwner` |

Gear / name entry: `visibleItems.length > 0`.

## State transitions

```text
[channel view]
    --gear|name--> [/settings] (placeholder)
    --nav item---> [/settings/<item>]
    --X----------> [last channel | /servers/:id]

[legacy /members]
    --redirect---> [/settings/members]

[legacy /roles/:id/permissions]
    --redirect---> [/settings/roles/:id/permissions]
```

## Validation

- Opening settings never auto-selects an item (selectedItemId stays null on home).
- Non-owner never receives image/delete items in the nav model.
- User without any visible item never sees gear/name settings affordance.
