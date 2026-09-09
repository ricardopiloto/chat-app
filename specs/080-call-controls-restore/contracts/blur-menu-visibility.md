# Contract: Blur menu visibility (080)

**Feature**: [080-call-controls-restore](../spec.md)  
**Scope**: `CameraBlurMenu` + voice-pane stacking/overflow CSS. No HTTP API.

## MUST

| ID | Rule |
|----|------|
| BM-01 | When blur menu is open, all menu options MUST be fully visible (not clipped by `.pane-header` or voice chrome) |
| BM-02 | Clicks on menu items MUST activate the option — header MUST NOT intercept |
| BM-03 | Closing the menu (Escape, outside click, or selection) MUST restore normal header behaviour |
| BM-04 | Applies to blur opened from camera-adjacent / preview / bottom-bar anchors in the voice pane |

## Allowed approaches

- Higher z-index than header stacking context
- `overflow: visible` on clipping ancestors
- Flip open direction (down vs up) when near the top
- Portal to body if CSS alone cannot satisfy BM-01/02

## Non-goals

- Fixing unrelated overlays outside blur menu (minimum scope is blur menu)
