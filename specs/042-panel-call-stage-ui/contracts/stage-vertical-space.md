# Contract: Stage vertical space

**Feature**: 042-panel-call-stage-ui  
**Surface**: `frontend/src/styles/mesa-theme.css` (`.stage`, `.voice-pane .pane-header`, `.privacy-line`)

## Goal

When viewing the active voice stage in a call, the stage grid’s usable height MUST increase by roughly **40–80px** vs pre-042, by compacting:

1. `.stage` vertical margin / padding  
2. Voice pane header vertical chrome  
3. Privacy line spacing (if present under call-controls)

## MUST NOT

- Hide or disable stage call-controls.
- Rely solely on increasing `min-height` without reclaiming chrome (optional bump only as secondary).
- Break narrow/drawer stage layout (slots remain visible; no pathological overflow).

## Validation

Before/after screenshot or DevTools computed height of `.stage` on the same desktop viewport in stage-mode (channels expanded OK).
