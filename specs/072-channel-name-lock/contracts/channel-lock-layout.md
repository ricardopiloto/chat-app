# Contract: Private channel lock layout (sidebar)

**Feature**: 072-channel-name-lock  
**Surface**: `Sidebar.tsx` channel rows + `mesa-theme.css` `.channel-item`

## DOM order (private)

```text
[prefix #|voice]  [name …]  [lock]
```

- Lock is **not** between `#` and name.
- Lock is visually **right-aligned** in the row.

## Visual rules

| Rule | Requirement |
|------|-------------|
| Public | No lock; name uses remaining row width (ellipsis OK). |
| Private | Lock at right; name has a **clear reserve** (padding / reduced useful width) under/before the icon so glyphs do **not** mix with the lock drawing. |
| Fade | Soft fade **MAY** apply only inside that reserved band — not as the sole separation. |
| Clip | No name glyph readable to the **right** of the lock. |
| Prefix | `#` / voice icon stays fully visible on the left. |

## Renaming / create editing

- Private rename row keeps lock on the right when feasible; rename wrap uses the same reserve padding as the name label.
- Create + rename name fields MUST **not** cause **horizontal scroll** of `.sidebar-nav`, the channel row, or the create form container when typing up to 32 characters.
- The input **MAY** scroll the caret internally; the outer layout stays stable (`flex:1; min-width:0; overflow` containment on wrap/row).

## Non-goals

- Changing pane header `# name` clip behavior (may show full ≤32 name).
- Changing lock meaning (still = private).
- Hard-cutting the name *before* the icon zone (not required if clear reserve + optional fade suffice).
