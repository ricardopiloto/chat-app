# Implementation Plan: Shell de configurações do servidor

**Branch**: `056-server-settings-shell` | **Date**: 2026-09-08 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/056-server-settings-shell/spec.md`

## Summary

Substituir o dropdown no nome do servidor por **engrenagem** (+ clique no nome = mesmo atalho) que entra em **modo configurações**: sidebar com navegação **agrupada** (Membros, Perfis, Imagem, Apagar), main com placeholder ou página seleccionada, **X** na topbar para voltar a canais. **Perfis** vira página (não modal). Remover Imagem/Apagar do context menu do rail. Sem APIs novas — só shell/rotas FE.

## Technical Context

**Language/Version**: TypeScript / SolidJS (frontend); Rust/Axum unchanged for this feature.

**Primary Dependencies**: `AppShell`, `Sidebar`, `TopBar`, `ServerRail`, `MembersManagePage`, `RolesPanel` → page, `RolePermissionsPage`, `ImageUploadDialog` / server image flow, `deleteServer`; Solid router paths under `/servers/:serverId/...`.

**Storage**: N/A (no schema). Existing server image + delete APIs.

**Testing**: `cd frontend && ./node_modules/.bin/tsc --noEmit`; manual [quickstart.md](./quickstart.md); no new backend contracts required unless redirects need smoke notes.

**Target Platform**: Mesa shell desktop + drawer/narrow.

**Project Type**: Web app (frontend chrome + routes).

**Performance Goals**: Mode switch perceived &lt; 200ms; no full remount of unrelated voice session unless route leaves channel.

**Constraints**: Hide gear if zero allowed items; owner-only Imagem/Apagar; channel ACL stays in channel context (FR-009); user-panel gear untouched (FR-010); X icon only (no «Sair» label).

**Scale/Scope**: ~4–6 settings routes + sidebar nav chrome; migrate 2 existing pages + 1 panel→page + image/delete flows.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` = template não ratificado.

| Gate | Status |
|------|--------|
| Princípios I–V | N/A |
| Test-first | Quickstart + tsc; no BE contracts |
| Complexity Tracking | Vazio — routing shell only |

**Gate: PASS**

### Re-check pós-Phase 1

URL-prefixed settings mode + page migration justified by clarify (deep-link SC-005, Perfis page). **PASS**.

## Project Structure

### Documentation (this feature)

```text
specs/056-server-settings-shell/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── settings-shell-chrome.md
│   ├── settings-nav-ia.md
│   └── settings-routes.md
└── spec.md
```

### Source Code (repository root)

```text
frontend/src/App.tsx                         # /servers/:id/settings/* routes + redirects
frontend/src/shell/AppShell.tsx              # detect settings mode; wire TopBar X
frontend/src/shell/Sidebar.tsx               # gear + name→settings; SettingsNav; drop dropdown
frontend/src/shell/ServerRail.tsx            # remove Imagem/Apagar from context menu
frontend/src/shell/TopBar.tsx                # X exit when settingsMode
frontend/src/shell/SettingsNav.tsx           # NEW: grouped nav items
frontend/src/pages/SettingsHomePage.tsx      # NEW: placeholder «Escolha uma definição»
frontend/src/pages/RolesManagePage.tsx       # NEW: RolesPanel content as page
frontend/src/pages/ServerImagePage.tsx       # NEW: owner image upload/remove in main
frontend/src/pages/ServerDeletePage.tsx      # NEW: owner confirm delete in main
frontend/src/pages/MembersManagePage.tsx     # in-settings back to settings home; TopBar X owns leave-mode
frontend/src/pages/RolePermissionsPage.tsx   # under settings paths; return → roles list
frontend/src/lib/settingsAccess.ts           # isSettingsPath, buildSettingsNav, hasAnySettingsAccess
frontend/src/styles/mesa-theme.css           # settings nav + placeholder + topbar X
```

**Structure Decision**: Canonical URL prefix `/servers/:serverId/settings/...` drives settings mode (sidebar + TopBar X). Redirect legacy `/servers/:id/members` and `/servers/:id/roles/:roleId/permissions` into the prefix so refresh/deep-link keeps settings chrome (SC-005).

**Note (plan refresh 2026-09-08)**: Artefactos Phase 0/1 já existiam e foram revalidados contra a spec clarificada + código actual (`SettingsNav`, `settingsAccess`, páginas settings, redirects). `RolesPanel` modal foi removido (substituído por `RolesManagePage`). `tasks.md` já existe e está marcado completo — `/speckit-plan` não regenera tasks.

## Complexity Tracking

> Sem violações. Complexidade aceite: unificar saída via TopBar X vs headers «Voltar» nas páginas — preferir X canónico e simplificar headers das páginas em settings.

## Phase 0 & 1 outputs

- [research.md](./research.md)
- [data-model.md](./data-model.md)
- [contracts/](./contracts/)
- [quickstart.md](./quickstart.md)
