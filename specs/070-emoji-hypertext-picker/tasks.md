---
description: "Task list for Emoji no título, chat, picker e chrome do composer (070)"
---

# Tasks: Emoji no título, chat, picker e chrome do composer

**Input**: Design documents from `/specs/070-emoji-hypertext-picker/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) A–G + `cd frontend && ./node_modules/.bin/tsc --noEmit`. No formal TDD requested.

**Organization**: Setup → Foundational (catalog + shortcode helpers + icons) → US1 channel name → US2 chat emoji → **US5 composer chrome** (before picker placement) → US3 picker → US4 shortcodes → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1]–[US5]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/lib/emojiData.ts`, `emojiShortcode.ts`, `components/EmojiPicker.tsx`, `EmojiSuggest.tsx`, `icons/IconSend.tsx`, `IconEmoji.tsx`, `pages/Channel.tsx`, `shell/Sidebar.tsx`, `styles/mesa-theme.css`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and touch points.

- [x] T001 Confirm `.specify/feature.json` → `specs/070-emoji-hypertext-picker` and skim composer in `frontend/src/pages/Channel.tsx` plus rename/create name fields in `frontend/src/shell/Sidebar.tsx` against [research.md](./research.md) R1–R5

**Checkpoint**: Understood — Unicode names OK on BE; composer has external `+` / «Enviar».

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared emoji catalog, shortcode helpers, and icons — **blocks** picker/shortcode/chrome wiring.

**⚠️ CRITICAL**: Complete before story UI work that inserts glyphs.

- [x] T002 Create static emoji catalog module `frontend/src/lib/emojiData.ts` (`EmojiEntry`: shortcode, glyph, optional keywords) with a useful common set per [data-model.md](./data-model.md) and [research.md](./research.md) R2
- [x] T003 [P] Implement `frontend/src/lib/emojiShortcode.ts`: detect active `:query` at caret, filter catalog, compute replace range (no auto-replace) per [contracts/emoji-shortcode-picker.md](./contracts/emoji-shortcode-picker.md)
- [x] T004 [P] Add `frontend/src/components/icons/IconSend.tsx` (paper-plane / Telegram-like) matching existing `Icon*` stroke style
- [x] T005 [P] Add `frontend/src/components/icons/IconEmoji.tsx` (smile / emoji face) for picker toggle

**Checkpoint**: Catalog + parse helpers + icons importable; no UI yet.

---

## Phase 3: User Story 1 - Emoji no título do canal (Priority: P1) 🎯 MVP

**Goal**: Create/rename channel names can include Unicode emoji and show them in the sidebar.

**Independent Test**: [quickstart.md](./quickstart.md) A.

### Implementation for User Story 1

- [x] T006 [US1] Verify create/rename paths in `frontend/src/shell/Sidebar.tsx` and BE name trim in `backend/src/api/channel_provision.rs` / `backend/src/api/channels.rs` do **not** strip emoji; fix FE-only if any sanitize removes non-ASCII per [contracts/channel-name-emoji.md](./contracts/channel-name-emoji.md)
- [x] T007 [P] [US1] Confirm sidebar / channel labels in `frontend/src/shell/Sidebar.tsx` (and any title chrome) render emoji glyphs without clipping/hiding (CSS in `frontend/src/styles/mesa-theme.css` only if needed)

**Checkpoint**: Channel with emoji in name persists and displays.

---

## Phase 4: User Story 2 - Emoji no chat (Priority: P1)

**Goal**: Messages with Unicode emoji send and display in history.

**Independent Test**: [quickstart.md](./quickstart.md) B (can use OS keyboard until picker lands).

### Implementation for User Story 2

- [x] T008 [US2] Confirm composer draft → send → decrypt/display path in `frontend/src/pages/Channel.tsx` (and message body render) preserves emoji characters; adjust only if a sanitizer strips them

**Checkpoint**: Pasted/typed emoji survive round-trip in text chat.

---

## Phase 5: User Story 5 - Composer chrome (Priority: P1)

**Goal**: `+` left inside field; emoji + paper-plane send right inside; no text overlap; send enable rules.

**Independent Test**: [quickstart.md](./quickstart.md) E.

**Note**: Implement before US3 so the emoji control has a home inside the wrap.

### Implementation for User Story 5

- [x] T009 [US5] Restructure composer markup in `frontend/src/pages/Channel.tsx`: move attach control into `.composer-input-wrap` (left); add right-side slots for emoji toggle + send; remove primary text «Enviar» button per [contracts/composer-chrome.md](./contracts/composer-chrome.md)
- [x] T010 [US5] Style `.composer-input-wrap` / `.input` padding and icon hit-targets in `frontend/src/styles/mesa-theme.css` so text/caret never paint under icons (FR-014)
- [x] T011 [US5] Wire send control to existing `send()` with `IconSend`, `aria-label="Enviar"`, disabled when `!draft().trim() && pendingFiles().length === 0` (and existing pending/sending/mute) in `frontend/src/pages/Channel.tsx` (FR-013a)
- [x] T012 [P] [US5] Use `IconPlus` (or keep `+`) for attach with `aria-label="Anexar imagem"` inside the wrap in `frontend/src/pages/Channel.tsx`

