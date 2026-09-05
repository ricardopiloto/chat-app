# Implementation Plan: Pesquisa por canal e atalho Ctrl+F

**Branch**: `014-search-channel-scope` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/014-search-channel-scope/spec.md`

## Summary

Estender a pesquisa inline da 013: atalho **Ctrl+F / Cmd+F** no shell (com pré-preenchimento `#nome ` em canal de texto, substituindo o campo); sintaxe **`#canal termo`** para restringir a canais de texto com esse nome; sem `#` → todos os canais de texto acessíveis; estados vazios distintos (não encontrado / só voz / sem resultados); placeholder obrigatório. Frontend-only; backend intocado.

## Technical Context

**Language/Version**: TypeScript ~5.8 (SolidJS 1.9 SPA) — frontend apenas.

**Primary Dependencies**: `solid-js`, `@solidjs/router` (`useParams` / query `type` da rota de canal), `SearchPanel.tsx` (013), `TopBar.tsx`, `api/client` (servers/channels/messages), `crypto/serverKey` (decifra). Sem dependências npm novas.

**Storage**: Nenhum. Estado de pesquisa continua em sinais locais; atalho lê o canal actual da rota.

**Testing**: `cd frontend && npx tsc --noEmit`; validação manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser (Windows/Linux Ctrl+F, macOS Cmd+F); shell autenticado.

**Project Type**: Web app — `frontend/` only (FR-009).

**Performance Goals**: Debounce ~250 ms no termo; âmbito `#canal` evita pedidos a canais fora do filtro; atalho ≤1 s (SC-001).

**Constraints**: Zero endpoints novos; só canais de texto no âmbito de hits; membership via `GET /api/servers`; mensagens de vazio distintas (FR-007); placeholder com sintaxe (FR-011).

**Scale/Scope**: Parser de consulta (~1 módulo); wiring de atalho em `TopBar`/`AppShell`; filtro no loop de pesquisa existente; copy de empty states + placeholder.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado (como 007–013).

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — `tsc` + quickstart |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Sem schema/API novos; contratos cobrem sintaxe, atalho e estados vazios. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/014-search-channel-scope/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── search-query-syntax.md
│   └── search-shortcut.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/
├── search/
│   └── parseSearchQuery.ts          # NOVO — parse `#canal termo` | global
├── components/
│   └── SearchPanel.tsx              # ALTERAR — parse, filtro, empty states, placeholder, seed query
├── shell/
│   ├── TopBar.tsx                   # ALTERAR — Ctrl/Cmd+F; expand + seed; canal actual
│   └── AppShell.tsx                 # (se necessário) passar channelName/type ao TopBar
└── pages/                           # rota canal já expõe id/type via router

backend/            # Intocado (FR-009)
```

**Structure Decision**: Extrair parser puro testável em `search/parseSearchQuery.ts`; `SearchPanel` aplica âmbito; `TopBar` captura atalho e obtém nome/tipo do canal da rota.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
