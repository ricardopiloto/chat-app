# Research: 063-channel-acl-edit-parity

## R1 — Unify manage predicates

**Decision**: Replace narrow `can_manage_channel_acl(owner, creator)` with a richer check used by ACL, delete, inspect, and rename/patch:

```text
allowed =
  is_owner
  OR is_creator
  OR (can_manage_channels AND hierarchy_ok_vs_creator)
```

Implement as e.g. `can_manage_channel(is_owner, is_creator, can_manage_channels, actor_pos, creator_pos)` plus optional `can_acl_subject(actor_pos, subject_pos, …)` for FR-010(b).

**Rationale**: Spec FR-001/010; rename already has triad without hierarchy — align all surfaces.

**Alternatives considered**: Only widen ACL to manage_channels without hierarchy — rejected (clarify Q3 = B). Keep separate predicates per endpoint — rejected (drift).

## R2 — Hierarchy vs creator (FR-010a)

**Decision**:
- Compare `effective_position(actor)` vs `effective_position(creator)`.
- Owner actor → always pass.
- Creator actor on own channel → always pass (skip creator-position check).
- Manage-channels path → require `actor_pos > creator_pos` (strict).
- Creator left server / no role → `creator_pos = NO_ROLE_POSITION` (bottom) → any manage-channels member with a real role above bottom passes; if both have no role, `actor_pos > creator_pos` fails unless owner/creator path — prefer: if creator has no comparable membership, treat creator_pos as bottom so manage-channels may proceed (spec edge case).

**Rationale**: Matches kick/mute style `can_moderate_member` / `actor_pos > target_pos`.

**Alternatives considered**: Compare against highest role on channel ACL — too vague. Block if creator is server owner and actor is not — covered because creator who is owner has max position via owner flag when resolving creator as owner.

When channel creator **is** the server owner: `effective_position(true, _)` = MAX → only owner/creator paths succeed; manage-channels alone cannot manage owner-created channels. Acceptable and safe.

## R3 — Hierarchy vs ACL subjects (FR-010b)

**Decision**: On `PUT …/acl`, for each entry with `subject_type` account or role:
- Resolve subject position (account → member role position; role → `role.position`).
- If actor is not owner and not channel creator: require `actor_pos > subject_pos`.
- `everyone` subject: no position check (only channel-level FR-010a already applied).

**Rationale**: Spec US5 / FR-010(b).

**Alternatives considered**: Only check on Deny — rejected (Allow to higher role also sensitive).

## R4 — Delete / inspect / rename alignment

**Decision**:
- **Delete**: BE already allows manage_channels without hierarchy — add FR-010a. FE `canDeleteChannel` today is owner|creator only — widen to match rename + hierarchy when positions available, else show for manage_channels and let API enforce hierarchy.
- **Inspect** (`GET …/access/{id}`): Today owner | manage_channels | manage_roles. Change to same manage-channel gate as ACL (FR-009): owner | creator | (manage_channels ∧ hierarchy). Drop standalone manage_roles-only inspect **or** keep manage_roles as additional OR — **prefer same as ACL only** (owner ∪ creator ∪ manage_channels+hierarchy) for consistency; manage_roles-only admins who cannot manage channels lose inspect on that channel (acceptable; they still have roles UI).
- **Rename / patch**: Apply same helper so rename cannot bypass hierarchy.

**Rationale**: Spec assumptions prefer one rule for rename, ACL, inspect, delete.

## R5 — Frontend capability helpers

**Decision**: Introduce `canManageChannel(me, server, channel, roles)` in Sidebar (or `lib/capabilities.ts`):
- owner / creator → true
- else `memberHasCapability(…, can_manage_channels)` and, if role positions are in loaded `roles` + member role ids, enforce `myPos > creatorPos`; if creator position unknown, return true for manage_channels and rely on API 403.

Use that helper for: context «Permissões do canal», delete, and rename entry points.

**Rationale**: FR-002/006 UI↔server consistency.

## R6 — Error codes

**Decision**: Reuse `hierarchy_denied` / forbidden messages consistent with roles API; ACL put subject hierarchy → `403` with clear PT message. No new migration.

**Rationale**: Existing client `errorMessage` / codes.

## R7 — Out of scope

**Decision**: Role permissions page (Geral/Texto/Voz), create channel, overwrite resolution semantics, last-channel-of-type protection — unchanged.

**Rationale**: Spec assumptions.
