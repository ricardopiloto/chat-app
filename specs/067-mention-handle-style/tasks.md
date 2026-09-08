---
description: "Task list for Destaque visual de @handle (067)"
---

# Tasks: Destaque visual de @handle nas menções

**Input**: Design documents from `/specs/067-mention-handle-style/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Manual [quickstart.md](./quickstart.md) A–F; `cd frontend && npx tsc --noEmit`. No new backend contract tests (FE-only).

**Organization**: Setup → Foundational (tokenize + CSS + MessageBody shell) → US1 style others → US2 multi/non-handle → US3 self plain + 062 coexist → US4 click members panel → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3], [US4]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/src/lib/mentionParse.ts`, `frontend/src/components/MessageBody.tsx`, `frontend/src/pages/Channel.tsx`, `frontend/src/styles/mesa-theme.css`, `frontend/src/shell/AppShell.tsx`, `frontend/src/components/MembersPanel.tsx`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm feature pointer and current message-body rendering.

- [X] T001 Confirm `.specify/feature.json` → `specs/067-mention-handle-style` and skim plain `.msg-body` render + `handles()` map in `frontend/src/pages/Channel.tsx`, `HANDLE_RE` in `frontend/src/lib/mentionParse.ts`, and `mesa:members-panel` in `frontend/src/shell/AppShell.tsx` against [research.md](./research.md)

**Checkpoint**: Know where text is rendered and how members panel opens today.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared tokenize API + MessageBody shell + base `.msg-mention` CSS — **blocks** all stories.

**⚠️ CRITICAL**: Do not wire Channel clicks/self rules until tokenize exists and MessageBody can render segments.

- [X] T002 Add `tokenizeMentionsForDisplay(text, meHandle)` (or equivalent) returning display segments per [data-model.md](./data-model.md) in `frontend/src/lib/mentionParse.ts`, reusing the same handle pattern as `extractMentionHandles` ([contracts/mention-handle-display.md](./contracts/mention-handle-display.md))
- [X] T003 [P] Add base `.msg-mention` styles (background via theme accent mix, bold, padding/radius, `:focus-visible`) in `frontend/src/styles/mesa-theme.css` without colliding with `.msg-highlight-me` / `.msg-highlight`
- [X] T004 Create `frontend/src/components/MessageBody.tsx` that maps segments to text nodes + `.msg-mention` chips (styled vs plain) per [contracts/mention-handle-display.md](./contracts/mention-handle-display.md); accept `text`, `meHandle`, optional `onMentionActivate(handle)`

**Checkpoint**: Helper + component + CSS exist; Channel still unchanged or only a smoke import.

---

## Phase 3: User Story 1 - Ver @handle destacado (Priority: P1) 🎯 MVP

**Goal**: Other people’s `@handle` tokens in message bodies show background + bold.

**Independent Test**: [quickstart.md](./quickstart.md) A — message with `@bob` shows styled chip; surrounding text normal.

### Implementation for User Story 1

- [X] T005 [US1] Replace plain `<p class="msg-body">{m.text}</p>` (and any duplicate body render paths in the same file) with `MessageBody` in `frontend/src/pages/Channel.tsx`, passing decrypted `m.text` and `props.me.handle`
- [X] T006 [US1] Ensure styled chips cover full `@` + handle unit and use `.msg-mention` from `frontend/src/styles/mesa-theme.css`; verify theme light/dark readability (FR-004)

**Checkpoint**: Other-user mentions visibly styled in channel history.

---

## Phase 4: User Story 2 - Várias menções / não-handles (Priority: P2)

**Goal**: Every eligible `@handle` in a message is styled; emails / invalid `@` stay plain; left members still styled by pattern.

**Independent Test**: [quickstart.md](./quickstart.md) C + D.

### Implementation for User Story 2

- [X] T007 [US2] Harden `tokenizeMentionsForDisplay` in `frontend/src/lib/mentionParse.ts` so multiple mentions produce independent segments and email-like / non-boundary `@` are not mention segments (FR-003, FR-007)
- [X] T008 [US2] Spot-check Channel rendering with multi-mention and non-handle `@` via `MessageBody` in `frontend/src/pages/Channel.tsx` (no membership required for style)

**Checkpoint**: Multi-mention + false-positive `@` behave per spec.

---

## Phase 5: User Story 3 - Self plain + coexist with 062 (Priority: P2)

**Goal**: Reader’s own `@handle` stays unstyled; `.msg-highlight-me` still works.

**Independent Test**: [quickstart.md](./quickstart.md) B.

