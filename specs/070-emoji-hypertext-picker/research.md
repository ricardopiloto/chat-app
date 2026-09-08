# Research: 070-emoji-hypertext-picker

## R1 — Channel / message emoji = Unicode text

**Decision**: Treat emoji as normal Unicode characters in `channel.name` and message plaintext. No separate emoji entity, no custom image packs.

**Rationale**: Spec assumptions; BE already accepts any non-empty trimmed name (`channel_provision` / rename); messages are client-encrypted text — glyphs travel with ciphertext.

**Alternatives considered**: Custom server emoji CDN — out of scope. Twemoji image replacement in history — optional polish later, not required (native font glyphs OK).

## R2 — Shortcode catalog source

**Decision**: Ship a **static FE catalog** (TS/JSON module) of common shortcodes → emoji (gemoji / emojibase-style names, e.g. `smile` → 🙂). Include searchable keywords where cheap. Size: “useful set” (hundreds–low thousands), not full Unicode.

**Rationale**: Spec FR-007 / assumptions; no network; works offline; filters locally like mentionables.

**Alternatives considered**: Runtime fetch of full Unicode — heavier. Rely only on OS emoji panel — fails picker + shortcode FRs.

## R3 — Shortcode UX (no auto-replace)

**Decision**:

- Detect **active shortcode** at caret: from nearest unescaped `:` that starts a token to caret (query may be empty or partial; closing `:` does **not** auto-insert).
- Show **filtered list** above composer (same chrome family as `MentionPicker`).
- **Enter / click** replaces the `:…` segment (including optional closing `:`) with the glyph + optional trailing space.
- **Esc** closes without replace; typing that abandons the token closes; **never** replace on timer or on second `:`.
- While suggest open, **Enter does not submit** the form (same as mentions).
- Mutual exclusion with `@` mention picker: only one active token type at a time (prefer the token that owns the caret).

**Rationale**: Clarify Q1/Q3; FR-006–009b.

**Alternatives considered**: Auto-replace on closing `:` — rejected by product. Modal confirm buttons — rejected (inline like @).

## R4 — Composer chrome layout

**Decision**:

- Move **attach (+)** inside `.composer-input-wrap`, **left**.
- Add **emoji** icon and **send (paper plane)** inside wrap, **right** (order: emoji then send).
- Remove primary text button «Enviar»; submit via plane `type="submit"` or `onClick` → same `send()`.
- **Padding** on `.input` (left/right) so text/caret never paint under icons; icons `position` absolute or flex siblings with non-shrinking hit targets.
- Send **disabled** when `!draft.trim() && pendingFiles.length === 0` (and existing pending/sending/mute rules).

**Rationale**: US5 / FR-011–015 / FR-013a.

**Alternatives considered**: Icons outside field — rejected by amendment. Keep «Enviar» text — rejected.

## R5 — Channel name picker

**Decision**: Allow typing/pasting Unicode emoji in create + rename fields. Add a compact **emoji icon** next to rename/create name inputs that opens the same `EmojiPicker` and inserts at caret (no shortcode suggest on those fields).

**Rationale**: FR-004a / clarify Q2 (shortcodes composer-only).

**Alternatives considered**: Shortcodes on rename — deferred/out. Force picker-only for titles — too strict (OS emoji OK).

## R6 — Icons

**Decision**: Add `IconSend` (paper-plane / Telegram-like folded letter plane) and an emoji/smile icon under `frontend/src/components/icons/`, matching existing `Icon*` stroke style. Attach may keep literal «+» or `IconPlus` for consistency — prefer `IconPlus` if already used elsewhere, still **aria-label** «Anexar imagem».

**Rationale**: FR-012 / FR-015; visual system already has IconPlus.

**Alternatives considered**: Emoji character as send button — less clear a11y. External SVG asset file — OK if simpler than JSX icon.
