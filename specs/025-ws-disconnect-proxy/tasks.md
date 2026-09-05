---
description: "Task list for Ruído de proxy WS ao sair da sala"
---

# Tasks: Ruído de proxy WS ao sair da sala

**Input**: Design documents from `/specs/025-ws-disconnect-proxy/`

**Prerequisites**: [plan.md](./plan.md), [spec.md](./spec.md), [research.md](./research.md), [data-model.md](./data-model.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Sem TDD na spec. Validação: `cd frontend && npx tsc --noEmit` + manual [quickstart.md](./quickstart.md) §1–§4.

**Organization**: Setup (repro + identificar socket) → Foundational (mapa leave/`disconnect`) → US1 (0 spam Vite) → US2 (média limpa + rejoin) → US3 (falhas reais visíveis) → Polish.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no incomplete deps)
- **[Story]**: [US1], [US2], [US3]
- Paths per [plan.md](./plan.md)

## Path Conventions

`frontend/vite.config.ts`, `frontend/src/video/liveClient.ts`, `frontend/src/pages/VoiceChannel.tsx`, `frontend/src/api/ws.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Baseline do spam e confirmação `/rtc` vs `/ws`.

- [X] T001 Reproduce leave spam: join voice call via SPA on Vite `:1420`, click Sair, capture `[vite] ws proxy error: This socket has been ended by the other party` in the `npm run dev` terminal (baseline before code changes)
- [X] T002 [P] Confirm which WS closes on leave per [contracts/intentional-leave-ws.md](./contracts/intentional-leave-ws.md) and [quickstart.md](./quickstart.md) §1 (DevTools Network → WS: `/rtc` closes, `/ws` stays) and record finding in [research.md](./research.md) R1 if it differs

**Checkpoint**: Origem do erro identificada; baseline documentada.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Mapear o caminho de disconnect e races — **blocks** story fixes.

- [X] T003 Trace intentional leave path in `frontend/src/pages/VoiceChannel.tsx` (`leave()`, channel/server deleted handlers, `onCleanup` that calls `session?.disconnect()`) and `frontend/src/video/liveClient.ts` (`disconnect` → `room.disconnect` + `worker.terminate`) for double-disconnect or write-after-close races per [research.md](./research.md) R3
- [X] T004 [P] Review Vite proxy wiring for `/rtc` and `/ws` in `frontend/vite.config.ts` against [research.md](./research.md) R2 (note: Vite always logs `ws proxy error:` on proxy `error`; prefer ordered close over logger filter)

**Checkpoint**: Hipótese de fix (cliente vs proxy) escolhida sem silenciar logs.

---

## Phase 3: User Story 1 - Sair sem alarme falso no terminal Vite (Priority: P1) 🎯 MVP

**Goal**: Leave intencional → **0** ocorrências do erro de proxy citado no reporte.

**Independent Test**: [quickstart.md](./quickstart.md) §2 (5 leaves consecutivos).

### Implementation for User Story 1

- [X] T005 [US1] Make LiveKit disconnect ordered in `frontend/src/video/liveClient.ts` (await `room.disconnect` fully; stop local media before close if needed; avoid terminating worker before signaling close completes) so intentional leave does not trigger Vite `/rtc` proxy `writeAfterFIN`
- [X] T006 [US1] Deduplicate leave/`onCleanup` disconnect in `frontend/src/pages/VoiceChannel.tsx` so a single intentional leave cannot call `session.disconnect()` twice (or race with cleanup) per [data-model.md](./data-model.md) leaving → idle
- [X] T007 [US1] Only if T005–T006 cannot eliminate spam: apply the smallest viable `/rtc` proxy adjustment in `frontend/vite.config.ts` that improves close handshake — **MUST NOT** prefer silencing Vite’s logger (FR-002a / [research.md](./research.md) R3)
- [X] T008 [US1] Validate SC-001: 5 consecutive intentional leaves with **0** `[vite] ws proxy error: This socket has been ended by the other party` lines attributable to those leaves; if still inevitable after ordered close, add operational note (e.g. `docs/operar-instancia.md` or feature note) stating inevitability + verification criteria (FR-002 last resort)

**Checkpoint**: §2 passa (ou inevitabilidade documentada com leave/média limpos).

---

## Phase 4: User Story 2 - Leave liberta média e UI (Priority: P1)

**Goal**: Sair liberta mic/cam, UI fora da chamada; rejoin OK.

**Independent Test**: [quickstart.md](./quickstart.md) §3 + contrato leave limpo (media unpublished).

### Implementation for User Story 2

- [X] T009 [US2] Ensure `leave()` in `frontend/src/pages/VoiceChannel.tsx` still stops local blur/cam tracks, clears session, sets UI idle (`setLive(false)`, stage mode off) after the US1 disconnect changes
- [X] T010 [US2] Confirm rejoin works on first attempt after leave (same channel) without manual page refresh; fix any session-null / stuck-call regression in `frontend/src/pages/VoiceChannel.tsx` / `frontend/src/video/liveClient.ts` if found
- [X] T011 [US2] Confirm app `/ws` in `frontend/src/api/ws.ts` is **not** closed by intentional leave (shell events remain); only LiveKit session disconnects

**Checkpoint**: SC-002 / SC-003 e contrato leave limpo satisfeitos.

---

## Phase 5: User Story 3 - Falhas reais continuam visíveis (Priority: P2)

**Goal**: Quedas não intencionais não ficam mascaradas pelo fix do leave.

**Independent Test**: [quickstart.md](./quickstart.md) §4.

### Implementation for User Story 3

- [X] T012 [US3] Verify forced mid-call LiveKit (or media) outage still surfaces useful UI and/or log signal; if US1 proxy changes muted real errors, revert or narrow them in `frontend/vite.config.ts` / leave path so FR-004 / SC-004 hold
- [X] T013 [US3] Ensure no broad Vite `customLogger` / proxy error swallow was introduced that hides non-leave WS failures (audit `frontend/vite.config.ts` and any new helper)

**Checkpoint**: Leave limpo ≠ silêncio total em falha real.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Typecheck, quickstart full, docs de feature.

- [X] T014 Run `cd frontend && npx tsc --noEmit`
- [X] T015 [P] Run full [quickstart.md](./quickstart.md) §1–§4 and tick [contracts/intentional-leave-ws.md](./contracts/intentional-leave-ws.md) criteria
- [X] T016 [P] Update [research.md](./research.md) with final root cause + chosen fix (or inevitability note) after implementation
- [X] T017 Mark completed tasks in `specs/025-ws-disconnect-proxy/tasks.md`; on successful implement, append `docs/daily/yyyy-mm-dd.md` and `CHANGELOG.md` `[Unreleased]` per project rules

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Immediate
- **Foundational (Phase 2)**: After Setup — **BLOCKS** US1–US3 code changes
- **US1 (Phase 3)**: After Foundational — MVP
- **US2 (Phase 4)**: After US1 disconnect changes (same leave path)
- **US3 (Phase 5)**: After US1 (and any proxy tweak) — regression guard
- **Polish (Phase 6)**: After desired stories

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — no other story deps
- **US2 (P1)**: Depends on US1 leave/`disconnect` changes staying correct
- **US3 (P2)**: Depends on US1 fix not over-silencing

### Parallel Opportunities

- T001 then T002; T003 ∥ T004 after Setup
- Within US2: T009–T011 sequential on same files (avoid parallel edits to `VoiceChannel.tsx`)
- Polish: T015 ∥ T016 after T014

---

## Parallel Example: Foundational

```bash
Task: "Trace leave path in VoiceChannel.tsx + liveClient.ts"
Task: "Review vite.config.ts /ws and /rtc proxies (R2)"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Setup + Foundational (repro + map path)
2. US1 ordered disconnect → 0 Vite spam on leave
3. **STOP** and validate §2

### Incremental Delivery

1. US1 → clean terminal on leave  
2. US2 → media/UI/rejoin still good  
3. US3 → real failures still visible  
4. Polish → `tsc` + quickstart + research note

---

## Notes

- Prefer ordered LiveKit close over filtering Vite proxy logs (FR-002a).
- Document-only without eliminating spam only if inevitable + harmless + leave/media clean (FR-002).
- Do not close app `/ws` on call leave.
- Commit only if the user asks.
