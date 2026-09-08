# Contract: Settings nav IA

**Feature**: 056-server-settings-shell  
**Surface**: Sidebar in settings mode

## Groups (v1)

### Pessoas

| Item | Route |
|------|--------|
| Membros | `/servers/:serverId/settings/members` |

Visible: owner ∨ `can_manage_roles`.

### Funções

| Item | Route |
|------|--------|
| Perfis | `/servers/:serverId/settings/roles` |

Visible: owner ∨ `can_manage_roles`.  
From Perfis, «Permissões» links to `/servers/:serverId/settings/roles/:roleId/permissions`.

### Servidor

| Item | Route |
|------|--------|
| Imagem do servidor | `/servers/:serverId/settings/image` |
| Apagar servidor | `/servers/:serverId/settings/delete` |

Visible: owner only. Hide (do not show disabled) for non-owners.

## Behaviour

- Active item highlighted from current path.
- Empty groups (all items filtered out) MUST NOT render a lonely heading.
- Permissions: never navigate to a page the user cannot use without a clear denial; prefer omission from nav.

## Acceptance probes

1. Owner sees all three groups.
2. `can_manage_roles` non-owner sees Pessoas + Funções only.
3. Plain member sees no settings entry affordances.
