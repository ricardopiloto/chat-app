# Implementation Plan: Destaque ao pairar na mensagem de texto

**Branch**: `021-message-hover-highlight` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/021-message-hover-highlight/spec.md`

## Summary

No histórico do canal de texto, destacar a **unidade completa** da mensagem (`.msg-block`: texto, anexos, pré-visualizações) enquanto o ponteiro está sobre esse bloco ou o bloco está em foco — o mesmo alvo que já revela «Apagar». CSS-only; avatar/nome **não** disparam destaque. Estilo mais suave e distinto de `.msg-highlight` (017). Backend intocado.

## Technical Context

**Language/Version**: TypeScript ~5.8 (SolidJS 1.9 SPA) — frontend; backend **não** alterado.

**Primary Dependencies**: `mesa-theme.css`; `.msg-block` em `Channel.tsx` (já `tabindex={0}`); tokens `--hover` / `--press` vs `.msg-highlight` (017).

**Storage**: N/A (estado de hover/foco no browser).

**Testing**: `cd frontend && npx tsc --noEmit`; validação manual [quickstart.md](./quickstart.md). Sem alteração de TS esperada se o CSS for suficiente.

**Target Platform**: Browser; temas claro/escuro; `prefers-reduced-motion`.

**Project Type**: Web app — `frontend/src/styles/mesa-theme.css` (e só `Channel.tsx` se o bloco precisar de padding/classe extra).

**Performance Goals**: Destaque instantâneo no hover (CSS); zero pedidos de rede.

**Constraints**: FR-001–007 — uma mensagem de cada vez; não grupo do autor; não `text-scroll` inteiro; não avatar/nome; distinto de 017; não mudar apagar/pesquisa/salto.

**Scale/Scope**: 1–2 regras CSS no bloco de mensagem; eventual ajuste de padding do `.msg-block` para o fundo cobrir anexos.

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

Contrato UI hover/foco vs `.msg-highlight`; sem schema/API. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/021-message-hover-highlight/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── message-hover.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/
├── styles/mesa-theme.css   # ALTERAR — :hover / :focus-within em .msg-block
├── pages/Channel.tsx       # SÓ SE necessário (padding/classe); preferir CSS-only

backend/  # Intocado
```

**Structure Decision**: Selectors já usados para «Apagar» (`.msg-block:hover`, `:focus-within`). Novo fundo/raio no mesmo bloco; `.msg-highlight` mantém prioridade visual (accent + anel).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
