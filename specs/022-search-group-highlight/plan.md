# Implementation Plan: Destaque do grupo na pesquisa

**Branch**: `022-search-group-highlight` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/022-search-group-highlight/spec.md`

## Summary

Após salto da pesquisa (017), o destaque temporário (~3 s) aplica-se ao **`.msg-group`** que contém a mensagem alvo (avatar + meta + bolhas do grupo), **não** ao `.msg-block` individual — e **sem** ênfase secundária na bolha do hit. Scroll continua a centrar a mensagem (`data-message-id`). Frontend-only.

## Technical Context

**Language/Version**: TypeScript ~5.8 (SolidJS 1.9 SPA) — frontend only.

**Primary Dependencies**: Lógica 017 em `Channel.tsx` (`applyHighlight`, `focusMessage`, `HIGHLIGHT_MS`); CSS `.msg-highlight` em `mesa-theme.css`.

**Storage**: N/A (estado de destaque em memória, como 017).

**Testing**: `cd frontend && npx tsc --noEmit`; manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser; canal de texto.

**Project Type**: Web app — `frontend/` only.

**Performance Goals**: Mesmo caminho feliz de 017; mudança é O(1) DOM (`closest` / parent group).

**Constraints**: FR-001/001a — só grupo; FR-003 — centrar mensagem; não tocar search/014 nem hover/021; limpeza timer/substituição iguais a 017.

**Scale/Scope**: Ajuste de `applyHighlight` + CSS de `.msg-group.msg-highlight` (ou classe dedicada); remover estilo de highlight no `.msg-block` para o caminho de pesquisa.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — `tsc` + quickstart |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Sem API/schema; contrato UI + data-model de apresentação. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/022-search-group-highlight/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── search-group-highlight.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/
└── src/
    ├── pages/
    │   └── Channel.tsx               # ALTERAR — applyHighlight no .msg-group
    └── styles/
        └── mesa-theme.css            # ALTERAR — .msg-group.msg-highlight; limpar .msg-block.msg-highlight se só usado por pesquisa

backend/            # Intocado
```

**Structure Decision**: Reutilizar classe `msg-highlight` no ancestral `.msg-group` via `el.closest(".msg-group")` após localizar `data-message-id`; CSS move o visual para o grupo.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
