# Research: 056-server-settings-shell

## R1 — How to represent «settings mode»

**Decision**: Drive mode from the **URL prefix** `/servers/:serverId/settings` (and child paths). Sidebar/TopBar read the route; no parallel boolean that can desync from the address bar.

**Rationale**: Spec requires deep-link/refresh to keep settings chrome (SC-005). URL is the source of truth; gear/name navigate to `/servers/:id/settings` (placeholder).

**Alternatives considered**:
- Session/local signal only → breaks refresh.
- Infer from any `/members` or `/roles/.../permissions` without prefix → ambiguous if other server pages appear later; prefix is clearer.

## R2 — Landing after gear / name click

**Decision**: Navigate to `/servers/:serverId/settings` → `SettingsHomePage` placeholder only (no auto-select). Item clicks go to child routes.

**Rationale**: Clarify session answer A / FR-003.

**Alternatives considered**: Auto-open Membros — rejected in clarify.

## R3 — Nav IA (groups & items)

**Decision** (labels may be tuned in UI copy):

| Group | Items | Who sees |
|-------|--------|----------|
| Pessoas | Membros | Owner **or** `can_manage_roles` (same gate as today’s members entry) |
| Funções | Perfis | Owner **or** `can_manage_roles` |
| Servidor | Imagem do servidor, Apagar servidor | **Owner only** |

Gear / name shortcut visible iff **at least one** item would be visible.

**Rationale**: Matches clarify D + current `canManageRoles` menu gate; owner always has Servidor group.

**Alternatives considered**: Show all items disabled — spec allows hide **or** disable; prefer **hide** for cleaner IA (FR-005).

## R4 — Perfis as page

**Decision**: New `RolesManagePage` at `/servers/:id/settings/roles` reusing `RolesPanel` list/create/delete/permissions-link logic **without** `Dialog` wrapper. Permissions stay at `/servers/:id/settings/roles/:roleId/permissions` (redirect from old path).

**Rationale**: Clarify A / FR-008a.

**Alternatives considered**: Keep modal inside settings — rejected.

## R5 — Exit (TopBar X)

**Decision**: TopBar shows icon-only close (`aria-label` e.g. «Fechar configurações») when `settingsMode`. Navigates to last channel for that server (`channelHref` / `writeLastChannel` prefs) or `/servers/:id` fallback — **not** a textual «Sair».

**Rationale**: FR-006/007. Page-local «Voltar» on MembersManage can remain as secondary or be demoted; canonical exit is X.

**Alternatives considered**: Only page headers for exit — fails TopBar requirement.

## R6 — Rail context menu

**Decision**: Remove «Imagem do servidor» and «Apagar servidor» from `openServerMenu` / rail long-press. If menu becomes empty for owner, omit context menu entirely for that target (or keep only if other items exist later).

**Rationale**: Clarify B / FR-011.

## R7 — Backend

**Decision**: **No** backend changes. Image upload and delete APIs already exist.

**Rationale**: Shell-only feature.

## R8 — Voice session while in settings

**Decision**: Entering settings leaves the channel route; existing voice PiP / session behaviour unchanged. Do not specially keep chat mounted under settings.

**Rationale**: FR-003 requires main not to show chat; voice can continue via existing floating session if already live.
