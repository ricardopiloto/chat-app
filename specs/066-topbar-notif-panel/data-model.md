# Data Model: 066-topbar-notif-panel

Sem persistência. Modelo de **layout / empilhamento**.

## Surfaces

| Surface | Role |
|---------|------|
| **Topbar** | Barra superior; hoje com overflow que corta descendentes |
| **Botão Notificações** | Toggle do painel |
| **Painel de notificações** | Dropdown absoluto sob o botão; deve pintar **fora** da caixa do topbar sem ser clipado |

## State (unchanged)

| State | Notes |
|-------|-------|
| `notifOpen` | boolean no TopBar (já existe) |
| open → closed | Unmount do painel; sem overlay residual |

## Validation rules

1. Com painel aberto, a caixa do painel MUST intersect the viewport below (or clear of) the topbar content area such that list text is readable.
2. Clicks on list items MUST hit the panel, not be swallowed by an opaque topbar layer.
3. Closed → no hit-target covering main app.
