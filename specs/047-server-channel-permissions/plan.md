# Implementation Plan: Permissionamento de servidor e canais

**Branch**: `047-server-channel-permissions` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/047-server-channel-permissions/spec.md`

**Note**: `setup-plan.sh` resolved the git branch `048-…` first; artefacts were written explicitly under `specs/047-server-channel-permissions/` and `.specify/feature.json` pointed here.

## Summary

Introduzir ACL de servidor/canal: **membership = acesso ao servidor**; **papéis** com capacidade `can_create_channels`; canais **públicos** (todos os membros; opcional «visível a novos»; refinável leitura/escrita ou escuta/fala) vs **privados** (ACL explícita pessoa/papel; ícone; invisíveis sem permissão; nunca «visível a novos»). O **owner** do servidor tem visão/uso plenos. Enforce no backend em listagem, mensagens e voz; UI de criação (público/privado), gestão de papéis/ACL e ícone de privado. Migração: canais existentes → públicos + visíveis a novos + nível máximo.

## Technical Context

**Language/Version**: Rust 2021 (Axum, sqlx/SQLite); TypeScript ~5.8 / SolidJS 1.9.

**Primary Dependencies**: `api/authz.rs`, `domain/permissions.rs`, `db/channel.rs`, `db/membership.rs`, `api/channels.rs`, `api/messages.rs`, `api/voice.rs`, `api/invites.rs`; FE `Sidebar.tsx`, `client.ts`, MembersPanel / settings UI.

**Storage**: SQLite — novas tabelas `server_role`, `server_role_member`, `channel_acl` (+ colunas em `channel`: `visibility`, `visible_to_new_members`); migração `0012_…`; **não** reutilizar `channel_role` (`co_director`).

**Testing**: `cargo test --test contract` (membership kick, channel list filter, ACL text/voice, invite onboarding); `tsc --noEmit`; [quickstart.md](./quickstart.md).

**Target Platform**: Instância Mesa self-hosted (browser SPA).

**Project Type**: Web app — `backend/` + `frontend/`.

**Performance Goals**: Resolução de permissão efectiva por canal O(papéis do membro + ACL do canal) aceitável para N membros/canais típicos de mesa; listagem filtrada no SQL.

**Constraints**: FR-001–022 + clarificações (owner vê tudo; criar = owner|papel; membership=acesso; visível-a-novos só público; público≠exclusão pontual). Sem diretório público (G3). Separar de `co_director`.

**Scale/Scope**: Por servidor: papéis + ACL por canal; kick member; UI settings/ACL + create dialog + lock icon.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Contract tests + quickstart |
| Complexity Tracking | Justificado abaixo |

**Gate: PASS**

### Complexity Tracking

| Violation | Why needed | Simpler alternative rejected |
|-----------|------------|------------------------------|
| Novas tabelas de papéis + ACL | Spec exige papéis e concessões pessoa/papel por canal | Só flags booleanas no canal não cobrem papéis/níveis |
| Não reutilizar `channel_role` | Já é `co_director` (cenas); sobrecarregar mistura semânticas | Estender CHECK role — rejeitado |

### Re-check pós-Phase 1

Authz centralizada + migração + contratos API/UI. Sem LiveKit protocol change (só gates mic/cam). **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/047-server-channel-permissions/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── channel-visibility-acl.md
│   ├── server-roles.md
│   └── effective-permission-api.md
└── spec.md
```

### Source Code (repository root)

```text
backend/migrations/0012_server_channel_permissions.sql
backend/src/domain/permissions.rs       # effective text/voice level; can_create_channel; can_view
backend/src/domain/server_role.rs       # new
backend/src/domain/channel_acl.rs       # new (or under channel)
backend/src/db/server_role.rs
backend/src/db/channel_acl.rs
backend/src/db/channel.rs               # visibility cols; list_visible_for
backend/src/db/membership.rs            # delete/kick
backend/src/api/authz.rs                # require_channel_view / require_write / require_speak
backend/src/api/channels.rs             # create public|private; filter list; ACL CRUD
backend/src/api/messages.rs             # read vs write
backend/src/api/voice.rs                # listen vs speak (+ cam)
backend/src/api/invites.rs              # on accept: grant public visible_to_new
backend/src/api/roles.rs                # CRUD papéis + assign (new or extend channel_roles)
backend/tests/contract/…               # permissions suites
frontend/src/api/client.ts
frontend/src/shell/Sidebar.tsx          # create público/privado; ícone privado; gate create
frontend/src/components/…               # RoleManager / ChannelAclPanel (nomes conforme UI)
frontend/src/components/icons/…         # IconPrivate / lock
```

**Structure Decision**: Authz efectiva no domínio; listagem filtrada no DB; `channel_role`/`co_director` intocado; papéis em tabelas novas `server_role*`.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
