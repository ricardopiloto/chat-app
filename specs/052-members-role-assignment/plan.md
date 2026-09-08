# Implementation Plan: Atribuição de papéis na gestão de membros

**Branch**: `052-members-role-assignment` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/052-members-role-assignment/spec.md`

## Summary

Separar **definição de perfis** («Papéis do servidor» / menu **Perfis**) da **atribuição** (página **Membros**). Passar a **papel único** por membro (migração FR-011). Roster lateral: **Online / Offline** (sessão WS activa) com subgrupos por papel. Menu no nome do servidor: **Membros** + **Perfis**; convite fica no header.

## Technical Context

**Language/Version**: Rust (Axum/SQLx) + TypeScript / SolidJS.

**Primary Dependencies**: `server_role` / `server_role_member` (047); `WsHub` (`backend/src/ws/mod.rs`) para presença; Sidebar chrome; `RolesPanel`, `MembersPanel`, rotas `/servers/:serverId/...`.

**Storage**: SQLite — migração `0014_*` (normalizar multi-papel → um; constraint de unicidade por membro/servidor).

**Testing**: `cargo test` (contratos API/migração); `cd frontend && ./node_modules/.bin/tsc --noEmit`; [quickstart.md](./quickstart.md) manual.

**Target Platform**: Instância self-hosted Mesa (desktop + narrow shell).

**Project Type**: Web app (frontend + backend).

**Performance Goals**: Página de gestão utilizável com ≥100 membros (pesquisa client-side OK v1); presença O(membros ∩ hub) sem varrer DB pesado.

**Constraints**: Papel único (sem união de caps); online = conta com ≥1 socket no `WsHub`; dono + `can_manage_roles` para gestão; não mover convite para o menu.

**Scale/Scope**: Centenas de membros/servidor; UI roster + página gestão + migração dados + API presença.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contratos + quickstart (sem TDD formal pedido) |
| Complexity Tracking | Vazio se decisões em research forem simples |

**Gate: PASS**

### Re-check pós-Phase 1

Migração + presença WS + UI split são justificados pelo spec/clarify. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/052-members-role-assignment/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── single-role-assignment.md
│   ├── presence-roster.md
│   └── server-menu-members-perfis.md
└── spec.md
```

### Source Code (repository root)

```text
backend/migrations/0014_single_role_and_presence.sql   # normalize + uniqueness
backend/src/db/server_role.rs                          # set single role; aggregated_caps = one role
backend/src/api/roles.rs                               # assign member role; tighten set_members
backend/src/api/presence.rs (or servers.rs)            # GET presence / WS presence events
backend/src/ws/mod.rs                                  # expose online set; emit on connect/disconnect
backend/tests/contract/…                               # single-role + presence smoke

frontend/src/components/RolesPanel.tsx                 # create/perms/delete only
frontend/src/pages/MembersManagePage.tsx               # NEW: assign single role + search
frontend/src/components/MembersPanel.tsx               # Online/Offline → role groups
frontend/src/shell/Sidebar.tsx                         # server-name menu: Membros + Perfis
frontend/src/App.tsx                                   # route /servers/:id/members
frontend/src/api/client.ts                             # assignRole, presence helpers
frontend/src/styles/mesa-theme.css                     # roster sections + manage page
```

**Structure Decision**: Member-centric assign API + keep `server_role_member` with **one row per (server, account)** enforced in DB; presence derived from existing `WsHub` connection map.

## Complexity Tracking

> Sem violações de constituição ratificada. Complexidade aceite: migração de modelo multi→single + presença de sessão (já parcialmente no hub).

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
