# Research: 059-server-owner-role

## R1 — Identify system role by flag, not only by name

**Decision**: Add `server_role.is_system INTEGER NOT NULL DEFAULT 0`. The auto **Dono** role has `is_system = 1`. Display name remains exactly `Dono`. Protection and FE gates use `is_system` (and/or match name for create collision).

**Rationale**: Hand-made roles named «Dono» can be promoted during migration; rename is forbidden so name stays stable, but a flag makes deletes/patches unambiguous if data is odd.

**Alternatives considered**: Name-only detection — fragile if casing/spaces creep in. Separate `owner_role_id` on `server` — extra FK, unnecessary for v1.

## R2 — Bootstrap on create_server

**Decision**: After server row + owner membership (+ existing channel provision), call `ensure_dono_role(server_id, owner_account_id)`: insert role name `Dono`, caps = `RoleCapabilities::owner_all()`, `is_system=1`, `set_member_role(owner → that role)`.

**Rationale**: Spec US1/FR-001–003; single place for create path.

**Alternatives considered**: Lazy create on first roles list — owner would flash under «Sem papel». Rejected.

## R3 — Migration / backfill

**Decision**: Migration `0016`:
1. Add `is_system`.
2. For each server: if a role named exactly `Dono` exists, set `is_system=1` and force caps to owner_all; else insert new system Dono.
3. Assign `server.owner_account_id` to that role (clear any prior `server_role_member` for that account on this server first — single-role model).

**Rationale**: Clarify Q2 — always force owner onto Dono; previous role stays in catalog.

**Alternatives considered**: Keep prior owner role (clarify B/C) — rejected.

## R4 — API protection

**Decision**:
- `DELETE …/roles/{id}` → 403/409 if `is_system`.
- `PATCH …/roles/{id}` → reject name change and capabilities change for `is_system` (403/400); optionally allow no-op body.
- `POST …/roles` → reject name trim-equals `Dono` (case-sensitive exact product string).
- `PUT …/members/{id}/role` → if target role is system Dono and account ≠ owner → 403; if account is owner and `role_id` is null or not the system Dono → 403.

**Rationale**: Spec FR-005–008, FR-011.

## R5 — FE behaviour

**Decision**: Expose `is_system` on `ServerRole` JSON. `MembersManagePage`: filter `is_system` out of `<option>` for non-owner rows; owner row shows fixed «Dono» (disabled select or plain text). `RolePermissionsPage`: if `is_system`, disable toggles + Save. `RolesManagePage`: hide Apagar for system role; no rename control.

**Rationale**: Clarify Q1/Q3.

**Alternatives considered**: Show Dono disabled in picker (clarify C) — rejected in favor of hide.
