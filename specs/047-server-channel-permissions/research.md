# Research: 047-server-channel-permissions

**Date**: 2026-09-06  
**Spec**: [spec.md](./spec.md)

## R1 — Baseline actual

**Decision**: Partir de membership + `require_member` / `require_channel_member`; owner = `server.owner_account_id`; channel creator = `channel.created_by_account_id`. Hoje qualquer membro vê todos os canais e tem write/speak.

**Rationale**: Confirmado no código (`authz.rs`, `list_by_server`, voice join). Create channel já é owner-only — alinhar a FR-020 (owner | papel `can_create_channels`).

**Alternatives considered**: Reescrever authz do zero (rejeitado).

## R2 — Não reutilizar `channel_role`

**Decision**: Manter `channel_role` só para `co_director` (cenas). Novas tabelas `server_role` / `server_role_member` / `channel_acl`.

**Rationale**: CHECK actual só permite `co_director`; misturar ACL de produto com cena-deferred gera bugs e migrações confusas.

**Alternatives considered**: Estender enum `channel_role.role` (rejeitado); JSON blob no canal (rejeitado — fraco para queries).

## R3 — Modelo público vs privado

**Decision**:

| Modo | Visibilidade | Visível a novos | Nível |
|------|--------------|-----------------|-------|
| `public` | Todos os membros | Flag `visible_to_new_members` (default true) | Default write/speak; ACL pode **refinar** para read/listen sem ocultar |
| `private` | Só ACL explícita (+ owner sempre) | Sempre false | ACL define view + nível; creator inicia com write/speak |

**Rationale**: Clarificações Q4/Q5. Exclusão pontual em público = tornar privado.

**Alternatives considered**: Deny-list em público (rejeitado); privado com «visível a novos» (rejeitado).

## R4 — Resolução efectiva

**Decision**: Para um `(account, channel)`:

1. Se não membership → sem acesso ao servidor.
2. Se `account == server.owner` → pleno (view + write/speak) em todos os canais.
3. Se canal `public` → view=true; nível = max(default do canal, concessões pessoa/papel) onde default = write|speak; concessões só podem **baixar**? Spec: «mais permissivo» entre concessões. Para público, baseline = write/speak para todos; concessões de só-leitura **restringem** esse membro/papel.

**Clarificação de produto aplicada**: Em público, todos **vêem**. Nível: baseline write/speak; se existir concessão explícita para o membro (ou papéis), usar a **mais permissiva entre as concessões explícitas**; se **nenhuma** concessão explícita → baseline write/speak. Para **restringir** um membro a só-leitura num público, criar concessão `read` (e não haver concessão mais alta). Para **ocultar**, tornar privado.

Wait - "mais permissivo" with baseline write means a read grant would be less permissive - we need: effective = min(baseline, max(grants))? Or grants override?

Spec FR-008: most permissive among applicable grants. FR-022: public all see; grants may refine level without hiding.

**Decision refined**:

- **Private**: applicable grants = person + roles (+ owner bypass). No grant → no view. Effective level = max(grants). Creator seed = write/speak.
- **Public**: view = all members. Effective level = if any grant for person/roles then max(those grants) else default write/speak. (So to force read-only, add a read grant and ensure no write grant — but max(read)=read works if only read grant exists.)

**Alternatives considered**: Always max(baseline, grants) — then cannot restrict below write on public without deny (rejeitado por Q5).

## R5 — Invite onboarding

**Decision**: Accept invite → insert membership; for each channel where `visibility=public AND visible_to_new_members=1`, no extra row needed if public baseline covers them. Private never auto-granted. Optional: persist nothing for public (implicit).

**Rationale**: Public visibility is membership-based; flag only filters which public channels new members get in the implicit set. If a public channel has `visible_to_new_members=0`, **existing** members still see it; **new** members after invite do not until granted? Spec US5: only marked channels visible to new members. So public + not visible_to_new = visible to members who already had access before the flag change, but new invitees don't see it.

**Decision**: Effective view for public:

- Owner: always.
- Member: sees public channel if (`visible_to_new_members`) OR (member joined before we need a better rule).

