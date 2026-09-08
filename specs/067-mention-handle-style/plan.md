# Implementation Plan: Destaque visual de @handle nas menções

**Branch**: `067-mention-handle-style` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/067-mention-handle-style/spec.md`

**Depends on**: [062-message-mentions-replies](../062-message-mentions-replies/); reuses parse helpers from [065-mention-autocomplete](../065-mention-autocomplete/)

**Note**: `.specify/feature.json` → `specs/067-mention-handle-style`. Clarifications 2026-09-08: pattern-based style; others-only (self plain); click → members panel when available; unavailable → styled no-op.

## Summary

Frontend-only: after decrypt, render message bodies by splitting plaintext on the existing `@handle` pattern; style **other** people’s tokens with background + bold (`@` + handle as one chip); leave the reader’s own `@handle` plain. Click a styled token → open the members panel focused on that account when they appear in the current server roster; otherwise no-op. No backend/API/schema changes. Coexist with 062 `.msg-highlight-me` row highlight.

## Technical Context

**Language/Version**: TypeScript / SolidJS (frontend).

**Primary Dependencies**: `frontend/src/lib/mentionParse.ts`, `frontend/src/pages/Channel.tsx` (`.msg-body`), `frontend/src/styles/mesa-theme.css`, `frontend/src/shell/AppShell.tsx` + `MembersPanel.tsx` (open/focus).

**Storage**: N/A.

**Testing**: `tsc --noEmit`; optional small unit tests for tokenize helper if project already unit-tests `lib/`; [quickstart.md](./quickstart.md) manual A–F.

**Target Platform**: Browser; text channel message list.

**Project Type**: Web app UI polish + light navigation glue.

**Performance Goals**: Tokenize O(length of message) per row; no layout thrash; click open panel &lt;3s perceived.

**Constraints**: E2EE plaintext only on client; do not require `mentioned_account_ids` for styling; exclude emails / non-handle `@`; self token never styled/clickable as mention; no composer live-style MVP; theme contrast on accent surface.

**Scale/Scope**: ~1 lib helper (+ optional MessageBody component), Channel wire-up, CSS, small members-panel focus event.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc; pure tokenize unit-testable |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

UI contract + data-model (display tokens) + quickstart; no API. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/067-mention-handle-style/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── mention-handle-display.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/lib/mentionParse.ts           # tokenizeMentionsForDisplay (extend)
frontend/src/components/MessageBody.tsx    # optional: render segments
frontend/src/pages/Channel.tsx             # replace plain <p class="msg-body">
frontend/src/styles/mesa-theme.css         # .msg-mention (+ :focus-visible)
frontend/src/shell/AppShell.tsx            # openMembersPanel({ accountId? })
frontend/src/components/MembersPanel.tsx   # scroll/highlight focusAccountId
```

**Structure Decision**: Keep regex/tokenize in `mentionParse.ts` (single source with 062/065). Prefer a tiny `MessageBody` component so Channel stays readable. Navigation via existing `mesa:members-panel` custom event extended with optional `focusAccountId` — product has no separate profile route.

## Complexity Tracking

N/A
