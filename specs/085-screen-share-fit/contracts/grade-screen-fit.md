# Contract: Grade screen tile fit (085)

**ID prefix**: SF  
**Surface**: Grade mode voice pane — screen-share tiles only  
**Related**: [083 unified grid](../083-grade-screen-tiles/contracts/unified-grade-grid.md), [spec](../spec.md)

## Rules

| ID | Rule |
|----|------|
| SF-01 | Screen-share video inside a Grade screen tile MUST show the **entire** shared frame (no webcam-style crop-to-fill). |
| SF-02 | When shared aspect ratio ≠ tile aspect ratio, unused area MUST be **letterbox** with a **neutral dark / slot-like** fill. |
| SF-03 | Camera tiles in the same Grade MUST keep fill/crop behavior unchanged. |
| SF-04 | Local sharer preview screen tile MUST obey SF-01/SF-02 (same as remotes). |
| SF-05 | Spotlight-enlarged screen tiles MUST still obey SF-01/SF-02. |
| SF-06 | Composition, PiP, and non-Grade surfaces are **out of scope** (no required change). |
| SF-07 | Screen-share video MUST NOT be horizontally mirrored like a selfie webcam. |

## Non-goals

- Interactive zoom/pan on screen tiles  
- User toggle between fill and show-all  
- Backend or LiveKit publish changes  
