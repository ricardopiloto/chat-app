# Implementation Plan: Notificações com nome do canal e data/hora

**Branch**: `068-notif-channel-datetime` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/068-notif-channel-datetime/spec.md`

**Depends on**: [062-message-mentions-replies](../062-message-mentions-replies/), [066-topbar-notif-panel](../066-topbar-notif-panel/)

**Note**: `.specify/feature.json` → `specs/068-notif-channel-datetime`. Clarifications: relative Hoje/Ontem + short date; one-line durable items; session unseen = channel name only (no time).

## Summary

Frontend-only TopBar notification list copy: durable items show **channel name + local day/time** on one line (no Menção/Resposta, no UUID); session «canais com mensagens novas» show **channel name only**. Resolve names via existing channel GET (cached per id); format times with a small PT-local helper aligned to 061 day labels. Click/mark-read/deep-link unchanged.

## Technical Context

**Language/Version**: TypeScript / SolidJS + CSS.

**Primary Dependencies**: `frontend/src/shell/TopBar.tsx`, `frontend/src/api/client.ts` (`UserNotification`, `api<Channel>`), optional `frontend/src/lib/notifFormat.ts` (or extend daySeparators), `frontend/src/styles/mesa-theme.css` (one-line secondary time style).

**Storage**: N/A (presentation only; `created_at` / `channel_id` already on notification).

**Testing**: `tsc --noEmit`; manual [quickstart.md](./quickstart.md) A–E.

**Target Platform**: Browser TopBar notif panel.

**Project Type**: Web UI copy/layout polish.

**Performance Goals**: Resolve unique channel ids once per panel open (cache map); O(n) format; no N× waterfall blocking first paint longer than necessary (show fallback then hydrate names).

**Constraints**: No API/schema changes; no type labels on durable rows; no invented timestamps on session unseen; preserve 062 click → channel/`?msg=` + mark read; fallback «Canal indisponível» without UUID.

**Scale/Scope**: TopBar + small format helper + light CSS; ~2–3 FE files.

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

UI contract + presentation model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/068-notif-channel-datetime/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── notif-list-labels.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/shell/TopBar.tsx              # item labels + name cache
frontend/src/lib/notifFormat.ts            # NEW: formatNotifWhen / channel label helpers
frontend/src/styles/mesa-theme.css         # .topbar-notif-when secondary style
frontend/src/api/client.ts                 # reuse Channel GET (no new types required)
```

**Structure Decision**: Keep formatting pure in `lib/`; TopBar owns cache of `channelId → name` loaded when durable/unseen ids are known. No backend.

## Complexity Tracking

N/A
