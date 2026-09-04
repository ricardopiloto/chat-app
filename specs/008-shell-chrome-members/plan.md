# Implementation Plan: Chrome Mesa — botões, composer, palco e membros

**Branch**: `008-shell-chrome-members` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/008-shell-chrome-members/spec.md`

## Summary

Alinhar chrome Mesa ao protótipo Nocturne v2 nos botões (pílula), composer de texto a largura total do painel, e **Modo palco** que **colapsa** a coluna de canais (rail permanece) em vez de ocultar 100% o chrome — divergindo do HTML de referência. Adicionar painel **Membros** à direita, disparado no cabeçalho do canal (texto e voz), reutilizando `GET /api/servers/{id}/members`; troca de servidor com painel aberto mantém o painel e actualiza a lista.

## Technical Context

**Language/Version**: TypeScript (SolidJS SPA) + Rust 2021 (Axum) — herdado; backend só se necessário para shape de members (já existe).

**Primary Dependencies**: SolidJS, Vite, `mesa-theme.css` / `nocturne.css`; API members existente; `uiPrefs` / stage-mode events.

**Storage**: SQLite **sem** migração; estado UI em memória + opcional localStorage.

**Testing**: `npx tsc --noEmit`; manual [quickstart.md](./quickstart.md); testes Rust só se handlers members forem tocados (não previsto).

**Target Platform**: Browser desktop + telemóvel (drawer/narrow já no shell).

**Project Type**: Web app (`frontend/` + `backend/`).

**Performance Goals**: SC da spec — lista membros sem bloquear UI; layout stage sem jank óbvio.

**Constraints**: Rail visível em stage; expandir canais ≠ sair do palco; botão membros no header; sem schema; E2EE inalterado.

**Scale/Scope**: CSS chrome + `AppShell` / stage classes; `Channel` + `VoiceChannel` headers; componente painel membros; 2 contratos UI/API.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — quickstart + tsc |
| Complexity Tracking | Vazio — UI/CSS + consumo API existente |

**Gate: PASS**

### Re-check pós-Phase 1

Sem schema novo; contratos cobrem chrome/stage e members panel. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/008-shell-chrome-members/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ui-chrome-stage-composer.md
│   └── members-panel.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/
├── styles/mesa-theme.css, nocturne.css   # .btn pill, .composer, .shell.stage-mode*
├── shell/AppShell.tsx                    # grid stage + channel strip/expand + members column?
├── pages/Channel.tsx, VoiceChannel.tsx   # header Membros; composer já no Channel
├── components/                           # MembersPanel (novo) ou inline
└── preferences/uiPrefs.ts                # opcional stageChannelsExpanded / membersPanelOpen

backend/src/api/channel_roles.rs          # list_members — sem mudança prevista
```

**Structure Decision**: Frontend-only salvo se contrato members precisar de campos extra (não previsto).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md) — decisões pill / composer / stage / members
- [data-model.md](./data-model.md) — UiChromeState + ServerMember
- [contracts/](./contracts/) — UI chrome + members panel
- [quickstart.md](./quickstart.md) — validação manual
