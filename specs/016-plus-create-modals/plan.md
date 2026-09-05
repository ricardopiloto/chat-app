# Implementation Plan: Modais de criação (+) alinhados ao tema

**Branch**: `016-plus-create-modals` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/016-plus-create-modals/spec.md`

## Summary

Alinhar o **Dialog partilhado** e os **inputs partilhados** ao sistema visual Mesa e ao tema claro/escuro (actualização ao vivo), com aceitação focada nos modais disparados por **+** (criar canal texto/voz e criar servidor). Corrigir a herança de tema quando o diálogo é montado via `Portal` fora de `.app`. Frontend-only; sem mudanças de fluxo de criação nem backend.

## Technical Context

**Language/Version**: TypeScript ~5.8 (SolidJS 1.9 SPA) — frontend apenas.

**Primary Dependencies**: `solid-js`, `solid-js/web` (`Portal`), `Dialog.tsx`, tokens em `nocturne.css` / `mesa-theme.css`, `theme/theme.ts`, formulários em `Sidebar.tsx` (criar canal/servidor).

**Storage**: N/A (só apresentação).

**Testing**: `cd frontend && npx tsc --noEmit`; validação manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser; temas claro/escuro existentes.

**Project Type**: Web app — `frontend/` only (FR-006).

**Performance Goals**: Troca de tema reflecte no modal aberto sem jank perceptível (variáveis CSS).

**Constraints**: Sem novos endpoints; sem novos campos de formulário; aceitação focada em «+»; Dialog/input partilhados (clarificações).

**Scale/Scope**: Ajuste de `Portal` mount / tema no documento; CSS `.dialog*` e `.input` / `.field`; smoke nos formulários de criação em `Sidebar.tsx` se classes faltarem.

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

Sem API/schema; contratos UI cobrem Dialog, tema e inputs. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/016-plus-create-modals/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── dialog-surface.md
│   └── form-controls-theme.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/
├── components/Dialog.tsx          # ALTERAR — Portal mount sob .app (ou equivalente)
├── theme/theme.ts                 # ALTERAR se tema também no documentElement
├── styles/
│   ├── nocturne.css               # ALTERAR — .dialog* / .input alinhados a tokens Mesa
│   └── mesa-theme.css             # ALTERAR — light theme tokens acessíveis ao portal
└── shell/Sidebar.tsx              # VERIFICAR — classes .field/.input/.btn nos forms «+»

backend/            # Intocado
```

**Structure Decision**: Corrigir herança de tema no Portal; retocar CSS partilhado; não duplicar componentes de modal só para «+».

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
