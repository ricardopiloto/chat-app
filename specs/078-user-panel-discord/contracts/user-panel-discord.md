# Contract: User panel Discord layout (078)

**Feature**: [078-user-panel-discord](../spec.md)  
**Scope**: Frontend shell `UserPanel` + related CSS. No HTTP API.

## Layout (idle)

```text
[ identity: avatar+dot | handle / online ] ........ [ mic▾ ] [ deafen▾ ] [ settings ]
```

## Layout (in-call, off-stage)

```text
[ identity ] [ leave ] [ mic▾ ] [ deafen▾ ] [ settings ]
```

## Layout (in-call, on stage)

```text
[ identity ] [ mic▾ ] [ deafen▾ ] [ settings ]
```

Stage/voice chrome owns leave + camera + blur (not duplicated on panel).

## MUST

| ID | Rule |
|----|------|
| UP-01 | Camera and blur controls MUST NOT appear on `.user-panel` in any shell state |
| UP-02 | Mic, deafen, settings MUST be visible whenever authenticated shell shows the panel |
| UP-03 | Mic/deafen MUST be disabled (no effect) when not in a voice session |
| UP-04 | Mic/deafen MUST work when live, including while stage-mode |
| UP-05 | Mic and deafen MUST show icon + chevron visual; chevron MUST NOT open a device menu in this feature |
| UP-06 | Identity: primary = handle; secondary = online status string; avatar online indicator present |
| UP-07 | Identity click / settings → existing account menu entry path |
| UP-08 | When live and not stage: leave MUST appear left of mic→deafen→settings |
| UP-09 | When stage: leave MUST NOT appear on the panel |

## Non-goals

- Input/output device pickers
- Display-name account field
- Pixel-perfect Discord theming of the whole app
