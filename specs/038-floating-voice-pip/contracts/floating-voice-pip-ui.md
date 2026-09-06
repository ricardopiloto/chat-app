# Contract: Floating voice PiP UI

**Feature**: [038-floating-voice-pip](../spec.md)  
**Related**: [data-model.md](../data-model.md), barra [AppShell](../../../frontend/src/shell/AppShell.tsx), sessão [028](../../028-voice-call-roster/)

## No new HTTP/WS APIs

Visibilidade e média derivam de `VoiceSession` + rota + LiveKit `Room` no cliente.

## Visibility (shared with connected bar)

```text
showPip =
  voice.live()
  && voice.channelId() != null
  && routeParams.id !== voice.channelId()
```

When `showPip` is false, the miniature MUST NOT be in the accessibility tree (unmounted or `hidden`).

## Coexistence

When `showPip` is true, `.voice-connected-bar` MUST still render (FR-009). PiP MUST NOT replace bar actions (Sair remains on the bar).

## Layout & chrome

Root: `.voice-pip` (or equivalent) with:

1. **Identity strip** — channel name (and optional timer)  
2. **Primary action** — «Voltar à mesa» → navigate to `/channels/{channelId}?server=…&type=voice_video` (same as bar)  
3. **Media body** — video tiles OR status fallback  

### Video tiles

- Attach up to **4** camera video tracks (local + remote) from the active LiveKit room.  
- If zero camera tracks: show fallback text (channel name / «Em chamada») — MUST NOT hide the PiP.  
- Unmounting PiP MUST detach DOM only; MUST NOT stop LiveKit / GUM tracks.

## Corner snap

```text
Corner ∈ { top-right, top-left, bottom-right, bottom-left }
```

| Event | Required behavior |
|-------|-------------------|
| First show after reload / hangup | `top-right` |
| `pointerdown` + move on drag surface | free follow pointer within app bounds |
| `pointerup` | snap to **nearest** of 4 corners |
| Hide then show same call (no reload) | restore last `Corner` |
| Hangup / dropped | clear; next call starts `top-right` |
| Window resize | stay on current corner, clamped in app rect |

No mid-edge magnets in this delivery.

## Layering

- Above main channel content and connected bar.  
- Below modal dialogs / critical overlays (existing high z-index chrome).

## Accessibility

- Region `aria-label` includes call / channel name.  
- «Voltar à mesa» is a real `<button>` (or link) — keyboard reachable.  
- Drag target: not the only way to dismiss; Sair stays on the bar.

## Manual contract checks

1. In call on voice → open text → PiP top-right + bar both visible ≤2 s  
2. «Voltar à mesa» on PiP → full stage; PiP gone  
3. Drag to each corner → snaps; drop center → nearest  
4. No cameras → fallback still visible  
5. Sair on bar → PiP gone ≤2 s  
6. Reload mid-call (if session restored) + text → PiP at top-right again  
