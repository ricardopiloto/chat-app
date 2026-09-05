# Implementation Plan: Ir à mensagem a partir da pesquisa

**Branch**: `017-search-jump-highlight` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/017-search-jump-highlight/spec.md`

## Summary

Ao seleccionar um hit da pesquisa (014), navegar para o canal de texto com a **mensagem exacta** na vista (**centrada**), aplicar **destaque temporário ~3 s**, e em falha mostrar **toast/banner** não-modal. Frontend-only: query `message=` na rota do canal; `Channel.tsx` resolve, faz scroll e destaca; se ausente, tenta páginas adicionais via `?before=` até um limite, senão toast.

## Technical Context

**Language/Version**: TypeScript ~5.8 (SolidJS 1.9 SPA) — frontend; backend só se a paginação existente for insuficiente (preferir API actual).

**Primary Dependencies**: `@solidjs/router`, `SearchPanel.tsx`, `Channel.tsx` / `ChannelRoute`, `GET /api/channels/{id}/messages?before=`, tokens CSS Mesa.

**Storage**: N/A (estado de destaque/toast em memória).

**Testing**: `cd frontend && npx tsc --noEmit`; validação manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser; canais de texto E2EE (decrypt já no load).

**Project Type**: Web app — principalmente `frontend/`; API de listagem já existe.

**Performance Goals**: Salto + destaque no caminho feliz (mensagem na página inicial) em poucos segundos; seek paginado ≤ ~5 pedidos adicionais.

**Constraints**: FR-007/008 — sem mudar sintaxe de pesquisa; destaque ~3 s; sem clear por scroll/clique; toast não-modal; limite de páginas (clarificação).

**Scale/Scope**: `openHit` + deep-link query; highlight CSS; helper toast; seek opcional com `before` (limite 5).

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

Contratos UI (deep-link, highlight, toast); sem schema novo. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/017-search-jump-highlight/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── search-hit-navigation.md
│   └── message-highlight.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/
├── components/SearchPanel.tsx     # ALTERAR — openHit → ?message=
├── pages/Channel.tsx              # ALTERAR — resolve messageId, scroll, highlight, seek
├── shell/AppShell.tsx ou TopBar   # ALTERAR — montar toast host (se necessário)
├── ui/toast.ts (ou equivalente)   # CRIAR — aviso breve não-modal
└── styles/mesa-theme.css          # ALTERAR — .msg-highlight, .toast

backend/  # Preferir intocado; list_messages?before= já existe (200/página)
```

**Structure Decision**: Deep-link por query string + lógica de foco no `Channel`; toast partilhado mínimo; sem endpoint novo salvo descoberta de bloqueio no plan/implement.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
