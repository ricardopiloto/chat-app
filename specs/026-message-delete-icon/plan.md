# Implementation Plan: Ícone de lixeira no Apagar mensagem

**Branch**: `026-message-delete-icon` | **Date**: 2026-09-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/026-message-delete-icon/spec.md`

## Summary

Substituir o rótulo textual «Apagar» no controlo de apagar mensagem (011) por um **ícone de lixeira** icon-only, com **fundo + borda + ícone** num vermelho claro combinado; tooltip `title="Apagar"`; manter `aria-label`, confirmação e permissões.

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9 — frontend only.

**Primary Dependencies**: `Channel.tsx` (botão `.msg-delete`), `mesa-theme.css` / `nocturne.css` (tokens `--color-danger*`, `.btn-*`), família `frontend/src/components/icons/` (`Icon` shell).

**Storage**: N/A.

**Testing**: `cd frontend && npx tsc --noEmit`; manual [quickstart.md](./quickstart.md) (hover, tooltip, temas, apagar).

**Target Platform**: Browser; canal de texto Mesa (claro/escuro).

**Project Type**: Web app — `frontend/` only.

**Performance Goals**: Controlo aparece no mesmo hover/foco que hoje (≤1 s perceptível).

**Constraints**: Só o botão de mensagem; não alterar menus Apagar canal/servidor/cena nem o texto do `confirm`; não usar `.btn-danger` saturado (Sair) — pedido é vermelho **claro** suave.

**Scale/Scope**: 1 ícone novo + markup em `Channel.tsx` + CSS `.msg-delete` (tokens soft se preciso).

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

UI polish; contrato de controlo + CSS. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/026-message-delete-icon/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── message-delete-control.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/
└── src/
    ├── components/icons/
    │   ├── Icon.tsx              # Shell existente
    │   └── IconTrash.tsx         # NOVO
    ├── pages/
    │   └── Channel.tsx           # ALTERAR — botão msg-delete
    └── styles/
        ├── mesa-theme.css        # ALTERAR — .msg-delete soft red
        └── nocturne.css          # Só se tokens/helpers danger soft viverem aqui
```

**Structure Decision**: Novo `IconTrash` + restyle `.msg-delete` (sair de `btn-ghost` textual); espelhar padrão icon-only + `title` de [020](../020-call-control-icons/).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
