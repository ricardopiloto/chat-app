# Implementation Plan: Nome de canal (32 / hífen) e cadeado à direita

**Branch**: `072-channel-name-lock` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/072-channel-name-lock/spec.md`

**Note**: `.specify/feature.json` → `specs/072-channel-name-lock`. Clarifications: live spaces→`-` + hard 32 while typing; reject empty/hyphen-only; string length (no grapheme rule); private lock right + name under lock with fade.

## Summary

Enforce channel name rules (**max 32**, spaces → `-` in real time, reject empty / only-`-`) on create + rename in the sidebar (and matching BE validation). Reposition the private-channel **lock** to the **right** of the sidebar row so the name scrolls/clips **under** the icon with a soft fade — lock masks overflow; nothing readable to the right of the lock. Public channels unchanged (no lock).

## Technical Context

**Language/Version**: TypeScript / SolidJS (FE); Rust / Axum (BE validation).

**Primary Dependencies**: `frontend/src/shell/Sidebar.tsx` (create + rename inputs, channel rows), `frontend/src/styles/mesa-theme.css` (`.channel-item` layout), optional `frontend/src/lib/channelName.ts` helper; `backend/src/api/channel_provision.rs`, `backend/src/api/channels.rs` (patch name); contract tests for rename/create.

**Storage**: Existing `channel.name` column; no migration (legacy names out of scope unless edited).

**Testing**: `tsc --noEmit`; BE contract tests for name rules; manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser sidebar + channel create modal in Sidebar.

**Project Type**: Web app (FE + thin BE validation).

**Performance Goals**: O(1) normalize on each keystroke; CSS-only mask (no measure loops).

**Constraints**: `#` prefix not counted; emoji length = JS/Rust string chars; each whitespace → one `-` (no collapse required); lock mask sidebar-only.

**Scale/Scope**: ~3–5 FE files + 2 BE name-validate call sites + CSS; no redesign outside channel rows.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc + BE contract for name rules |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

UI + name normalize contracts + data-model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/072-channel-name-lock/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── channel-name-normalize.md
│   └── channel-lock-layout.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/lib/channelName.ts           # NEW: normalize + validate (32, spaces→-, hyphen-only)
frontend/src/shell/Sidebar.tsx            # create/rename inputs; lock after name / right slot
frontend/src/styles/mesa-theme.css        # .channel-item grid/flex + fade under lock
backend/src/api/channel_provision.rs      # validate normalized name on create
backend/src/api/channels.rs               # validate on PATCH name
backend/tests/contract/…                  # reject >32, spaces, hyphen-only
```

**Structure Decision**: Shared FE helper for live input; shared BE validation function (or inline same rules) so client cannot bypass.

## Complexity Tracking

N/A
