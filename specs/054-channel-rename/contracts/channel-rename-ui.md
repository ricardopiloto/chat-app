# Contract: Channel rename UI (Sidebar)

**Feature**: 054-channel-rename  
**Surface**: Channel name in `Sidebar` text/voice lists

## Start edit

| Input | When authorized | When not |
|-------|-----------------|----------|
| Double-click (pointer) | Enter inline edit | No edit / no navigation side-effect required beyond normal single-click |
| Double-tap (touch, ~300ms) | Enter inline edit | Same |

Single click/tap continues to navigate/select channel as today.

## While editing

- Input shows current name (selected for overwrite-friendly edit).
- **Enter** → submit if valid.
- **Escape** → cancel, restore previous name.
- **Blur** → submit if valid; if invalid/empty, restore previous (no silent empty name).

## After success

- List label shows new name immediately.
- Active channel chrome that displays the name updates without full app reload.

## Forbidden

- Offering inline edit to unauthorized users.
- Requiring a context-menu «Renomear» (optional extra, not required).

## Acceptance probes

1. Creator dblclick → type → Enter → label updates.
2. Unauthorized dblclick → no persistent edit mode that saves.
3. Empty submit → previous name restored + error feedback.
4. Touch double-tap path works in narrow drawer.