### Implementation for User Story 3

- [X] T009 [US3] Enforce case-insensitive self comparison in `tokenizeMentionsForDisplay` / `MessageBody` so `meHandle` tokens are never `.msg-mention` (`frontend/src/lib/mentionParse.ts`, `frontend/src/components/MessageBody.tsx`)
- [X] T010 [US3] Confirm `isHighlightForMe` / `.msg-highlight-me` path in `frontend/src/pages/Channel.tsx` still applies independently of token styling (FR-005)

**Checkpoint**: Self `@` plain; personal row highlight intact.

---

## Phase 6: User Story 4 - Clique → painel de membros (Priority: P2)

**Goal**: Click styled mention opens members panel focused on that member when available; otherwise no-op.

**Independent Test**: [quickstart.md](./quickstart.md) E + F.

### Implementation for User Story 4

- [X] T011 [P] [US4] Extend `mesa:members-panel` detail with optional `focusAccountId` and add `openMembersPanel({ accountId? })` (or equivalent) in `frontend/src/shell/AppShell.tsx` per [contracts/mention-handle-display.md](./contracts/mention-handle-display.md)
- [X] T012 [US4] In `frontend/src/components/MembersPanel.tsx`, on open with `focusAccountId`, scroll that member row into view and apply a brief highlight; ignore missing ids safely
- [X] T013 [US4] Wire `MessageBody` activation in `frontend/src/pages/Channel.tsx`: resolve handle → `account_id` via `handles()`; if found and not self, open panel with focus; if unknown, no-op; use `<button class="msg-mention">` only when activable, else `<span class="msg-mention">` ([research.md](./research.md) R5)

**Checkpoint**: Click available member focuses panel; unavailable chip is safe no-op.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Validation and docs hygiene.

- [X] T014 Run `cd frontend && npx tsc --noEmit` and fix type errors from MessageBody / AppShell / MembersPanel
- [X] T015 [P] Smoke [quickstart.md](./quickstart.md) A–F manually against running app
- [X] T016 [P] Update `docs/daily/2026-09-08.md` and `CHANGELOG.md` `[Unreleased]` when `/speckit-implement` completes (skip until implement)

**Checkpoint**: Feature ready for implement completion report.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **BLOCKS** US1–US4
- **US1 (Phase 3)**: After Foundational — MVP
- **US2 (Phase 4)**: After US1 (tokenize already used; harden edge cases)
- **US3 (Phase 5)**: After US1 (self rule may land in T002 early; verify here)
- **US4 (Phase 6)**: After US1 (needs styled chips); T011 can parallel T012 before T013
- **Polish (Phase 7)**: After desired stories

### User Story Dependencies

- **US1 (P1)**: Foundational only — MVP
- **US2 (P2)**: Builds on US1 tokenize/render
- **US3 (P2)**: Builds on US1; verify self + 062
- **US4 (P2)**: Builds on US1 chips + roster map

### Parallel Opportunities

- T003 CSS ∥ T002 tokenize (then T004 MessageBody)
- T011 AppShell ∥ T012 MembersPanel before T013 Channel wire
- T015 quickstart ∥ T016 docs (after implement)

### Parallel Example: Foundational

```bash
Task: "Add tokenizeMentionsForDisplay in frontend/src/lib/mentionParse.ts"
Task: "Add .msg-mention styles in frontend/src/styles/mesa-theme.css"
# then
Task: "Create MessageBody.tsx"
```

### Parallel Example: US4

```bash
Task: "Extend mesa:members-panel + openMembersPanel in AppShell.tsx"
Task: "Focus member row in MembersPanel.tsx"
# then
Task: "Wire MessageBody onMentionActivate in Channel.tsx"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1–2 → tokenize + MessageBody + CSS  
2. Phase 3 US1 → Channel uses MessageBody  
3. **STOP** — validate quickstart A  

### Incremental Delivery

1. US1 styled others  
2. US2 multi / non-handle  
3. US3 self plain + 062 check  
4. US4 click → members panel  
5. Polish + tsc + daily/CHANGELOG on implement  

### Suggested MVP scope

**US1 only** (T001–T006) — visible mention chips. US3 self-plain should be included in tokenize early (T002) even for MVP to avoid styling `@me` incorrectly.

---

## Notes

- FE-only; no migrations or `cargo test` required for Done  
- Do not style composer draft (out of scope)  
- Prefer span for non-activable styled left-members; button when roster hit  
- Format validation: all tasks use `- [ ]`, `Tnnn`, optional `[P]`, story `[USn]` on story phases, concrete paths
