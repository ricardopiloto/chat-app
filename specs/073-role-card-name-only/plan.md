# Implementation Plan: Cabeçalho do papel — só o nome

**Branch**: `073-role-card-name-only` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/073-role-card-name-only/spec.md`

**Note**: `.specify/feature.json` → `specs/073-role-card-name-only`. FE-only copy cleanup on roles manage cards.

## Summary

On the server roles / Perfis list (`RolesManagePage`), each `.permission-card-heading` currently shows the role **name** plus muted «posição N» and optional «(sistema)». Remove those secondary spans so the heading shows **only the role name**. Keep reorder / Permissões / delete controls unchanged; hierarchy remains in data and list order.

## Technical Context

**Language/Version**: TypeScript / SolidJS + existing CSS.

**Primary Dependencies**: `frontend/src/pages/RolesManagePage.tsx` (heading markup); optional CSS only if layout needs tweak after removing spans.

**Storage**: N/A (presentation only; `position` / `is_system` remain on role model).

**Testing**: `tsc --noEmit`; manual [quickstart.md](./quickstart.md).

**Target Platform**: Browser — `/servers/:id/settings/roles` (Perfis).

**Project Type**: Web UI polish.

**Performance Goals**: N/A (static markup change).

**Constraints**: Do not remove system-role protections on buttons; do not change RolePermissionsPage or MembersManagePage copy; scope = `.permission-card-heading` on roles manage list only.

**Scale/Scope**: ~1 FE file (+ optional CSS).

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

UI contract + presentation model + quickstart. **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/073-role-card-name-only/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── role-card-heading.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/pages/RolesManagePage.tsx   # remove posição / (sistema) from .permission-card-heading
frontend/src/styles/mesa-theme.css       # only if heading layout needs adjustment after removal
```

**Structure Decision**: One-line markup fix in the roles list heading; no API/schema changes.

## Complexity Tracking

N/A
