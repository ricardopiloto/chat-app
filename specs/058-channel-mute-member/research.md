# Research: 058-channel-mute-member

## R1 — Kick already membership-only

**Decision**: Keep `DELETE /api/servers/{id}/members/{accountId}` as membership delete only (`db::membership::delete`). Add contract asserting `account` row still exists after kick. Update FE confirm copy to «Remover do servidor» (never «apagar conta»).

**Rationale**: Spec US1; code already does not call account delete.

**Alternatives considered**: Soft-delete account — rejected by product.

## R2 — Mute storage

**Decision**: Table `channel_mute` with unique `(channel_id, account_id)`, columns `muted_by_account_id`, `created_at`, `ends_at` (RFC3339). Upsert replaces duration (last mute wins). Delete row on unmute or when membership ends (optional cleanup on kick).

**Rationale**: Per-channel, queryable for composer + menu; absolute end time matches edge case.

**Alternatives considered**: Server-wide timeout table — rejected (clarify: per channel). In-memory only — fails restart/multi-instance.

## R3 — Capability `can_mute_members`

**Decision**: New boolean on `server_role` + `RoleCapabilities`, default `false`; owner always allowed via `owner_all` / is_owner checks. Expose on Role Permissions page (Geral section, near Remover membros).

**Rationale**: Clarify C — dedicated capability.

**Alternatives considered**: Reuse `can_delete_messages` — rejected in clarify.

## R4 — API shape

**Decision**:

| Method | Path | Purpose |
|--------|------|---------|
| `PUT` | `/api/channels/{channel_id}/mutes/{account_id}` | Create/replace mute `{ duration_minutes: number }` |
| `DELETE` | `/api/channels/{channel_id}/mutes/{account_id}` | Unmute |
| `GET` | `/api/channels/{channel_id}/mutes/me` | Current user’s active mute (for composer) |
| `GET` | `/api/channels/{channel_id}/mutes/{account_id}` | Optional: status for menu (or embed in members list later) |

AuthZ: owner or `aggregated_caps.can_mute_members`; cannot target owner or self; target must be server member with channel view.

**Rationale**: REST nested under channel; `duration_minutes` presets 5/10/15/30 or custom 1–1440.

**Alternatives considered**: Body with `ends_at` from client — rejected (clock skew); server computes `ends_at = now + minutes`.

## R5 — Enforce on send

**Decision**: In `post_message`, after write ACL, if active mute for `(channel, account)` with `ends_at > now` → **403** with clear code/message. Do **not** block message delete/edit of own messages.

**Rationale**: FR-006/006b/008.

## R6 — UI surface

**Decision**: Primary: `MembersPanel` when a **channel is selected** (pass `channelId` from AppShell/route). Member row menu/actions: Silenciar → duration picker; if muted → Levantar + remaining. Composer in `Channel.tsx`: fetch `/mutes/me`, disable input + show ends_at. Kick copy on MembersManagePage + MembersPanel.

**Rationale**: Clarify B/A for entry/unmute; Mesa already opens MembersPanel beside channels.

**Alternatives considered**: Only message-author context menu — weaker for offline members; can add later. Voice roster mute — same API; optional if panel covers text sessions first.

## R7 — Expiry

**Decision**: Lazy expiry — treat as inactive when `ends_at <= now` without requiring a job; optional DELETE of stale rows on read. Composer polls or refetches on focus/interval ~30s / on WS optional event `channel.mute` if easy.

**Rationale**: Simple; SC-003 tolerance ±1 min.
