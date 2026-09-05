# Implementation Plan: Apagar mensagens no canal de texto

**Branch**: `011-text-message-delete` | **Date**: 2026-09-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/011-text-message-delete/spec.md`

## Summary

Permitir apagar mensagens de canal de **texto** com hierarquia: **autor** (próprias, sem limite de tempo) → **criador do canal** (qualquer no canal) → **dono do servidor** (qualquer canal de texto do servidor). Remoção **completa** (sem tombstone); confirmação; controlo no hover/foco; broadcast WS `message.deleted`; apagar anexos DB + ficheiros em disco.

## Technical Context

**Language/Version**: TypeScript (SolidJS) + Rust 2021 (Axum/sqlx) — herdado.

**Primary Dependencies**: Axum DELETE route; existing `ws.send_to_server_members`; SolidJS Channel history UI; `window.confirm` (sem sistema de modal dedicado).

**Storage**: SQLite `message` hard DELETE; `message_attachment` CASCADE; remover blobs em `ATTACHMENTS_DIR/{id}` antes/depois do delete (CASCADE não limpa disco).

**Testing**: Contract tests (autor OK, membro alheio 403, criador canal OK, dono OK, canal voz 404/400, already-gone 404); `cargo test`; `npx tsc --noEmit`; manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser + self-hosted backend.

**Project Type**: Web app (`frontend/` + `backend/`).

**Performance Goals**: SC-001/002 — apagar e sync remoto ≤3 s LAN.

**Constraints**: Só canais `text`; sem soft-delete UI; sem cargos genéricos; sem bulk delete; anexos inutilizáveis após delete.

**Scale/Scope**: 1 endpoint DELETE + 1 evento WS; helpers DB; UI hover + confirm em `Channel.tsx`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | N/A — contract tests + quickstart |
| Complexity Tracking | Nenhuma violação |

**Gate: PASS**

### Re-check pós-Phase 1

Contrato DELETE + evento WS; modelo documenta hard delete e limpeza de anexos. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/011-text-message-delete/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── message-delete-api.md
└── spec.md
```

### Source Code (repository root)

```text
backend/
├── src/api/messages.rs              # DELETE handler + ACL
├── src/api/mod.rs                   # route
├── src/db/message.rs                # delete_by_id
├── src/db/attachment.rs             # list + delete files for message
├── src/domain/permissions.rs        # can_delete_text_message (opcional)
└── tests/contract/…                 # delete ACL tests

frontend/src/
├── api/client.ts                    # deleteMessage helper
├── pages/Channel.tsx                # hover Apagar + confirm + WS remove
└── styles/mesa-theme.css            # msg action visibility on hover/focus
```

**Structure Decision**: Estender API/mensagens existentes; sem migração de schema.

## Complexity Tracking

Nenhuma violação a justificar.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/message-delete-api.md](./contracts/message-delete-api.md)
- [quickstart.md](./quickstart.md)