**Checkpoint**: Chrome matches US5; empty send disabled; attach still works.

---

## Phase 6: User Story 3 - Ícone / picker de emoji (Priority: P1)

**Goal**: Emoji icon opens selector; insert at caret in composer and channel name flows.

**Independent Test**: [quickstart.md](./quickstart.md) C + F (picker on name).

### Implementation for User Story 3

- [x] T013 [US3] Build `frontend/src/components/EmojiPicker.tsx` (search and/or categories over `emojiData`) per [contracts/emoji-shortcode-picker.md](./contracts/emoji-shortcode-picker.md)
- [x] T014 [US3] Wire emoji icon + panel in `frontend/src/pages/Channel.tsx` composer (right slot): insert glyph at selection; Esc/close without change; style panel in `frontend/src/styles/mesa-theme.css`
- [x] T015 [P] [US3] Add emoji picker control on channel create/rename inputs in `frontend/src/shell/Sidebar.tsx` inserting into name draft (no shortcode suggest)

**Checkpoint**: Picker inserts emoji in chat and channel name fields.

---

## Phase 7: User Story 4 - Shortcodes sem auto-replace (Priority: P1)

**Goal**: `:query` filtered suggest in composer only; Enter/click replace; never auto on `:nome:`.

**Independent Test**: [quickstart.md](./quickstart.md) D.

### Implementation for User Story 4

- [x] T016 [US4] Add `frontend/src/components/EmojiSuggest.tsx` (listbox like `MentionPicker.tsx`) for filtered shortcode rows
- [x] T017 [US4] Integrate shortcode detect/filter/keyboard in `frontend/src/pages/Channel.tsx` using `emojiShortcode.ts`: open on `:`; Enter/click replace segment; Esc dismiss; **no** replace on closing `:`; Enter while open must not submit; mutually exclusive with `@` mention picker
- [x] T018 [US4] Ensure rename/create in `frontend/src/shell/Sidebar.tsx` does **not** open shortcode suggest when typing `:` (FR-009a)
- [x] T019 [P] [US4] Style `.emoji-suggest` (or shared picker chrome) in `frontend/src/styles/mesa-theme.css`

**Checkpoint**: Shortcodes optional via suggest only; mentions still work.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Validation and Speckit docs.

- [x] T020 Spot-check light/dark + narrow viewport for composer icons and pickers ([quickstart.md](./quickstart.md) G) via `frontend/src/styles/mesa-theme.css` tweaks if needed
- [x] T021 Run `cd frontend && ./node_modules/.bin/tsc --noEmit` and complete [quickstart.md](./quickstart.md) A–G
- [x] T022 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when implement completes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup** → **Foundational** → **US1** → **US2** → **US5** (chrome) → **US3** (picker into chrome) → **US4** (shortcodes) → **Polish**
- US3 **depends on** US5 for in-field icon placement
- US4 **depends on** Foundational shortcode lib + composer (US5/US2)

### User Story Dependencies

- **US1**: Independent (Sidebar + BE verify)
- **US2**: Independent of picker (OS emoji OK)
- **US5**: Independent of catalog contents (icons from Foundational)
- **US3**: Needs US5 slots + T002 catalog + T005 icon
- **US4**: Needs T003 + composer; after US5 recommended

### Parallel Opportunities

- T003 ∥ T004 ∥ T005 after T002 (T003 can start with T002 stub)
- T007 ∥ T006
- T012 ∥ T010/T011
- T015 ∥ T014
- T019 ∥ T017
- T022 ∥ T021

### Parallel Example: After Foundational

```bash
Task: "Verify channel name emoji in Sidebar create/rename"
Task: "Add IconSend + IconEmoji components"
```

---

## Implementation Strategy

### MVP First

1. Foundational catalog/icons  
2. **US1** channel emoji names  
3. **US5** chrome + **US2** verify chat glyphs  
4. STOP — quickstart A/B/E  
5. US3 picker → US4 shortcodes → polish  

### Incremental Delivery

1. Names with emoji  
2. Composer chrome (plane send)  
3. Picker  
4. `:shortcode` suggest without auto-replace  
5. Docs  

---

## Notes

- No new API/migration expected  
- Reuse MentionPicker keyboard/ARIA patterns  
- Do not auto-replace shortcodes; do not add custom emoji packs
