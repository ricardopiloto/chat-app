# Contract: Channel name normalize & validate

**Feature**: 072-channel-name-lock  
**Surfaces**: `frontend/src/lib/channelName.ts`, create/rename in `Sidebar.tsx`, `provision_channel` / `patch_channel`

## Normalize (live + submit)

1. Replace every Unicode whitespace character with `-`.
2. Truncate to at most **32 Unicode scalar values**.
3. Do **not** require collapsing runs of `-` in MVP.

## Validate (before persist)

| Condition | Result |
|-----------|--------|
| Empty after normalize | Reject — name required / invalid |
| Matches only hyphens (`-+`) | Reject — invalid name |
| Length > 32 scalars | Reject |
| Contains whitespace | Reject (should not occur post-normalize) |
| Otherwise | Accept |

## FE UX

- Create + rename inputs apply normalize on every input (and after emoji insert).
- Invalid submit shows clear PT error (empty / só hífens).
- `#` prefix is UI-only and does not consume the 32 budget.

## BE

- Create (`provision_channel`) and PATCH name: normalize (or reject spaces) then validate; `400` with clear message on failure.
- No bulk migration of legacy rows.

## Tests (sketch)

- `"sala geral"` → `"sala-geral"`.
- 33+ scalars → truncated to 32 on input; BE rejects >32 if sent.
- `"---"` / `"   "` → invalid.
- Spaces not persisted.
