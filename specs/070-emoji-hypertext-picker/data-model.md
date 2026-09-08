# Data Model: 070-emoji-hypertext-picker

Client-side presentation model (no new DB tables).

## EmojiEntry

| Field | Description |
|-------|-------------|
| `shortcode` | Canonical name without colons (e.g. `smile`) |
| `glyph` | Unicode emoji string (may be ZWJ sequence) |
| `keywords` | Optional search aliases (PT/EN), lowercased |

**Rules**: Unique `shortcode` in catalog; `glyph` non-empty.

## ActiveShortcodeQuery (composer ephemeral)

| Field | Description |
|-------|-------------|
| `start` | Index of opening `:` in draft |
| `end` | Caret index (exclusive end of query text) |
| `query` | Text after `:` up to caret (may include trailing `:` in segment replace logic) |
| `open` | Whether suggest UI is shown |

**Transitions**:

- Idle → Open: user types `:` that starts a shortcode token at caret.
- Open → Filter: query changes.
- Open → Idle + replace: accept (Enter/click).
- Open → Idle keep text: Esc / blur / leave token.
- Never: Idle → Idle with silent glyph replace.

## ComposerChrome

Logical layout of the message box (not persisted):

| Slot | Control | Notes |
|------|---------|--------|
| Left | Attach (+) | Inside wrap |
| Center | Text input | Padding avoids icon overlap |
| Right | Emoji picker toggle | Opens panel |
| Right | Send (plane) | Enabled iff trim(text) ≠ "" ∨ pending attachments |

## Channel.name / Message body

Unchanged schema: UTF-8 strings; emoji are content characters. Display uses platform fonts.
