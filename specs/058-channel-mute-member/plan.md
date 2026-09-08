# Implementation Plan: Silenciar no canal e remoção de membro

**Branch**: `058-channel-mute-member` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/058-channel-mute-member/spec.md`

## Summary

Clarificar **Remover membro** (só membership; UI sem linguagem de apagar conta). Adicionar **silêncio por canal** com presets 5/10/15/30 min + custom (1–1440), capacidade nova **`can_mute_members`**, UI no menu do membro (roster do canal / MembersPanel com canal activo), composer bloqueado para o silenciado, levantar no mesmo menu; editar/apagar próprias mensagens continua permitido.

## Technical Context

**Language/Version**: Rust (Axum/SQLx) + TypeScript / SolidJS.

**Primary Dependencies**: `RoleCapabilities` / migration pattern `0013`; `delete_member` in `backend/src/api/roles.rs`; `post_message` in `backend/src/api/messages.rs`; `MembersPanel`, `MembersManagePage`, `RolePermissionsPage`; channel route for `channelId`.

**Storage**: SQLite — migration `0015_*`: column `server_role.can_mute_members`; table `channel_mute` (channel_id, account_id, muted_by, starts_at, ends_at, UNIQUE(channel, account)).

**Testing**: `cargo test` contracts (kick retains account; mute create/reject post/unmute/expiry); `tsc --noEmit`; [quickstart.md](./quickstart.md).

**Target Platform**: Mesa shell (text channel + members side panel; voice roster optional follow-up if same menu pattern).

**Project Type**: Web app (frontend + backend).

**Performance Goals**: Mute check on `POST` message O(1) by PK; list active mutes for menu O(muted in channel) small.

**Constraints**: Per-channel only; no account delete on kick; no new mute via Gerir membros as primary; owner ∪ `can_mute_members`; cannot mute owner/self.

**Scale/Scope**: One capability flag + one mute table + message gate + MembersPanel/Channel composer UX + role permissions toggle.

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

Mute table + capability + composer gate justified by clarify. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/058-channel-mute-member/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── kick-membership-only.md
│   ├── channel-mute-api.md
│   └── channel-mute-ui.md
└── spec.md
```

### Source Code (repository root)

```text
backend/migrations/0015_channel_mute_and_cap.sql
backend/src/domain/server_role.rs              # can_mute_members
backend/src/domain/channel_mute.rs             # NEW entity (optional)
backend/src/db/server_role.rs                  # persist/aggregate new cap
backend/src/db/channel_mute.rs                 # upsert/get/delete/list active
backend/src/db/mod.rs
backend/src/api/messages.rs                    # reject post if muted
backend/src/api/channels.rs or mute.rs         # POST/DELETE mute; GET my mute / list
backend/src/api/mod.rs                         # routes
backend/tests/contract/…                       # kick + mute

frontend/src/api/client.ts                     # caps + mute helpers
frontend/src/pages/RolePermissionsPage.tsx     # toggle Silenciar membros
frontend/src/components/MembersPanel.tsx       # Silenciar / Levantar + duration UI
frontend/src/pages/MembersManagePage.tsx       # kick copy only
frontend/src/pages/Channel.tsx                 # composer disabled when muted
frontend/src/lib/capabilities.ts               # if needed
frontend/src/styles/mesa-theme.css
```

**Structure Decision**: Persist mutes in SQLite with absolute `ends_at`; enforce on `POST /messages`; expose mute CRUD under `/api/channels/{id}/mutes/...`. Kick path already deletes membership only — tighten UI copy + contract that account row survives.

## Complexity Tracking

> Sem violações. Aceite: nova coluna de capacidade + tabela de mute (padrão 047).

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
