# Implementation Plan: Emoji no título, chat, picker e chrome do composer

**Branch**: `070-emoji-hypertext-picker` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/070-emoji-hypertext-picker/spec.md`

**Depends on**: Composer + mentions UI ([065-mention-autocomplete](../065-mention-autocomplete/)); channel rename ([054-channel-rename](../054-channel-rename/)); message body is E2EE plaintext on client ([062](../062-message-mentions-replies/)).

## Summary

Entregar emoji Unicode no **nome do canal** e no **corpo das mensagens**, com (1) **picker** por ícone, (2) **shortcodes** `:nome:` no composer com lista filtrada e **sem auto-replace**, (3) **chrome do composer**: `+` à esquerda dentro da caixa; emoji + **Enviar** (avião de papel) à direita; texto sem sobrepor ícones. Preferência FE (dados de shortcode estáticos + CSS/layout); backend só se validação de nome rejeitar Unicode (hoje: trim + non-empty — OK).

## Technical Context

**Language/Version**: TypeScript / SolidJS (FE); Rust/Axum só se for preciso aliviar validação de nome (improvável).

**Primary Dependencies**: `Channel.tsx` composer, `Sidebar.tsx` create/rename, `MentionPicker` pattern, `mesa-theme.css`, new `emoji*` lib + `EmojiPicker` / icons (`IconSend`, emoji face).

**Storage**: N/A — emoji são caracteres no `channel.name` e no plaintext E2EE da mensagem; shortcode catalog vendored no FE (JSON/TS).

**Testing**: `tsc --noEmit`; pure unit-style checks for shortcode parse/filter if easy; [quickstart.md](./quickstart.md) A–G manual.

**Target Platform**: Browser (desktop + narrow).

**Project Type**: Web UI (composer chrome + emoji UX).

**Performance Goals**: Filtrar shortcodes O(n) no cliente (n = catálogo útil, tipicamente &lt;2k); picker sem jank; sem fetch por tecla.

**Constraints**: Sem auto-replace; shortcodes só no composer; Enter com picker aberto não envia; avião activo só com texto trim ≠ "" ou anexos; E2EE — emoji no ciphertext como texto; sem packs custom de servidor.

**Scale/Scope**: FE libs + componentes + CSS; tocques em Channel/Sidebar; opcional 0 BE.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Contratos UI composer/shortcode/nome + data-model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/070-emoji-hypertext-picker/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── composer-chrome.md
│   ├── emoji-shortcode-picker.md
│   └── channel-name-emoji.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/lib/emojiData.ts           # catalog: shortcode → glyph (+ keywords)
frontend/src/lib/emojiShortcode.ts      # detect active `:query` at caret; filter; replace segment
frontend/src/components/EmojiPicker.tsx # panel (categories/search) for icon button
frontend/src/components/EmojiSuggest.tsx# optional: filtered list above composer (like MentionPicker)
frontend/src/components/icons/IconSend.tsx
frontend/src/components/icons/IconEmoji.tsx  # or reuse smile glyph
frontend/src/pages/Channel.tsx          # composer chrome + shortcode + picker insert
frontend/src/shell/Sidebar.tsx          # rename/create: allow emoji + optional picker button
frontend/src/styles/mesa-theme.css      # .composer-input-wrap icons + padding
# backend: verify only — no strip of Unicode in channel name (trim/non-empty already)
```

**Structure Decision**: Mirror mention autocomplete: pure lib for shortcode state + small Solid pickers; composer layout is CSS/flex inside `.composer-input-wrap`. Catalog is FE-static (no API).

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/composer-chrome.md](./contracts/composer-chrome.md)
- [contracts/emoji-shortcode-picker.md](./contracts/emoji-shortcode-picker.md)
- [contracts/channel-name-emoji.md](./contracts/channel-name-emoji.md)
- [quickstart.md](./quickstart.md)
