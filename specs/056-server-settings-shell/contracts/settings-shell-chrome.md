# Contract: Settings shell chrome

**Feature**: 056-server-settings-shell  
**Surfaces**: Sidebar header, TopBar, ServerRail

## Entry

| Control | When shown | Action |
|---------|------------|--------|
| Gear button | ≥1 settings nav item visible | `navigate(/servers/:serverId/settings)` |
| Server name click | Same gate as gear | Same navigate (no dropdown) |

MUST NOT open legacy «Membros / Perfis» dropdown.

## Settings sidebar

When path under `/servers/:serverId/settings`:

- Channel lists (Texto / Voz) MUST NOT be the primary sidebar content.
- Settings grouped nav MUST render (see [settings-nav-ia.md](./settings-nav-ia.md)).

## TopBar exit

When settings mode:

| Control | Visible label | a11y | Action |
|---------|---------------|------|--------|
| Close | Icon X only (no «Sair» text) | `aria-label` describing close settings | Leave settings → last channel / server home |

When not settings mode: X MUST NOT appear (normal topbar unchanged).

## Server rail context menu

MUST NOT include «Imagem do servidor» or «Apagar servidor».

## Acceptance probes

1. Gear → settings home + grouped sidebar; main placeholder.
2. Name click → same as gear.
3. X → channels restored.
4. Rail context: no image/delete.
5. Member with no manage roles and not owner: no gear.
