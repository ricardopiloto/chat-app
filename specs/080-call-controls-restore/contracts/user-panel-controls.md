# Contract: User panel call controls (080)

**Feature**: [080-call-controls-restore](../spec.md)  
**Scope**: `UserPanel` + related CSS. No HTTP API.  
**Supersedes (partial)**: [078 user-panel-discord](../../078-user-panel-discord/contracts/user-panel-discord.md) UP-03, UP-05, UP-09.

## Layout (idle / out of call)

```text
[ identity ] [ mic ] [ deafen ] [ settings ]
```

Mic and deafen are **enabled** (session prefs). No chevrons. No leave. No camera/blur.

## Layout (in-call, off-stage or stage)

```text
[ identity ] [ leave ] [ mic ] [ deafen ] [ settings ]
```

Leave visible whenever live. Camera/blur still **not** on panel.

## MUST

| ID | Rule |
|----|------|
| UP80-01 | Camera and blur MUST NOT appear on `.user-panel` |
| UP80-02 | When `voice.live()`, leave MUST appear left of mic→deafen→settings — **including stage mode** |
| UP80-03 | When `!voice.live()`, leave MUST NOT appear |
| UP80-04 | Mic and deafen MUST be operable when `!live` (update session prefs); listen-only when known MAY disable mic |
| UP80-05 | Mic and deafen MUST be operable when live (existing behaviour; no regression) |
| UP80-06 | Mic and deafen MUST NOT show decorative chevrons |
| UP80-07 | Mic and deafen MUST use soft rounded corners (not sharp square, not full pill/circle) |

## Non-goals

- Device pickers
- Moving camera/blur onto the panel
