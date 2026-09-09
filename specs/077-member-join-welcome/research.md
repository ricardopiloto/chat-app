# Research: 077-member-join-welcome

## R1 — Where to hook the announce

**Decision**: After successful membership commit, from the shared post-join path used by logged-in `accept_invite` and register-via-invite — today centered on `emit_invite_consumed` in `backend/src/api/auth/register.rs` (called from `api/invites.rs`). Publish welcome **after** commit, **outside** the TX, errors logged / swallowed (FR-009). Skip owner bootstrap membership in `create_server`.

**Rationale**: Both invite join paths already share this emit; keeps announce consistent without duplicating in register vs accept.

**Alternatives considered**:
- Inside TX with membership — couples join failure to announce; reject for FR-009.
- FE-only fake message — not durable / multi-client; reject.

## R2 — System message vs E2EE ciphertext

**Decision**: Extend `message` with an explicit **system** kind: allow `sender_account_id` NULL (or sentinel), store **plaintext** body for system rows (e.g. `content_plaintext` / `kind = 'system'`), keep `content_ciphertext` nullable for system-only rows OR empty blob unused. User messages remain ciphertext + non-null sender. FE decrypts only user kinds; system rows render plaintext centered (reuse day-separator visual language from `daySeparators.ts` / `Channel.tsx`).

**Rationale**: Server has no channel E2EE key; cannot invent valid ciphertext. Spec requires system/background presentation and FR-010 (not user chat).

**Alternatives considered**:
- Encrypt as server with a service key — out of product crypto model; reject.
- Separate `system_event` table + new WS event — more FE plumbing; message table + `message.new` with kind is enough if clients branch on kind.
- Client synthesizes on `invite.consumed` — not shared history for late joiners to that channel; reject.

## R3 — Destination resolution

**Decision**: On join: (1) `server.welcome_channel_id` if set and still a valid text channel; (2) else first text channel named exactly `geral` on that server (`list_by_server` + filter); (3) else `invite.welcome_channel_id` for the invite used. Create-invite: if (1) and (2) would be empty at create time, require `welcome_channel_id` on the invite body; store **only on that invite** (clarify A — does not write server setting).

**Rationale**: Matches FR-004/005 + clarify.

**Alternatives considered**: Persist invite pick to server — rejected in clarify.

## R4 — Template

**Decision**: Store `server.welcome_message_template` (TEXT, nullable = use product default). Canonical placeholder `{nome}` (document in settings UI). Default string: `Usuário {nome} acabou de entrar no canal`. Reject save without `{nome}` (or auto-append name — prefer reject for clarity). Always-on: no disable flag column.

**Rationale**: Spec default copy + clarify always-on.

## R5 — Settings UI

**Decision**: New owner-only settings route under the existing `server` nav group (sibling of image/delete), e.g. `/servers/:id/settings/welcome`, with template textarea + text-channel select. Backend `GET`/`PATCH` (or extend server settings) owner-gated like image/delete.

**Rationale**: `settingsAccess` already isolates owner-only server items.

## R6 — Invite UI

**Decision**: When creating invite, FE asks BE or computes whether destination resolve needs invite channel (no owner channel + no `geral`). If needed, require channel picker before POST; send `welcome_channel_id`.

**Rationale**: Sidebar `createInvite` is the existing surface; gate with `can_create_invites` unchanged.

## R7 — Mentions / unread

**Decision**: System welcome messages skip mention parsing and durable Menção/Resposta notifications; do not attribute as the joining user’s chat for personal highlight. Unread for the channel may still advance last message id (normal channel activity) unless product already special-cases system — prefer counting as channel activity without personal mention badges.

**Rationale**: FR-010.
