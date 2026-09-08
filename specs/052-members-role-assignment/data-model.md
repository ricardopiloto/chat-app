# Data Model: 052-members-role-assignment

## ServerRole

Sem mudança de campos de produto. Continua a expor `member_ids` (agora **partição** dos membros: cada account aparece em no máximo um papel do servidor).

## ServerRoleMember (junction)

| Field | Notes |
|-------|--------|
| `role_id` | FK → `server_role` |
| `account_id` | FK → `account` |
| `server_id` | Denormalizado (migração) para `UNIQUE(server_id, account_id)` |

**Invariant (FR-010)**: Para um dado `(server_id, account_id)` existe 0 ou 1 linha.

## Membership × Role

Logical: `ServerMember.role_id: Uuid | null` (derivado da junction ou campo espelho). Sem papel → capacidades baseline de membro (não owner).

## Presence

| Concept | Definition |
|---------|------------|
| Online | Conta com ≥1 ligação no `WsHub` |
| Offline | Membro do servidor sem ligação hub |
| Scope | Presença é **por conta na instância**, filtrada aos membros do servidor seleccionado |

Sem tabela persistente de «último visto».

## Migration 0014 (logical)

1. Backfill `server_id` em `server_role_member` a partir de `server_role`.
2. Para cada `(server_id, account_id)` com N>1: keep winner per FR-011; delete others.
3. Create `UNIQUE(server_id, account_id)` on `server_role_member`.

## State transitions

```text
Member role:
  (none) --assign--> RoleA
  RoleA  --assign--> RoleB   (replace)
  Role*  --clear---> (none)
  Role*  --role deleted--> (none)

Presence:
  offline --WS connect--> online
  online  --last WS disconnect--> offline
```

## Validation

- Assign role: target must be member of server; actor owner or `can_manage_roles`.
- Cannot assign second role without removing first (DB unique + API).
- Owner capabilities independent of role row.
