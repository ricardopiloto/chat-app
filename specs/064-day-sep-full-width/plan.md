# Implementation Plan: Separadores de dia a largura total da área de scroll

**Branch**: `064-day-sep-full-width` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/064-day-sep-full-width/spec.md`

**Depends on**: [061-channel-day-separators](../061-channel-day-separators/)

## Summary

Ajuste **só de layout/CSS (+ pequeno restructure DOM em Channel)** sobre os separadores 061: (1) dash lines dos `.day-sep` **inline** passam a ocupar a largura do conteúdo de `.text-scroll` (dentro do padding lateral habitual), sem ficarem presas ao `max-width: 74ch` da coluna de mensagens; (2) o chip sticky fica **flush ao topo** da área de scroll (sem vão vertical), mantendo forma de pílula sem dash line própria. Sem mudanças em `daySeparators.ts` de lógica de dias, APIs ou backend.

## Technical Context

**Language/Version**: TypeScript / SolidJS (frontend only).

**Primary Dependencies**: `frontend/src/pages/Channel.tsx`, `frontend/src/styles/mesa-theme.css`; lógica 061 em `frontend/src/lib/daySeparators.ts` **inalterada** quanto a quando/como rotular.

**Storage**: N/A.

**Testing**: Manual [quickstart.md](./quickstart.md); `cd frontend && ./node_modules/.bin/tsc --noEmit`.

**Target Platform**: Browser (desktop + mobile web); canais de texto.

**Project Type**: Web UI / presentation polish.

**Performance Goals**: Zero custo extra de algoritmo; só CSS/DOM; sem jank no scroll.

**Constraints**: Não alterar FR 061 de aparição/sticky show-hide; mensagens mantêm coluna de leitura; sem scroll horizontal; sticky = chip compacto; lines dentro do padding lateral de `.text-scroll` (não edge-bleed exterior).

**Scale/Scope**: ~2–3 ficheiros FE (`Channel.tsx`, `mesa-theme.css`; opcional contrato CSS só).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart visual + tsc |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Contratos UI (inline full-width + sticky flush) + data-model layout + quickstart. Sem backend. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/064-day-sep-full-width/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── day-sep-inline-full-width.md
│   └── day-sep-sticky-flush.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/pages/Channel.tsx       # DOM: day-sep fora da coluna 74ch (ou equivalente)
frontend/src/styles/mesa-theme.css   # .day-sep full content-width; sticky top flush
frontend/src/lib/daySeparators.ts    # sem mudança de regras de dia (só se markup precisar)
```

**Structure Decision**: Frontend-only polish on 061. Prefer restructuring so `.day-sep` is a sibling of the message measure column (not a child of `.text-measure`), and apply `max-width: 74ch` only to message groups. Sticky flush via removing vertical offset (padding/top) and aligning host to the scrollport top while keeping horizontal padding of `.text-scroll`.

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/day-sep-inline-full-width.md](./contracts/day-sep-inline-full-width.md)
- [contracts/day-sep-sticky-flush.md](./contracts/day-sep-sticky-flush.md)
- [quickstart.md](./quickstart.md)
