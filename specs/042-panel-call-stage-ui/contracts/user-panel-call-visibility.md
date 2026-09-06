# Contract: User panel call visibility & icons

**Feature**: 042-panel-call-stage-ui  
**Surface**: `frontend/src/shell/UserPanel.tsx` + `.user-panel-*` CSS

## Visibility

| Condição | Grupo `.user-panel-calls` |
|----------|---------------------------|
| `!voice.live()` | **MUST NOT** render (no disabled chrome) |
| `live && viewingActiveVoiceStage` | **MUST NOT** render |
| `live && !viewingActiveVoiceStage` | **MUST** render, controls enabled |

Identity / settings (FR-008) always remain.

## Icons

- Mic, deafen, camera primary, hangup: **same visual size**, base = current panel microphone glyph size.
- Shared hit height (existing `.user-panel-ctrl` box OK if glyphs centered equally).
- Blur chevron may stay narrower/smaller.
- MUST NOT require matching stage call-control icon size.

## Supersedes

039 «visible but disabled when not in call» for the panel call group — replaced by hide.
