# Research: 065-mention-autocomplete

## R1 — Why `@handle` can appear to «do nothing» today

**Decision**: Treat silent failure as a **client resolution/roster** problem first (plus missing discovery UI), not a missing notifications schema. 062 backend already accepts `mentioned_account_ids` and filters by channel **view**.

Likely causes to fix in this feature:

1. **No picker** — users cannot discover exact handles.
2. **`resolveMentionAccountIds` depends on `handles()`** loaded from `GET /api/servers/{id}/members` — if load failed or raced, map is only `me` → resolve returns `[]` → no notifications.
3. **`HANDLE_RE`** in `mentionParse.ts` only matches `[a-zA-Z0-9_]{2,32}` with a left boundary — mistyped/truncated/wrong charset handles extract nothing.
4. **No composer feedback** — even when IDs are sent, plaintext `@` is not visually special; users may think «nothing happened» if they only look at their own chat (highlight is for the **mentioned** user).

**Rationale**: Matches clarify Q1 (picker + guarantee pipeline) and code paths in `Channel.tsx` / `mentionParse.ts` / `messages.rs`.

**Alternatives considered**: Blame server-only — rejected; contract tests already prove BE mentions when IDs are posted.

## R2 — Candidate list = channel viewers, exclude self

**Decision**:

- **Public text channel**: all server members except self (public channels are visible to members).
- **Private channel**: only accounts with effective **view** on that channel, except self.
- Prefer **`GET /api/channels/{channel_id}/mentionables`** returning `{ account_id, handle, has_avatar }[]` for the authenticated member (must have view themselves). Server reuses the same effective-view check as message post mentions.
- Fallback if deferred: public-only client filter from `/members`; private still needs server truth.

**Rationale**: Clarify Q2; avoids client inventing ACL; one source for picker **and** send-time resolve (FR-005a).

**Alternatives considered**: N× access-inspect from FE — too chatty. Show all server members always — violates Q2 on private.

## R3 — Picker UX in composer

**Decision**:

- Detect **active mention** at caret: from nearest `@` (with mention start rules) to caret; open picker when active.
- Filter candidates by case-insensitive substring on `handle` (and display name if present).
- Click / Enter inserts `@handle` + trailing space (or replaces query fragment); Escape / blur closes.
- Keyboard: ArrowUp/Down + Enter (FR-008); prevent form submit while confirming from picker.
- Exclude self from candidates (clarify Q3).
- Plain `<input>` composer: track selectionStart for caret; no contentEditable required for MVP.

**Rationale**: Spec US1–US3; minimal change to existing Solid form.

**Alternatives considered**: contentEditable chips — richer but out of scope. Always-on member dropdown without `@` — rejected (FR-006).

## R4 — Shared resolve path for typed + picker

**Decision**: After ensuring mentionables/handles roster is loaded:

- Picker inserts the same `@handle` string a user would type.
- On send, `resolveMentionAccountIds(text, candidates, meId)` uses **the same candidate list** (mentionables), not a stale/partial map.
- Keep server-side view filter as safety net.
- Add/adjust unit-level pure tests or contract coverage for extract+resolve with known handles.

**Rationale**: FR-005 / FR-005a / US1b.

**Alternatives considered**: Send account IDs from picker only (skip text parse) — breaks manual `@handle` and multi-mention consistency; optional enhancement later as supplement, not replacement.

## R5 — Backend scope

**Decision**: Add mentionables GET if private-channel correctness is required (it is, per Q2). No schema/migration. No change to notification kinds.

**Rationale**: Thin authz reuse; keeps E2EE model.

**Alternatives considered**: Expand HANDLE_RE for unicode — only if product handles allow non-ASCII; verify register rules at implement time and align parse with them.
