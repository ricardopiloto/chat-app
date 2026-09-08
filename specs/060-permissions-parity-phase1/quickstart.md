# Quickstart: 060-permissions-parity-phase1

**Feature**: Paridade de permissionamento — Fase 1  
**Contracts**: [role-hierarchy.md](./contracts/role-hierarchy.md), [channel-overwrites.md](./contracts/channel-overwrites.md), [access-explain.md](./contracts/access-explain.md)

## Prerequisites

- Backend + frontend running (local SQLite with migrations through `0017_…`)
- Two non-owner test accounts + owner on one server
- Roles: e.g. Mestre (higher position) and Moderador (lower), both with kick/mute caps

## Hierarchy

1. As Moderador, try kick/mute a Mestre member → **denied**, message mentions hierarchy / `hierarchy_denied`.
2. As Moderador, kick/mute a member with lower/no role → **allowed** (if caps permit).
3. As non-owner with `can_manage_roles`, try move Mestre above self → **denied**; move a lower role → **ok**.
4. Create new role → appears at **bottom** of the list.

## Overwrites

1. Private channel: Deny view for role Jogador → those members **do not** see channel in list.
2. Same channel: Allow view for one account → that member **sees** it.
3. Public channel: Deny write for «todos» + Allow write for Mestre → Mestre can send; Jogador cannot; channel **still listed**.
4. Public: attempt Deny view → API **400** / UI blocks.

## Explain / inspect

1. Trigger hierarchy denial → UI shows PT explanation (not only HTTP status).
2. As admin, open inspect for member×channel → factors match the actual allow/deny behaviour.
3. Owner always shows full access in inspect even with Denies present.

## Automated

```bash
cd backend && cargo test --test contract
cd frontend && npx tsc --noEmit
```

Expect new/extended contract suites for hierarchy, overwrites, and access explain (names TBD in tasks).

## Regression

- Existing private ACL Allow-only channels still accessible to grantees after migration (`effect=allow`).
- Dono / owner behaviour unchanged for bypass.
