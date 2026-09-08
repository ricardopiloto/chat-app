# Implementation Plan: Renomear canais com hierarquia

**Branch**: `054-channel-rename` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/054-channel-rename/spec.md`

## Summary

Permitir **renomear** canais (texto e voz) via **duplo-clique / duplo-toque** no nome na barra lateral. Autorização: **dono do servidor** ∪ **criador do canal** ∪ capacidade **Gerenciar canal**. Estender `PATCH /api/channels/{id}` com `name`; validação alinhada à criação (trim, não vazio; **sem** unicidade).

## Technical Context

**Language/Version**: Rust (Axum/SQLx) + TypeScript / SolidJS.

**Primary Dependencies**: `backend/src/api/channels.rs` (`patch_channel`), `backend/src/db/channel.rs`, `domain/permissions` + `aggregated_caps.can_manage_channels`; `frontend/src/shell/Sidebar.tsx` (lista de canais).

**Storage**: SQLite `channel.name` (já existe; sem migração de schema).

**Testing**: Contrato `cargo test` (auth matrix + validação); `tsc --noEmit`; [quickstart.md](./quickstart.md).

**Target Platform**: Shell Mesa desktop + drawer/tactil.

**Project Type**: Web app (frontend + backend).

**Performance Goals**: Rename em menos de 1s na percepção do utilizador; refresh local da lista após PATCH.

**Constraints**: Sem ACL nova; nomes duplicados OK; só campo `name` (não redesenhar visibilidade/ACL neste fluxo).

**Scale/Scope**: Um endpoint PATCH + UI inline na Sidebar.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contratos + quickstart |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

API + UI inline justificados pelas clarificações. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/054-channel-rename/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── channel-rename-api.md
│   └── channel-rename-ui.md
└── spec.md
```

### Source Code (repository root)

```text
backend/src/api/channels.rs          # PatchChannelBody.name + auth helper
backend/src/db/channel.rs            # update_name
backend/src/domain/permissions.rs    # optional can_rename_channel helper
backend/tests/contract/…             # rename auth + validation

frontend/src/shell/Sidebar.tsx       # dblclick/dbltap inline edit
frontend/src/api/client.ts           # patchChannel name
frontend/src/styles/mesa-theme.css   # inline rename input
```

**Structure Decision**: Extend existing `PATCH /channels/{id}` with optional `name` rather than a dedicated rename route; share auth with “manage channel” semantics (owner | creator | `can_manage_channels`).

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
