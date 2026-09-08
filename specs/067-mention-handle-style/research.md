# Research: 067-mention-handle-style

## R1 — How to detect mention tokens in displayed text

**Decision**: Reuse the same handle rules as `HANDLE_RE` / `extractMentionHandles` in `frontend/src/lib/mentionParse.ts` (`@` + `[a-zA-Z0-9_]{2,32}` with left boundary). Add `tokenizeMentionsForDisplay(text) → Segment[]` where each segment is `{ kind: 'text', value }` or `{ kind: 'mention', handle, raw }` (`raw` includes `@`).

**Rationale**: Spec clarify Q1 = pattern-based; must stay consistent with send-time parse so emails (`user@x.com`) and mid-word `@` are not styled (FR-007).

**Alternatives considered**: Style only when `mentioned_account_ids` present — rejected (E2EE list may be incomplete in UI; clarify wants left members still styled). Markdown/linkify engines — overkill.

## R2 — Self vs others

**Decision**: When rendering, compare `handle` to `me.handle` with the same case folding as resolve (`toLowerCase()`). If equal → emit plain text segment (or mention segment with `styled: false`). Only `styled: true` gets CSS + button/link role.

**Rationale**: Clarify Q2 = C; 062 row highlight remains the “for me” signal.

**Alternatives considered**: Different color for self — rejected. Never show self `@` in text as special — same as plain.

## R3 — Visual design (background + bold)

**Decision**:

- Wrapper class e.g. `.msg-mention` on the full `@handle` unit.
- `font-weight: 600|700` on the token; background via `color-mix` of accent into transparent (works light/dark with existing Mesa tokens).
- Inline padding + slight radius so it reads as a chip without looking like a primary button.
- Distinct from `.msg-highlight-me` (block background) and deep-link `.msg-highlight`.

**Rationale**: Spec FR-001/004; Assumptions on brand accent.

**Alternatives considered**: Underline-only — weaker than requested. Discord-blue hardcoded — avoid; use theme vars.

## R4 — Click → members panel (no profile route)

**Decision**: Product surface for “see a member” is **MembersPanel** (no dedicated profile page). Extend open flow:

1. Resolve `handle` → `account_id` via Channel’s existing `handles()` map (or members list).
2. If found and `account_id !== me`: `dispatchEvent('mesa:members-panel', { open: true, focusAccountId })`.
3. AppShell opens panel; MembersPanel scrolls/highlights that row briefly.
4. If handle not in map (left server): **no-op** (clarify Q4 = A); token remains styled.

**Rationale**: Clarify Q3 = B “profile or members panel when available”; Mesa = members panel. Q4 = styled no-op if unavailable.

**Alternatives considered**: Navigate to settings/members manage page — heavier, wrong context for in-channel glance. Toast on missing — not required.

## R5 — Accessibility

**Decision**: Styled mentions that are activable use `<button type="button" class="msg-mention">` (or `role="link"` with keyboard) so Enter/Space works; `:focus-visible` ring. Unavailable styled mentions can be `<span class="msg-mention">` without button semantics (or button with `aria-disabled` that no-ops) — prefer **span** when no-op to avoid promising an action.

**Rationale**: US4 scenario 3; avoid fake buttons for dead handles.

**Alternatives considered**: Always `<a href="#">` — bad for SPA/history.

## R6 — Scope exclusions

**Decision**: No composer live styling; no topbar notification copy styling; no backend changes; reply-quote plaintext can reuse `MessageBody` if it shows decrypted parent text (nice-to-have, not blocking Done if quotes stay plain).

**Rationale**: Spec Assumptions / edge cases.
