# Data Model: 067-mention-handle-style

**Storage**: None (client display only).

## Display segment (client)

| Field | Type | Notes |
|-------|------|--------|
| `kind` | `'text' \| 'mention'` | |
| `value` | string | For `text`: plaintext run. For `mention`: full `@handle` raw string |
| `handle` | string? | Without `@`; present when `kind === 'mention'` |
| `styled` | boolean? | `true` only when mention of someone other than the reader |

## Resolution for click

| Input | Source | Output |
|-------|--------|--------|
| `handle` (normalized) | Message body token | Lookup in channel/server handle→`account_id` map already loaded in Channel |
| Availability | Map hit + not self | `focusAccountId` for members panel |
| Miss / self | — | No navigation |

## Relationship to 062 entities

| Entity | Role here |
|--------|-----------|
| `mentioned_account_ids` on Message | **Not required** for styling (pattern-only) |
| `.msg-highlight-me` / `highlightSeen` | Unchanged; orthogonal to token style |
| Members roster | Optional for click target only |

## Validation rules (display)

- Mention pattern must match send-time handle rules (2–32 `[A-Za-z0-9_]` with boundary).
- Email-like `@` must not become mention segments.
- Reader’s handle (case-insensitive) → `styled: false` (plain).
- Multiple mentions → multiple independent segments.
