# Research: 060-permissions-parity-phase1

**Date**: 2026-09-08  
**Spec**: [spec.md](./spec.md)  
**Gap**: [gap-analysis.md](./gap-analysis.md)

## R1 — Role hierarchy storage

**Decision**: Add `server_role.position` (`INTEGER NOT NULL`). **Higher value = more administrative authority**. System **Dono** (`is_system=1`) is pinned to a reserved high value (e.g. `1000`) and treated as above every non-owner actor; server `owner_account_id` always wins even without the Dono role row. Members **without** a role have effective position `-1` (below all roles).

**New roles (FR-001a)**: Insert at the **bottom** — `position = MIN(non-system positions) - 1`, or `0` if none exist (Dono stays at reserved top).

**Backfill**: Dono → reserved top; remaining roles ordered by `created_at ASC` then `name` get `10, 20, 30…` (older = higher).

**Rationale**: Matches Discord “higher role wins admin-on-member”; integer sort is trivial in SQLite; single-role (052) means one position per member.

**Alternatives considered**: Float/lexicographic ranks (unnecessary); lower=higher (confusing vs Discord docs); only owner may reorder (rejected — clarify Q4).

---

## R2 — Hierarchy gates (which actions)

**Decision**: Require `actor_position > target_position` (strict) when the actor is **not** the server owner, for at least:

- Kick / remove member (`can_remove_members`)
- Channel mute (`can_mute_members`)
- Assign / change member role
- Edit / delete / **reorder** roles (target role position must be `<` actor’s; cannot move a role to ≥ actor’s position)

Equal rank → deny. Owner → allow (except cannot be kicked / demoted by others).

**Rationale**: Spec FR-002/FR-003 + clarify Q4.

**Alternatives considered**: Soft warn only (rejected — security); ≥ allowed for peers (rejected — clarify equal = deny).

---

## R3 — Channel overwrite model (Allow/Deny + everyone)

**Decision**: Evolve `channel_acl` into Discord-like **overwrites**:

| Change | Detail |
|--------|--------|
| `subject_type` | Add `everyone` («todos os membros»). Keep `role`, `account`. |
| `subject_id` | For `everyone`, store nil UUID `00000000-0000-0000-0000-000000000000` (UNIQUE works). |
| `effect` | `allow` \| `deny` (default `allow` on migration). |
| `level` | Keep `read`/`write`/`listen`/`speak`. |

**Semantics of `level` + `effect`:**

| Intent | Encoding |
|--------|----------|
| Allow write / speak | `allow` + `write` / `speak` |
| Allow view-only (private) | `allow` + `read` / `listen` |
| Deny write / speak (keep view) | `deny` + `write` / `speak` |
| Deny **view** (private only) | `deny` + `read` / `listen` |
| Deny view on **public** | Reject `400` / no-op hide (FR-004a) |

**Resolution order (FR-005):**

```text
1. Base: membership + RoleCapabilities + public/private visibility
   (public → always view; private → no view until an Allow implies view)
2. Apply overwrite subject=everyone (allow/deny per right)
3. Apply overwrite subject=member’s role (single role)
4. Apply overwrite subject=account
5. Owner → full access (ignore denies)
```

**Rights tracked independently:** `view`, `write|speak` (text vs voice). A later layer **overwrites** the earlier decision for that right (not Discord’s “deny then allow aggregate across many roles” — single role makes last-writer-per-layer enough).

**Legacy (FR-006):** Existing rows → `effect=allow`; behaviour preserved for private grants and public level refinements. Deny is additive.

**Rationale**: Minimal schema delta; UI can extend ChannelAclPanel; clarify Q3 requires everyone layer.

**Alternatives considered**: Separate `allow_mask`/`deny_mask` integers (more Discord-pure, heavier FE); new table `channel_overwrite` (duplicate of ACL); skip everyone (rejected — Q3).

---

## R4 — Base access after overwrites land

**Decision**:

- **Public**: base `view=true`; base level from caps (`can_send_messages` → write, else read; voice analogous). Overwrites may Deny write/speak; **must not** Deny view.
- **Private**: base `view=false` (except owner). Allow read/write/listen/speak grants view. Creator seed remains `allow`+max level on create.
- Role caps still gate “can this role ever send/speak” before/with overwrites — overwrite Allow cannot grant a capability the role lacks **unless** we treat overwrite as channel-local exception. **Product choice:** channel Allow **may** grant write in-channel even if role `can_send_messages=false` (Discord overwrite can grant channel perms the role lacks at guild level for some bits). **Safer Phase 1:** overwrite Deny always wins to remove; overwrite Allow grants channel right **only if** role cap OR owner would allow that class of action at server level for send/speak — **except** private view, which is purely overwrite-driven.

**Refined Phase 1 rule (implement):**

1. Compute channel view/level from visibility + overwrite stack (R3).
2. Intersect with role caps: if `!can_send_messages` → cannot write even if Allow write (unless owner). Same for voice connect/speak.
3. Owner bypasses all.

**Rationale**: Avoids “ACL Allow turns mute role into writer everywhere” surprises while still supporting GM-secret Deny.

**Alternatives considered**: Overwrite fully supersedes caps (powerful but surprising); caps fully supersede Allow (breaks “allow one player into private” if they somehow lack view cap — private view is overwrite-only).

---

## R5 — Explainability + inspect UI

**Decision**:

1. **Denial errors**: `403`/`404` bodies include machine `code` + PT `message`, e.g. `hierarchy_denied`, `channel_overwrite_deny`, `missing_capability`. Prefer `404` for hidden private channels (no leak); use `403`+code when the resource is known (send denied, kick denied).
2. **Inspect API**: `GET /api/channels/{channel_id}/access/{account_id}` (admin: owner ∪ `can_manage_channels` ∪ `can_manage_roles`) returns `{ allowed_view, level, factors[] }` from the **same** domain resolver used by authz.
3. **Inspect UI** (clarify Q2): settings or channel ACL flow — pick member + show factors (required in Phase 1; gap-analysis “simulation Phase 2” superseded by clarify).

**Rationale**: FR-007 / FR-007a / FR-008 single engine.

**Alternatives considered**: Errors only (rejected — Q2); full “what-if” simulator (defer extras; inspect real member×channel is enough).

---

## R6 — Central authz surface

**Decision**: Extend `domain/permissions.rs` with:

- `effective_channel_access_v2(… overwrites …) -> AccessDecision { access, factors }`
- `can_moderate_member(actor_pos, target_pos, is_owner) -> Result<(), Denial>`
- `can_manage_role(actor_pos, target_role_pos, is_owner) -> …`

Wire `api/authz.rs` kick/mute/assign/ACL write paths through these. Do **not** rewrite every legacy call site in one PR if behaviour is equivalent — prioritize hierarchy + overwrite + explain call sites listed in plan.

**Rationale**: Spec FR-008 foundation without big-bang rewrite.

**Alternatives considered**: New `authz` crate (overkill); only document without code centralisation (rejected).

---

## R7 — Migration id

**Decision**: Next migration `0017_permissions_parity_phase1.sql` (after `0016_server_owner_role.sql`).

**Rationale**: Sequential numbering in repo.
