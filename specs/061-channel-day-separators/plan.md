# Implementation Plan: Separadores de dia no canal de texto

**Branch**: `061-channel-day-separators` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/061-channel-day-separators/spec.md`

## Summary

Apresentação **apenas no cliente** de separadores de dia no canal de texto: dash line inline no início de cada dia civil (fuso local) que tenha mensagens carregadas, rótulos **Hoje** / **Ontem** / `DD Mês AAAA` (pt), e rótulo **sticky** no topo do scroll quando o inline correspondente já saiu de vista. Sem API, migrações ou alteração de persistência. Integrar em `Channel.tsx` + helper de formatação/timeline + CSS em `mesa-theme.css`.

## Technical Context

**Language/Version**: TypeScript / SolidJS (frontend only).

**Primary Dependencies**: `frontend/src/pages/Channel.tsx` (lista `.text-scroll` / `groupMessages`), `frontend/src/styles/mesa-theme.css`; novo módulo utilitário (ex. `frontend/src/lib/daySeparators.ts` ou `frontend/src/chat/daySeparators.ts`).

**Storage**: N/A (derivado de `created_at` / `Row.createdAt` já carregado).

**Testing**: Manual [quickstart.md](./quickstart.md); `cd frontend && ./node_modules/.bin/tsc --noEmit`; testes unitários opcionais do formatador/timeline (puro, sem DOM) se o projecto já tiver harness FE — senão quickstart + tsc.

**Target Platform**: Browser (desktop + mobile web); canais de texto autenticados.

**Project Type**: Web UI / chat presentation.

**Performance Goals**: Recálculo O(n) nas mensagens carregadas; sticky via scroll/`IntersectionObserver` sem jank perceptível em histórico tipicamente paginado; sem trabalho no backend.

**Constraints**: Só canais de texto; não inventar dias vazios; sticky não duplica quando inline está no topo; agrupamento por remetente **não** atravessa fronteiras de dia; sem mudanças de API/E2EE.

**Scale/Scope**: 1 página + 1 módulo util + CSS (+ opcional componente sticky); ~3–6 ficheiros.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart visual + tsc; lógica pura testável |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Modelo de timeline + contratos UI (inline/sticky/labels) + quickstart. Sem backend. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/061-channel-day-separators/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── day-separator-inline.md
│   ├── day-separator-sticky.md
│   └── day-label-format.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/lib/daySeparators.ts   # civil day key, label Hoje/Ontem/data, buildTimelineItems
frontend/src/pages/Channel.tsx      # render timeline + sticky overlay; midnight / message list refresh
frontend/src/styles/mesa-theme.css  # .day-sep inline + .day-sep-sticky
```

**Structure Decision**: Keep presentation in Channel; extract pure date/timeline helpers to `lib/` for clarity and unit-testability. No backend touch.

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/day-separator-inline.md](./contracts/day-separator-inline.md)
- [contracts/day-separator-sticky.md](./contracts/day-separator-sticky.md)
- [contracts/day-label-format.md](./contracts/day-label-format.md)
- [quickstart.md](./quickstart.md)
