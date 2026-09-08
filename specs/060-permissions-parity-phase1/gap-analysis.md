# Gap analysis: Mesa vs Discord permission model

**Source**: [mesa_analise_permissionamento_discord.md](../../docs/design-ref/mesa_analise_permissionamento_discord.md)  
**Feature**: [060-permissions-parity-phase1](./spec.md)  
**Date**: 2026-09-08  

Compares the Discord reference model to **current Mesa** (post 047/052/058/059): single role per member, boolean role capabilities, channel ACL grants (account/role → PermLevel), owner bypass, channel mute.

## Legend

| Status | Meaning |
|--------|---------|
| **Have** | Present and usable in product |
| **Partial** | Exists in a weaker / different form |
| **Missing** | Not in Mesa today |
| **Deferred** | Intentionally out of this phase (or product choice) |

---

## Capability matrix

| Discord / recommended concept | Mesa today | Gap | Phase |
|-------------------------------|------------|-----|-------|
| RBAC via roles | **Have** — `server_role` + capabilities | — | — |
| Multiple roles per member | **Deferred** — single role (052) | Product choice; aggregation OR unused | Keep deferred |
| Bit-flag permission packing | **Partial** — bool fields on role | Storage shape only; no user impact | Optional later |
| Role **hierarchy / position** for admin-on-member | **Missing** | Kick/mute/assign not gated by rank | **P1 (this feature)** |
| Hierarchical admin ≠ permission inheritance | N/A until hierarchy exists | Must document: position ≠ inherit caps | **P1** |
| Channel ACL / overwrites | **Partial** — grants (Read/Write/Listen/Speak) | No explicit **Deny**; **Fase 1**: Allow/Deny + camada **«todos os membros»** → perfil → membro; **Deny visualizar só em privados** | **P1** |
| Member-specific overrides | **Partial** — account ACL grant | No Deny; no layered everyone→role→member resolve | **P1** |
| Public vs private visibility | **Have** — + FR-008 public always visible | — | — |
| OWNER absolute authority | **Have** — `owner_account_id` + Dono role (059) | — | — |
| ADMINISTRATOR separate from OWNER | **Missing** | Only owner bypass | Phase 2 |
| Categories + permission sync | **Missing** | No category entity | Phase 2 |
| Voice: view / connect / speak | **Partial** — connect + speak caps + ACL listen/speak | No distinct “view room without connect” | Phase 2 polish |
| Voice: stream / VAD / priority | **Missing** | — | Phase 2+ |
| Voice: mute / deafen / move members | **Partial** — text mute (058); `can_mute_members` | No deafen / move | Phase 2 |
| Timeout / member moderation state | **Partial** — channel mute | No server-wide timeout_until | Phase 2 |
| Threads + thread send perms | **Missing** | No threads | Out of scope |
| Command / interaction ACL | **Missing** | No slash-command authz layer | Out of scope / later |
| Authorization engine `Can(principal, action, resource, context)` | **Partial** — scattered helpers in `permissions.rs` / authz | Not one engine; no shared explain | **P1 foundation** |
| Audit **explanation** of allow/deny | **Missing** | Hard to answer “why can João see this?” | **P1** |
| ABAC / conditional policies | **Missing** | Discord also weak here | Phase 3 (differentiator) |
| Campaign / character context | **Missing** | RPG differentiator | Phase 3 |
| Permission simulation UI | **Partial** — Phase 1 exige **inspecção** membro×canal (clarify); what-if editor fica Phase 2+ | Full simulator deferred | **P1 inspect** |

---

## Effective access today (simplified)

```text
Member
  + single Role → RoleCapabilities (OR with owner_all if owner)
  + Channel visibility (public/private)
  + Channel ACL grants (account | role → max PermLevel)
  + Owner → full channel access
  + Channel mute → blocks send (text)
```

Missing vs Discord resolve path:

```text
Base (roles OR)
  → @everyone overwrite
  → role overwrites (aggregate)
  → member overwrite
  → ADMINISTRATOR short-circuit
```

---

## Priority for Phase 1 (this Speckit feature)

1. **Role position / hierarchy** — gate kick, mute, role assignment, and managing roles below the actor’s rank (owner always above).
2. **Channel overwrite model** — evolve ACL toward Allow/Deny with clear resolution order (everyone → roles → member), without requiring multi-role.
3. **Explainability** — when access is denied (or on demand for admins), return a human-readable reason trail (role missing X, deny overwrite on channel, hierarchy).
4. **Centralise checks** — document and start routing new checks through one authz surface (`Can` / explain), without rewriting all call sites in one release.

Out of Phase 1: categories, multi-role, ADMINISTRATOR flag, threads, slash commands, ABAC/campaign, voice stream/move/deafen.

---

## Risks if Phase 1 is skipped

- Moderators with `can_remove_members` / `can_mute_members` can act on the owner or peers with equal/higher social power — Discord users will call this broken.
- Private “GM secrets” rooms remain awkward without Deny overwrites (only “don’t grant” + private).
- Support burden: “why can’t I see #x?” has no product answer.
