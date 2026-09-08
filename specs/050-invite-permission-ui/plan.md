# Implementation Plan: Botão de convite respeita permissão do papel

**Branch**: `050-invite-permission-ui` | **Date**: 2026-09-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/050-invite-permission-ui/spec.md`

## Summary

Corrigir a UI do chrome do servidor: o botão **Convite** deixa de estar acoplado a `isOwner()` e passa a seguir a capacidade efectiva «Criar convites» (dono **ou** papel atribuído), alinhado ao backend já existente. O botão **Gerir papéis** permanece só para o dono (FR-005).

## Technical Context

**Language/Version**: TypeScript / SolidJS (frontend); Rust backend already gates invites.

**Primary Dependencies**: `frontend/src/shell/Sidebar.tsx` (`isOwner`, `roles` resource, `canCreateChannels` pattern); `fetchServerRoles` / `ServerRole.capabilities.can_create_invites`; `backend/src/api/invites.rs` (create/list/revoke already check caps + owner).

**Storage**: N/A (no schema change).

**Testing**: Manual [quickstart.md](./quickstart.md); optional contract smoke if already covered; `cd frontend && ./node_modules/.bin/tsc --noEmit`.

**Target Platform**: Desktop shell Mesa (sidebar header).

**Project Type**: Web app — FE visibility bugfix.

**Performance Goals**: Sem pedidos extra além do `roles` resource já usado para criar canais.

**Constraints**: Não acoplar «Gerir papéis» a `can_create_invites`. União OR de papéis. Sem redesign do diálogo de convite.

**Scale/Scope**: Split de `<Show>` no header + predicado `canCreateInvites` espelhando `canCreateChannels`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc |
| Complexity Tracking | Vazio |

**Gate: PASS**

### Re-check pós-Phase 1

Mudança mínima no `Sidebar.tsx`; backend intacto. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/050-invite-permission-ui/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── invite-button-visibility.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/shell/Sidebar.tsx          # split owner roles gear vs canCreateInvites invite btn
frontend/src/api/client.ts              # RoleCapabilities already has can_create_invites (verify)
backend/src/api/invites.rs              # verify-only (owner || caps.can_create_invites)
backend/tests/contract/…                # optional assert non-owner with cap can create
```

**Structure Decision**: Frontend-only fix mirroring `canCreateChannels()`. Keep roles settings under `isOwner()` (or later `can_manage_roles` — out of scope unless already wired).

## Complexity Tracking

> Sem violações.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/invite-button-visibility.md](./contracts/invite-button-visibility.md)
- [quickstart.md](./quickstart.md)
