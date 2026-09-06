# Implementation Plan: Painel principal alinhado ao servidor seleccionado

**Branch**: `041-server-scoped-pane` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/041-server-scoped-pane/spec.md`

## Summary

Ao seleccionar um servidor na rail, a **área principal** MUST deixar de mostrar canais do servidor anterior. Navegar para o canal preferido desse servidor (último visitado local → primeiro texto → primeiro qualquer) ou, se **zero** canais, um ecrã em branco com **piada aleatória** PT-BR. Persistência local do último canal por servidor. Sessão de voz noutro servidor (PiP) pode continuar — só o painel muda. Frontend-only.

## Technical Context

**Language/Version**: TypeScript ~5.8 / SolidJS 1.9 — frontend only.

**Primary Dependencies**: `@solidjs/router` (`navigate`, routes); `AppShell` / `Sidebar` / `ServerRail` (`onSelectServer`); `ChannelRoute`; `localStorage` prefs (padrão `uiPrefs.ts`); lista de canais `GET /api/servers/:id/channels`.

**Storage**: `localStorage` mapa `serverId → channelId` (último canal); sem schema BE.

**Testing**: `npx tsc --noEmit`; manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser SPA.

**Project Type**: Web app — `frontend/` only.

**Performance Goals**: Troca de servidor actualiza o painel em ≤1 s (navegação client-side).

**Constraints**: Não terminar chamada noutro servidor; não mostrar «Canal não encontrado» no lugar da piada; piadas ≥3, tom leve.

**Scale/Scope**: Navegação + preferência + rota/vista vazia; sem API nova.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | `tsc` + quickstart |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

UI routing + localStorage; sem schema/API. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/041-server-scoped-pane/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── server-scoped-pane-ui.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/
├── preferences/
│   ├── lastChannelByServer.ts   # NOVO — read/write localStorage map
│   └── emptyServerJokes.ts      # NOVO — lista ≥3 piadas + pickRandom
├── pages/
│   ├── EmptyServerPane.tsx      # NOVO — ecrã branco + piada
│   └── ChannelRoute.tsx         # escrever last-channel ao montar canal válido
├── shell/
│   ├── Sidebar.tsx              # onSelect servidor → resolve + navigate
│   └── AppShell.tsx             # rota /servers/:serverId (opcional wiring)
└── App.tsx                      # Route EmptyServerPane
```

**Structure Decision**: No clique do servidor, resolver destino e `navigate`; persistir último canal; rota dedicada para servidor vazio.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
