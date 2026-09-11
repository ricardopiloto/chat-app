# Contract: Spotlight main stage + bottom strip (086)

**ID prefix**: SL  
**Surface**: Grade mode — screen-share spotlight only  
**Related**: [083 spotlight-unified](../083-grade-screen-tiles/contracts/spotlight-unified.md) (supersedes span-enlarge approach), [085 grade-screen-fit](../085-screen-share-fit/contracts/grade-screen-fit.md), [spec](../spec.md)

## Rules

| ID | Rule |
|----|------|
| SL-01 | With spotlight on a screen share, Grade MUST show that share in a **main stage region above** a **bottom filmstrip**. |
| SL-02 | Main stage MUST be the **majority** of the Grade stage height and fully visible (no crushed / off-stage tile). |
| SL-03 | Filmstrip MUST contain remaining **camera** tiles and **non-spotlighted screen** tiles (cams before other screens). |
| SL-04 | Activating spotlight MUST NOT shrink the spotlighted screen’s useful area below its pre-spotlight size (anti-hide). |
| SL-05 | Clearing spotlight MUST restore the **unified equal grid** (083); no leftover main+strip chrome. |
| SL-06 | Spotlight controls remain **screen tiles only**; cameras have no spotlight control. |
| SL-07 | Do **not** enlarge spotlight via `grid-row/column: span N` on the unified equal grid. |
| SL-08 | Screen videos in main and strip keep **show-all / contain** fit (085). |
| SL-09 | If strip would be empty (only the spotlighted screen), omit the strip; main fills the stage. |

## Non-goals

- Fullscreen outside Grade pane  
- Server-synced spotlight  
- Changing Composition / capture / occupancy  
