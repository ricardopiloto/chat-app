# Contract: Server name menu (Membros + Perfis)

**Feature**: 052-members-role-assignment  
**Surface**: Sidebar server header (server name control)

## Menu entries

| Entry | Visible when | Action |
|-------|--------------|--------|
| **Membros** | Owner or `can_manage_roles` | Navigate to members manage page |
| **Perfis** | Owner or `can_manage_roles` | Open roles definition dialog (`RolesPanel`) |

**Convite**: stays on existing header control — **not** required in this menu.

## Behaviour

1. Activating the server name opens the menu (or equivalent disclosure).
2. Without manage permission: management entries hidden; name control may still show identity-only or omit the menu.
3. **Perfis** must not include member-assignment UI (see single-role contract).

## Acceptance probes

1. Owner: menu shows Membros + Perfis; invite icon still in header.
2. Member without `can_manage_roles`: no Membros/Perfis management entries.
3. Perfis → create role works; no member checkboxes.
