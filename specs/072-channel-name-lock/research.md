# Research: 072-channel-name-lock

## 1. Live normalize + cap (spaces → `-`, max 32)

**Decision**: On create/rename `onInput`, run `normalizeChannelNameDraft(raw)`: replace Unicode whitespace (space, tab, NBSP, etc.) with `-`, then take first **32 Unicode scalar values** (FE `[...s].length` / BE `chars().count()`). Set input value to result (adjust caret when possible). On submit, re-normalize + reject if empty or `/^-+$/`.

**Rationale**: Matches clarify (live replace + hard cap while typing). Shared helper avoids create/rename drift. Code-point count avoids grapheme complexity while staying consistent FE/BE (unlike raw UTF-16 `.length` for astral emoji).

**Alternatives considered**:
- Normalize only on blur/submit — rejected (clarify: while typing).
- Grapheme-aware 32 — rejected (clarify: no special grapheme rule).
- Raw JS `.length` only — rejected for FE/BE mismatch on astral planes.

## 2. Backend enforcement

**Decision**: After `trim`, apply same rules in `provision_channel` and `patch_channel` name path: reject if len > 32, contains whitespace, empty, or only hyphens. Optionally normalize server-side (replace whitespace → `-` then reject if still invalid) so slightly dirty clients still get consistent names; prefer **reject** if spaces remain after client should have fixed (clearer errors) **or** normalize-then-validate. Prefer **normalize then validate** so API is forgiving and SC-001 holds.

**Rationale**: Spec assumption: server SHOULD reject bypass.

**Alternatives considered**: FE-only — rejected (bypass via API).

## 3. Private lock layout + fade

**Decision**: Restructure `.channel-item` to: `[prefix] [name grows] [lock absolute/right]`. Name in a flex child with `min-width: 0`, `overflow: hidden`, and a right-edge **mask-image** / gradient fade (~lock width). Lock positioned `position: absolute; right: …; z-index` above the name so text paints under the icon; no characters visible past the lock’s right edge. Move lock from **before** name to **after**/right slot in `Sidebar.tsx` (text + voice rows + renaming row).

**Rationale**: Clarify: text under lock with soft fade; lock clips overflow.

**Alternatives considered**:
- Ellipsis before lock without overlap — weaker “behind lock”.
- Keep lock after `#` — current layout; rejected by FR-005.

## 4. Create + rename parity

**Decision**: Same helper on channel create name field and rename input; emoji picker insert must go through normalize (truncate to 32 after insert).

**Rationale**: US3 / FR-003.

## 5. Legacy names

**Decision**: No bulk migration. On rename open, seed draft through normalize (may shorten). Display of legacy long/spaced names until edited is OK.

**Rationale**: Spec edge case / assumptions.
