# Contract: Owner role UI

**Feature**: 059-server-owner-role

## Perfis (`RolesManagePage`)

- System **Dono** appears in the list.
- **Apagar** (delete) control hidden/disabled for `is_system`.
- Opening permissions navigates to Role Permissions as today.

## Permissões (`RolePermissionsPage`)

When `role.is_system`:
- All capability toggles disabled / read-only.
- Save button disabled or hidden.
- Optional short note: perfil de sistema / não editável.

## Gerir membros (`MembersManagePage`)

| Row | Role control |
|-----|----------------|
| Server owner | Locked display «Dono» (disabled select or text); no Sem papel / other roles |
| Other members | `<select>` options = Sem papel ∪ roles where `!is_system` (**Dono** omitted) |

## Roster (`MembersPanel`)

Owner with Dono assignment groups under heading **Dono** (existing role-bucket logic — no special case beyond assignment existing).

## Acceptance probes

1. Owner row cannot change role in UI.
2. Other member picker has no Dono option.
3. Dono permissions page cannot Save.
4. Dono has no delete in Perfis.
