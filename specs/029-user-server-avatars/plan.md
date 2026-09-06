# Implementation Plan: Avatares de utilizador e de servidor

**Branch**: `029-user-server-avatars` | **Date**: 2026-09-05 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/029-user-server-avatars/spec.md`

## Summary

Permitir a cada conta definir/substituir/remover um **avatar** (JPEG/PNG/WebP, ≤1 MiB) via configurações de utilizador (menu da conta), e ao **dono** do servidor definir/substituir/remover a **imagem do servidor** junto aos controlos de dono existentes. Bytes em claro num directório dedicado (não E2EE / não `ATTACHMENTS_DIR`). Exibir nos sítios de identidade actuais (chip topbar, membros, mensagens, rail) com fallback de iniciais e `object-fit: cover`. Outros clientes actualizam via refetch — sem push WS.

## Technical Context

**Language/Version**: Rust (backend Axum/SQLite) + TypeScript ~5.8 / SolidJS 1.9 (frontend).

**Primary Dependencies**: `account` / `server` / `MemberView` / `AuthAccount`; shell `AccountMenu`, `TopBar`, `MembersPanel`, `Channel`, `Sidebar`/`ServerRail`; padrão de upload de anexos (validação MIME/tamanho) **sem** reutilizar blobs cifrados.

**Storage**: SQLite — colunas nullable em `account` e `server`; ficheiros em `AVATARS_DIR` (default `./data/avatars`).

**Testing**: Contract tests Rust (upload/authz/oversize/MIME/owner); `cargo test`; `npx tsc --noEmit`; manual [quickstart.md](./quickstart.md).

**Target Platform**: Self-hosted Mesa (browser + API local/LAN).

**Project Type**: Web app — `backend/` + `frontend/`.

**Performance Goals**: Upload ≤1 MiB; chip/rail actualizam no próprio cliente sem reload completo da app.

**Constraints**: 1 MiB; JPEG/PNG/WebP; sem cropper; sem push; avatares visíveis a membros (não E2EE); remoção obrigatória; só dono altera imagem de servidor.

**Scale/Scope**: Uma imagem por conta + uma por servidor; UI mínima de settings (só avatar / só imagem de servidor).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contract tests API + `tsc` + quickstart (alinhado a features de media/API) |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Schema + endpoints + UI shell; storage separado de anexos E2EE. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/029-user-server-avatars/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── avatars-api.md
└── spec.md
```

### Source Code (repository root)

```text
backend/
├── migrations/
│   └── 0008_user_server_avatars.sql
├── src/
│   ├── config.rs                 # AVATARS_DIR
│   ├── domain/                   # MAX_AVATAR_BYTES, MIME helpers
│   ├── db/account.rs / server.rs # avatar_path / image_path
│   └── api/                      # PUT/DELETE/GET avatar + server image
└── tests/contract/               # avatar + server-image contracts

frontend/
└── src/
    ├── api/client.ts             # types + MAX_AVATAR_BYTES
    ├── components/
    │   ├── AccountMenu.tsx       # entrada settings avatar
    │   └── MembersPanel.tsx      # img + fallback
    ├── shell/
    │   ├── TopBar.tsx            # chip avatar
    │   ├── Sidebar.tsx           # dono: imagem servidor
    │   └── ServerRail.tsx        # glyph imagem
    ├── pages/Channel.tsx         # msg avatar
    └── styles/mesa-theme.css     # object-fit nos avatares

docs/operar-instancia.md          # AVATARS_DIR
.gitignore                        # data/avatars/
```

**Structure Decision**: Extender Account/Server + novos endpoints de media em claro; FE reutiliza superfícies shell existentes (AccountMenu + menu de dono no Sidebar).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
