# Contract: TopBar theme cycle control

**Feature**: 057-system-theme-preference  
**Surface**: Authenticated `TopBar` theme button only

## Visibility

| Surface | Control |
|---------|---------|
| Authenticated TopBar | Cycle button present |
| Login / AuthShell | **No** theme control |

## Interaction

| Action | Preference transition |
|--------|----------------------|
| Click / activate | `system`(or absent as system) → `light` → `dark` → `system` → … |

Each activation **persists** the new preference (`system` included).

## Affordance

| Preference | Icon intent | Accessible name (PT) |
|------------|-------------|----------------------|
| system (or absent) | System / auto | «Tema: sistema» (or equivalent) |
| light | Sun | «Tema claro» |
| dark | Moon | «Tema escuro» |

Labels MUST reflect **preference**, not only effective theme when preference is system (e.g. OS dark + system pref → still labelled sistema, not «Tema escuro»).

## Cross-tab

When another tab changes `mesa.theme`, this button’s preference state and icons MUST update without reload (FR-009).

## Acceptance probes

1. Three clicks from system return to system; storage shows `system` after that click.
2. Absent key: button shows sistema; first click stores `light`.
3. Login page has no equivalent control.
4. Second tab updates icon/label within 2s after first tab cycles.