Simpler rule matching spec:

- **Public + visible_to_new_members**: all current members see (including new invitees).
- **Public + NOT visible_to_new_members**: members who need access get it via… "until someone changes ACL" — for public, "ACL" refining doesn't hide. Spec says marking controls what new members see.

So for **new** members: only public∩visible_to_new. For **existing** members when flag turned off: they keep seeing (grandfather) OR lose access?

**Decision**: View public channel iff membership AND (`visible_to_new_members` OR `membership.joined_at < channel.created_at` OR explicit grant OR was member when flag was on). Too complex.

**Pragmatic product rule (chosen)**:

- Public channel view for any member iff `visible_to_new_members OR has explicit channel_acl grant (any level)`.
- Default on create: `visible_to_new_members=true` → all members see.
- Turning off «visível a novos»: channel disappears for members **without** explicit ACL grant; owner/creator still see; other members need grants to keep access. Document in Assumptions for implement.

Actually re-read US5: "só os canais marcados ficam visíveis/utilizáveis para ele" for **new** member on invite. Existing members already in server keep seeing public channels even if we later uncheck? FR-016 says desligar depois sem tornar privado.

**Decision (invite-centric)**:

- List filter for account A: include channel if owner OR (private & acl) OR (public & (visible_to_new_members OR membership.joined_at <= some watermark OR always for public members?)) 

Simplest enforceable rule that matches spirit:

1. **Private**: owner | acl (person/role).
2. **Public**: all members always see (visibility among members); `visible_to_new_members` only affects **what invite accept auto-implies** — but if all members always see public, the flag is redundant unless public∩!flag hides from everyone who doesn't have grant.

I'll go with Discord-like:
- Public = all members see always.
- `visible_to_new_members` = when true, invitees get the channel in their set (same as all public). When false, channel is still public to existing members but **new invitees need an explicit ACL grant** to see it (exception to "all members" for members who joined after the channel was marked not-for-newcomers).

Implementation: `membership.joined_at >= channel.updated_visibility_at` && !visible_to_new → require explicit grant. Store `visibility_changed_at` or use: new member sees public channel only if visible_to_new_members.

**Chosen rule**:

```
can_view(public):
  owner || 
  (member && visible_to_new_members) ||
  (member && !visible_to_new_members && joined_at < channel.created_at) ||  // creators/old: hmm
  (member && explicit_acl)
```

Cleaner **Chosen**:

```
can_view(public): owner || (member && (visible_to_new_members || has_explicit_acl || is_channel_creator))
can_view(private): owner || has_explicit_acl || is_channel_creator
```

With create public → visible_to_new=true → all members. Turn off flag → only creator, owner, and explicit ACL see until re-enabled. New invitees: only channels with visible_to_new (or later ACL). Matches US5.

**Alternatives considered**: Snapshot grants on accept (more rows; clearer audit) — optional later.

## R6 — Kick / remove membership

**Decision**: Add `DELETE` membership (owner-only); revoke access immediately. Prevent removing last owner / self if sole owner.

**Rationale**: FR-001 / US1. No API today.

## R7 — Voice listen vs speak

**Decision**: On join / toggle mic / toggle cam: require speak for publish; listen-only may join as subscriber only (mic/cam controls disabled in UI + 403 on enable).

**Rationale**: FR-005/009. LiveKit can still connect; don't publish audio/video tracks without speak.

## R8 — UI

**Decision**: Create-channel dialog: radio público/privado. Sidebar: lock icon on private. Roles + ACL panels under server/channel settings (owner / channel creator). Hide create if !can_create_channels.

**Rationale**: Spec US6 / FR-017/020. Icon glyph: prefer existing lock/key style in icon system (plan phase — `IconLock` or similar).

## R9 — Migration

**Decision**: `0012_server_channel_permissions.sql`: add columns + tables; backfill all channels `visibility='public'`, `visible_to_new_members=1`; no ACL rows needed for public baseline; create_channel remains owner until roles exist (empty roles).

**Rationale**: SC-005 / FR-010.
